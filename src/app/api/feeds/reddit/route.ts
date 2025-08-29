import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.error('🔴 Unable to get Reddit access token');
      return NextResponse.json({ error: 'Unable to get Reddit access token' }, { status: 500 });
    }

    const subreddits = process.env.REDDIT_SUBREDDITS?.split(',') || [];
    if (subreddits.length === 0) {
      console.warn('🔴 No Reddit subreddits configured');
      return NextResponse.json({ posts: [] });
    }

    const allPosts: any[] = [];
    
    for (const subreddit of subreddits) {
      const posts = await fetchSubredditPosts(subreddit.trim(), accessToken);
      allPosts.push(...posts);
    }

    // Sort by timestamp (newest first)
    allPosts.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`🔴 Reddit API: Successfully returned ${allPosts.length} posts from ${subreddits.length} subreddits`);
    return NextResponse.json({ posts: allPosts });
  } catch (error) {
    console.error('🔴 Error fetching Reddit posts:', error);
    return NextResponse.json({ error: 'Failed to fetch Reddit posts' }, { status: 500 });
  }
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  console.log('🔴 Reddit API: Getting access token');
  console.log('🔴 Reddit API: Client ID present:', !!clientId);
  console.log('🔴 Reddit API: Client Secret present:', !!clientSecret);
  console.log('🔴 Reddit API: Username present:', !!username);
  console.log('🔴 Reddit API: Password present:', !!password);

  if (!clientId || !clientSecret || !username || !password) {
    console.error('🔴 Missing Reddit API credentials');
    return null;
  }

  try {
    console.log('🔴 Reddit API: Making token request to /api/v1/access_token');
    
    // Use Buffer on server-side (Node.js)
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

    console.log(`🔴 Reddit API Token Response: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('🔴 Reddit API Token Response data:', data);
    
    if (data.access_token) {
      console.log('🔴 Reddit API: Access token received successfully');
      return data.access_token;
    } else {
      console.log('🔴 Reddit API: No access token in response');
      return null;
    }
  } catch (error) {
    console.error('🔴 Error getting Reddit access token:', error);
    return null;
  }
}

async function fetchSubredditPosts(subreddit: string, accessToken: string): Promise<any[]> {
  try {
    // Fetch new posts from specific subreddit
    const url = `https://oauth.reddit.com/r/${subreddit}/new?limit=25`;
    console.log(`🔴 Reddit API: Fetching new posts from r/${subreddit}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'AIspresso/1.0.0',
      },
    });

    console.log(`🔴 Reddit API r/${subreddit} Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔴 Reddit API r/${subreddit} error: ${response.status} ${response.statusText}`);
      console.error(`🔴 Reddit API error details:`, errorText);
      return [];
    }
    
    const data: RedditResponse = await response.json();
    console.log(`🔴 Reddit API r/${subreddit} data structure:`, {
      dataExists: !!data.data,
      childrenLength: data.data?.children?.length || 0
    });
    
    if (!data.data || !data.data.children) {
      console.log(`🔴 Reddit API: No posts found in r/${subreddit}`);
      return [];
    }
    
    const posts = data.data.children.map(child => child.data);
    const convertedPosts = posts.map(post => convertToPost(post, subreddit));
    console.log(`🔴 Reddit API: Successfully fetched ${posts.length} posts from r/${subreddit}`);
    return convertedPosts;
  } catch (error) {
    console.error(`🔴 Error fetching posts from r/${subreddit}:`, error);
    return [];
  }
}

function convertToPost(post: RedditPost, subredditName: string) {
  const embedData = {
    type: 'reddit' as const,
    postId: post.id,
    subreddit: post.subreddit,
  };

  return {
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
    embedData,
    subreddit: subredditName, // Add subreddit for easier identification
  };
}