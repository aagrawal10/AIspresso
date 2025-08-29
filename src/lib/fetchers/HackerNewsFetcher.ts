import { Post, FeedConfig, FeedFetcherInterface } from '@/types';

interface HNItem {
  id: number;
  title?: string;
  url?: string;
  by: string;
  time: number;
  score?: number;
  descendants?: number;
  type: string;
}

export class HackerNewsFetcher implements FeedFetcherInterface {
  private static readonly BASE_URL = 'https://hacker-news.firebaseio.com/v0';
  private static readonly TOP_STORIES_URL = `${HackerNewsFetcher.BASE_URL}/topstories.json`;
  private static readonly ITEM_URL = `${HackerNewsFetcher.BASE_URL}/item`;

  getSourceName() {
    return 'hackernews' as const;
  }

  async fetchPosts(config: FeedConfig): Promise<Post[]> {
    try {
      const topStoriesResponse = await fetch(HackerNewsFetcher.TOP_STORIES_URL);
      const topStoryIds: number[] = await topStoriesResponse.json();

      const storyIds = topStoryIds.slice(0, 50);
      
      const storyPromises = storyIds.map(async (id) => {
        try {
          const response = await fetch(`${HackerNewsFetcher.ITEM_URL}/${id}.json`);
          return await response.json() as HNItem;
        } catch {
          return null;
        }
      });

      const stories = await Promise.all(storyPromises);
      const validStories = stories.filter((story): story is HNItem => 
        story !== null && story.type === 'story' && !!story.title
      );

      return validStories.map(HackerNewsFetcher.convertToPost);
    } catch (error) {
      console.error('Error fetching Hacker News posts:', error);
      return [];
    }
  }

  private static convertToPost(item: HNItem): Post {
    return {
      id: `hn-${item.id}`,
      source: 'hackernews',
      title: item.title || '',
      url: item.url,
      author: item.by,
      timestamp: item.time * 1000,
      score: item.score,
      commentsCount: item.descendants,
      commentsUrl: `https://news.ycombinator.com/item?id=${item.id}`,
    };
  }
}