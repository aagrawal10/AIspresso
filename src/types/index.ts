export interface Post {
  id: string;
  source: PostSource;
  title: string;
  url?: string;
  content?: string;
  author: string;
  timestamp: number;
  score?: number;
  commentsCount?: number;
  commentsUrl?: string;
  thumbnail?: string;
  embedData?: EmbedData;
}

export type PostSource = 'hackernews' | 'reddit' | 'twitter' | 'youtube' | 'arxiv' | 'github';

export interface EmbedData {
  type: 'reddit' | 'twitter' | 'youtube';
  embedUrl?: string;
  postId?: string;
  subreddit?: string;
  tweetId?: string;
  videoId?: string;
}

export interface FeedConfig {
  source: PostSource;
  enabled: boolean;
  lastSeen?: number;
  lastFetched?: number;
  config?: SourceConfig;
}

export interface SourceConfig {
  subreddits?: string[];
  twitterLists?: string[];
  youtubeChannels?: string[];
  githubTrends?: 'daily' | 'weekly' | 'monthly';
}

export interface SeenState {
  [source: string]: {
    lastSeenTimestamp: number;
    lastSeenId?: string;
  };
}

export interface FeedFetcherInterface {
  fetchPosts(config: FeedConfig): Promise<Post[]>;
  getSourceName(): PostSource;
}

export interface DashboardSettings {
  refreshInterval: number;
  postsPerPage: number;
  enabledSources: PostSource[];
  sourceConfigs: Record<PostSource, SourceConfig>;
}