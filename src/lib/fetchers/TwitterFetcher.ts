import { Post, FeedConfig, FeedFetcherInterface } from '@/types';

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

export class TwitterFetcher implements FeedFetcherInterface {
  private static readonly BASE_URL = 'https://api.twitter.com/2';

  getSourceName() {
    return 'twitter' as const;
  }

  async fetchPosts(config: FeedConfig): Promise<Post[]> {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.error('Missing Twitter Bearer Token');
      return [];
    }

    try {
      const listIds = process.env.TWITTER_LIST_IDS?.split(',') || [];
      if (listIds.length === 0) {
        console.warn('No Twitter lists configured');
        return [];
      }

      const allTweets: Post[] = [];
      
      for (const listId of listIds) {
        const tweets = await this.fetchListTweets(listId.trim(), bearerToken);
        allTweets.push(...tweets);
      }

      return allTweets;
    } catch (error) {
      console.error('Error fetching Twitter posts:', error);
      return [];
    }
  }

  private async fetchListTweets(listId: string, bearerToken: string): Promise<Post[]> {
    try {
      const url = `${TwitterFetcher.BASE_URL}/lists/${listId}/tweets`;
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
        console.error(`Twitter API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: TwitterResponse = await response.json();
      
      if (!data.data) {
        return [];
      }

      const users = new Map(
        (data.includes?.users || []).map(user => [user.id, user])
      );

      return data.data.map(tweet => TwitterFetcher.convertToPost(tweet, users));
    } catch (error) {
      console.error(`Error fetching tweets from list ${listId}:`, error);
      return [];
    }
  }

  private static convertToPost(tweet: TwitterTweet, users: Map<string, TwitterUser>): Post {
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
}