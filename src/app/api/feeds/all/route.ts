import { NextRequest, NextResponse } from 'next/server';

// Reddit interfaces
interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
  thumbnail?: string;
  is_video?: boolean;
  is_self?: boolean;
  selftext?: string;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

// Twitter interfaces
interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
  attachments?: {
    media_keys?: string[];
  };
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TwitterResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
    media?: any[];
  };
}

// Hacker News interfaces
interface HackerNewsItem {
  id: number;
  title?: string;
  url?: string;
  by?: string;
  time?: number;
  score?: number;
  kids?: number[];
  text?: string;
  type?: string;
}

export async function GET(request: NextRequest) {
  console.log('🌟 Fetching all feeds...');
  
  const allPosts: any[] = [];
  
  // Fetch Hacker News
  try {
    const hnPosts = await fetchHackerNews();
    allPosts.push(...hnPosts);
    console.log(`🟠 Fetched ${hnPosts.length} Hacker News posts`);
  } catch (error) {
    console.error('🟠 Error fetching Hacker News:', error);
  }
  
  // Fetch Reddit
  try {
    const redditPosts = await fetchReddit();
    allPosts.push(...redditPosts);
    console.log(`🔴 Fetched ${redditPosts.length} Reddit posts`);
  } catch (error) {
    console.error('🔴 Error fetching Reddit:', error);
  }
  
  // Fetch Twitter
  try {
    const twitterPosts = await fetchTwitter();
    allPosts.push(...twitterPosts);
    console.log(`🐦 Fetched ${twitterPosts.length} Twitter posts`);
  } catch (error) {
    console.error('🐦 Error fetching Twitter:', error);
  }
  
  // Sort all posts by timestamp (newest first)
  allPosts.sort((a, b) => b.timestamp - a.timestamp);
  
  console.log(`🌟 Total posts fetched: ${allPosts.length}`);
  
  return NextResponse.json({ 
    posts: allPosts,
    sources: {
      hackerNews: allPosts.filter(p => p.source === 'hackernews').length,
      reddit: allPosts.filter(p => p.source === 'reddit').length,
      twitter: allPosts.filter(p => p.source === 'twitter').length
    }
  });
}

// Hacker News fetcher
async function fetchHackerNews(): Promise<any[]> {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const storyIds = await response.json();
    
    const stories = await Promise.all(
      storyIds.slice(0, 25).map(async (id: number) => {
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return storyResponse.json();
      })
    );
    
    return stories
      .filter((story: HackerNewsItem) => story && story.title)
      .map((story: HackerNewsItem) => ({
        id: `hackernews-${story.id}`,
        source: 'hackernews',
        title: story.title,
        url: story.url,
        author: story.by,
        timestamp: (story.time || 0) * 1000,
        score: story.score,
        commentsCount: story.kids?.length || 0,
        commentsUrl: `https://news.ycombinator.com/item?id=${story.id}`,
        embedData: {
          type: 'hackernews' as const,
          storyId: story.id.toString(),
        },
      }));
  } catch (error) {
    console.error('🟠 Error in fetchHackerNews:', error);
    return [];
  }
}

// Reddit fetcher
async function fetchReddit(): Promise<any[]> {
  try {
    const accessToken = await getRedditAccessToken();
    if (!accessToken) {
      console.error('🔴 Unable to get Reddit access token');
      return [];
    }

    const subreddits = process.env.REDDIT_SUBREDDITS?.split(',') || [];
    if (subreddits.length === 0) {
      console.warn('🔴 No Reddit subreddits configured');
      return [];
    }

    const allPosts: any[] = [];
    
    for (const subreddit of subreddits) {
      const posts = await fetchSubredditPosts(subreddit.trim(), accessToken);
      allPosts.push(...posts);
    }

    return allPosts;
  } catch (error) {
    console.error('🔴 Error in fetchReddit:', error);
    return [];
  }
}

