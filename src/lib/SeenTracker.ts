import { SeenState, PostSource } from '@/types';

export class SeenTracker {
  private static readonly STORAGE_KEY = 'aispresso_seen_state';

  static getSeenState(): SeenState {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static setLastSeen(source: PostSource, timestamp: number, postId?: string): void {
    if (typeof window === 'undefined') return;

    const state = this.getSeenState();
    state[source] = {
      lastSeenTimestamp: timestamp,
      lastSeenId: postId,
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save seen state:', error);
    }
  }

  static getLastSeen(source: PostSource): { timestamp: number; postId?: string } {
    const state = this.getSeenState();
    const sourceState = state[source];
    
    return {
      timestamp: sourceState?.lastSeenTimestamp || 0,
      postId: sourceState?.lastSeenId,
    };
  }

  static markAllSeen(source: PostSource, posts: any[]): void {
    if (posts.length === 0) return;

    const latest = posts.reduce((latest, post) => 
      post.timestamp > latest.timestamp ? post : latest
    );

    this.setLastSeen(source, latest.timestamp, latest.id);
  }

  static clearSeenState(source?: PostSource): void {
    if (typeof window === 'undefined') return;

    if (source) {
      const state = this.getSeenState();
      delete state[source];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}