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
      const tweets = await fetchListTweetsOptimized(listId.trim(), bearerToken);
      allTweets.push(...tweets);
    }

    console.log(`🐦 Twitter API: Successfully fetched ${allTweets.length} total tweets`);
    return NextResponse.json({ posts: allTweets });
  } catch (error) {
    console.error('🐦 Error fetching Twitter posts:', error);
    return NextResponse.json({ error: 'Failed to fetch Twitter posts' }, { status: 500 });
  }
}

import { PostTrackingService } from '@/lib/postTracker';

async function fetchListTweetsOptimized(listId: string, bearerToken: string): Promise<any[]> {
  try {
    // First, fetch just 1 tweet to check if it's new
    console.log(`🐦 Twitter API: Checking latest tweet from list ${listId} (quota-saving mode)`);
    const latestTweet = await fetchTweets(listId, bearerToken, 1);
    
    if (latestTweet.length === 0) {
      console.log(`🐦 Twitter API: No tweets found in list ${listId}`);
      return [];
    }

    // Check if the latest tweet is new using a simple file read
    const fs = require('fs');
    const path = require('path');
    const trackerFile = path.join(process.cwd(), '.post-tracker.json');
    
    let seenTwitterIds: string[] = [];
    try {
      if (fs.existsSync(trackerFile)) {
        const trackerData = JSON.parse(fs.readFileSync(trackerFile, 'utf-8'));
        seenTwitterIds = trackerData.lastSeen?.twitter || [];
      }
    } catch (e) {
      console.log('🐦 Could not read tracker file, assuming all tweets are new');
    }

    const latestTweetId = latestTweet[0].id.replace('twitter-', '');
    const isLatestTweetNew = !seenTwitterIds.includes(latestTweetId);

    if (!isLatestTweetNew) {
      console.log(`🐦 Twitter API: Latest tweet from list ${listId} is already seen, skipping full fetch (saved 24 tweets worth of quota)`);
      return [];
    }

    // If latest tweet is new, fetch full batch
    console.log(`🐦 Twitter API: Latest tweet is new, fetching full batch from list ${listId}`);
    return await fetchTweets(listId, bearerToken, 25);

  } catch (error) {
    console.error(`🐦 Error in optimized fetch for list ${listId}:`, error);
    return [];
  }
}

async function fetchTweets(listId: string, bearerToken: string, maxResults: number): Promise<any[]> {
  try {
    const url = `https://api.twitter.com/2/lists/${listId}/tweets`;
    const params = new URLSearchParams({
      'tweet.fields': 'created_at,author_id,public_metrics,attachments',
      'expansions': 'author_id',
      'user.fields': 'username,name',
      'max_results': maxResults.toString(),
    });

    console.log(`🐦 Twitter API: Fetching ${maxResults} tweets from list ${listId}`);
    
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