async function getRedditAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    console.error('🔴 Missing Reddit API credentials');
    return null;
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AIspresso/1.0.0',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username,
        password,
      }),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('🔴 Error getting Reddit access token:', error);
    return null;
  }
}

async function fetchSubredditPosts(subreddit: string, accessToken: string): Promise<any[]> {
  try {
    const url = `https://oauth.reddit.com/r/${subreddit}/new?limit=25`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'AIspresso/1.0.0',
      },
    });

    if (!response.ok) {
      console.error(`🔴 Reddit API r/${subreddit} error: ${response.status}`);
      return [];
    }
    
    const data: RedditResponse = await response.json();
    
    if (!data.data || !data.data.children) {
      return [];
    }
    
    const posts = data.data.children.map(child => child.data);
    return posts.map(post => ({
      id: `reddit-${post.id}`,
      source: 'reddit',
      title: post.title,
      url: post.is_self ? undefined : post.url,
      content: post.is_self ? post.selftext : undefined,
      author: post.author,
      timestamp: post.created_utc * 1000,
      score: post.score,
      commentsCount: post.num_comments,
      commentsUrl: `https://www.reddit.com${post.permalink}`,
      thumbnail: post.thumbnail && !['self', 'default', 'nsfw'].includes(post.thumbnail) 
        ? post.thumbnail 
        : undefined,
      embedData: {
        type: 'reddit' as const,
        postId: post.id,
        subreddit: post.subreddit,
      },
      subreddit: subreddit,
    }));
  } catch (error) {
    console.error(`🔴 Error fetching posts from r/${subreddit}:`, error);
    return [];
  }
}

// Twitter fetcher
async function fetchTwitter(): Promise<any[]> {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.error('🐦 Missing Twitter Bearer Token');
      return [];
    }

    const listIds = process.env.TWITTER_LIST_IDS?.split(',') || [];
    if (listIds.length === 0) {
      console.warn('🐦 No Twitter lists configured');
      return [];
    }

    const allTweets: any[] = [];
    
    for (const listId of listIds) {
      const tweets = await fetchListTweets(listId.trim(), bearerToken);
      allTweets.push(...tweets);
    }

    return allTweets;
  } catch (error) {
    console.error('🐦 Error in fetchTwitter:', error);
    return [];
  }
}

async function fetchListTweets(listId: string, bearerToken: string): Promise<any[]> {
  try {
    const url = `https://api.twitter.com/2/lists/${listId}/tweets`;
    const params = new URLSearchParams({
      'tweet.fields': 'created_at,author_id,public_metrics,attachments',
      'expansions': 'author_id',
      'user.fields': 'username,name',
      'max_results': '25',
    });
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'User-Agent': 'AIspresso/1.0.0',
      },
    });

    if (!response.ok) {
      console.error(`🐦 Twitter API error: ${response.status}`);
      return [];
    }

    const data: TwitterResponse = await response.json();
    
    if (!data.data) {
      return [];
    }

    const users = new Map(
      (data.includes?.users || []).map(user => [user.id, user])
    );

    return data.data.map(tweet => {
      const author = users.get(tweet.author_id);
      return {
        id: `twitter-${tweet.id}`,
        source: 'twitter',
        title: tweet.text.length > 100 
          ? `${tweet.text.substring(0, 97)}...` 
          : tweet.text,
        content: tweet.text,
        author: author ? `@${author.username}` : tweet.author_id,
        timestamp: new Date(tweet.created_at).getTime(),
        score: tweet.public_metrics?.like_count,
        commentsCount: tweet.public_metrics?.reply_count,
        commentsUrl: `https://twitter.com/i/status/${tweet.id}`,
        embedData: {
          type: 'twitter' as const,
          tweetId: tweet.id,
        },
      };
    });
  } catch (error) {
    console.error(`🐦 Error fetching tweets from list ${listId}:`, error);
    return [];
  }
}