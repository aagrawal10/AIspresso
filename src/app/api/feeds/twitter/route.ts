import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.error('🐦 Missing Twitter Bearer Token');
    return NextResponse.json({ error: 'Missing Twitter Bearer Token' }, { status: 500 });
  }

  try {
    const listIds = process.env.TWITTER_LIST_IDS?.split(',') || [];
    if (listIds.length === 0) {
      console.warn('🐦 No Twitter lists configured');
      return NextResponse.json({ posts: [] });
    }

    const allTweets: any[] = [];
    
    for (const listId of listIds) {
      const tweets = await fetchListTweets(listId.trim(), bearerToken);
      allTweets.push(...tweets);
    }

    console.log(`🐦 Twitter API: Successfully fetched ${allTweets.length} total tweets`);
    return NextResponse.json({ posts: allTweets });
  } catch (error) {
    console.error('🐦 Error fetching Twitter posts:', error);
    return NextResponse.json({ error: 'Failed to fetch Twitter posts' }, { status: 500 });
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

    console.log(`🐦 Twitter API: Fetching from list ${listId}`);
    console.log(`🐦 Twitter API URL: ${url}?${params}`);
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'User-Agent': 'AIspresso/1.0.0',
      },
    });

    console.log(`🐦 Twitter API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🐦 Twitter API error: ${response.status} ${response.statusText}`);
      console.error(`🐦 Twitter API error details:`, errorText);
      return [];
    }

    const data: TwitterResponse = await response.json();
    console.log(`🐦 Twitter API Response data:`, data);
    
    if (!data.data) {
      console.log(`🐦 Twitter API: No data.data field in response`);
      return [];
    }

    const users = new Map(
      (data.includes?.users || []).map(user => [user.id, user])
    );

    const posts = data.data.map(tweet => convertToPost(tweet, users));
    console.log(`🐦 Twitter API: Successfully converted ${posts.length} tweets from list ${listId}`);
    return posts;
  } catch (error) {
    console.error(`🐦 Error fetching tweets from list ${listId}:`, error);
    return [];
  }
}

function convertToPost(tweet: TwitterTweet, users: Map<string, TwitterUser>) {
  const author = users.get(tweet.author_id);
  const embedData = {
    type: 'twitter' as const,
    tweetId: tweet.id,
  };

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
    embedData,
  };
}