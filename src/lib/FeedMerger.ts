import { Post } from '@/types';
import { SeenTracker } from './SeenTracker';

export class FeedMerger {
  static mergePosts(posts: Post[]): Post[] {
    const uniquePosts = this.removeDuplicates(posts);
    return this.sortByTimestamp(uniquePosts);
  }

  static filterNewPosts(posts: Post[]): { newPosts: Post[]; allCaughtUp: boolean } {
    if (posts.length === 0) {
      return { newPosts: [], allCaughtUp: true };
    }

    const postsBySource = this.groupPostsBySource(posts);
    const newPosts: Post[] = [];
    let hasNewContent = false;

    for (const [source, sourcePosts] of Array.from(postsBySource.entries())) {
      const { timestamp: lastSeenTimestamp } = SeenTracker.getLastSeen(source as any);
      const newSourcePosts = sourcePosts.filter(post => post.timestamp > lastSeenTimestamp);
      
      if (newSourcePosts.length > 0) {
        hasNewContent = true;
        newPosts.push(...newSourcePosts);
      }
    }

    return {
      newPosts: this.sortByTimestamp(newPosts),
      allCaughtUp: !hasNewContent,
    };
  }

  static markPostsAsSeen(posts: Post[]): void {
    const postsBySource = this.groupPostsBySource(posts);
    
    for (const [source, sourcePosts] of Array.from(postsBySource.entries())) {
      if (sourcePosts.length > 0) {
        SeenTracker.markAllSeen(source as any, sourcePosts);
      }
    }
  }

  private static removeDuplicates(posts: Post[]): Post[] {
    const seen = new Set<string>();
    return posts.filter(post => {
      if (seen.has(post.id)) {
        return false;
      }
      seen.add(post.id);
      return true;
    });
  }

  private static sortByTimestamp(posts: Post[]): Post[] {
    return posts.sort((a, b) => b.timestamp - a.timestamp);
  }

  private static groupPostsBySource(posts: Post[]): Map<string, Post[]> {
    const grouped = new Map<string, Post[]>();
    
    for (const post of posts) {
      const existing = grouped.get(post.source) || [];
      existing.push(post);
      grouped.set(post.source, existing);
    }
    
    return grouped;
  }

  static getSourceStats(posts: Post[]): Record<string, { count: number; latest: number }> {
    const stats: Record<string, { count: number; latest: number }> = {};
    
    for (const post of posts) {
      if (!stats[post.source]) {
        stats[post.source] = { count: 0, latest: 0 };
      }
      stats[post.source].count++;
      stats[post.source].latest = Math.max(stats[post.source].latest, post.timestamp);
    }
    
    return stats;
  }
}