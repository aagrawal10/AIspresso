import { Post, FeedConfig, FeedFetcherInterface, PostSource } from '@/types';

export class FeedFetcher {
  private static fetchers: Map<PostSource, FeedFetcherInterface> = new Map();

  static registerFetcher(fetcher: FeedFetcherInterface): void {
    this.fetchers.set(fetcher.getSourceName(), fetcher);
  }

  static async fetchFromSource(config: FeedConfig): Promise<Post[]> {
    const fetcher = this.fetchers.get(config.source);
    if (!fetcher) {
      console.warn(`No fetcher registered for source: ${config.source}`);
      return [];
    }

    try {
      return await fetcher.fetchPosts(config);
    } catch (error) {
      console.error(`Error fetching from ${config.source}:`, error);
      return [];
    }
  }

  static async fetchFromAllSources(configs: FeedConfig[]): Promise<Post[]> {
    const enabledConfigs = configs.filter(config => config.enabled);
    
    const results = await Promise.allSettled(
      enabledConfigs.map(config => this.fetchFromSource(config))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<Post[]> => 
        result.status === 'fulfilled'
      )
      .flatMap(result => result.value);
  }

  static getRegisteredSources(): PostSource[] {
    return Array.from(this.fetchers.keys());
  }
}