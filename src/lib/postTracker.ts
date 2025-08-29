import fs from 'fs';
import path from 'path';

interface PostTracker {
  lastSeen: {
    hackernews: string[]; // array of post IDs
    reddit: string[];
    twitter: string[];
  };
  lastUpdated: number;
}

const TRACKER_FILE = path.join(process.cwd(), '.post-tracker.json');

export class PostTrackingService {
  private static tracker: PostTracker | null = null;

  private static loadTracker(): PostTracker {
    if (this.tracker) return this.tracker;

    try {
      if (fs.existsSync(TRACKER_FILE)) {
        const data = fs.readFileSync(TRACKER_FILE, 'utf-8');
        this.tracker = JSON.parse(data);
      } else {
        this.tracker = {
          lastSeen: {
            hackernews: [],
            reddit: [],
            twitter: []
          },
          lastUpdated: Date.now()
        };
      }
    } catch (error) {
      console.error('Error loading post tracker:', error);
      this.tracker = {
        lastSeen: {
          hackernews: [],
          reddit: [],
          twitter: []
        },
        lastUpdated: Date.now()
      };
    }

    return this.tracker;
  }

  private static saveTracker(): void {
    if (!this.tracker) return;

    try {
      fs.writeFileSync(TRACKER_FILE, JSON.stringify(this.tracker, null, 2));
    } catch (error) {
      console.error('Error saving post tracker:', error);
    }
  }

  static filterNewPosts(posts: any[]): { newPosts: any[], hasNewContent: boolean, sourcesWithNew: string[] } {
    const tracker = this.loadTracker();
    const newPosts: any[] = [];
    const sourcesWithNew: string[] = [];
    const sourceNewCounts = { hackernews: 0, reddit: 0, twitter: 0 };

    for (const post of posts) {
      const source = post.source as keyof typeof tracker.lastSeen;
      const postId = this.extractPostId(post);
      
      if (!tracker.lastSeen[source].includes(postId)) {
        newPosts.push(post);
        sourceNewCounts[source]++;
      }
    }

    // Track which sources have new content
    Object.entries(sourceNewCounts).forEach(([source, count]) => {
      if (count > 0) {
        sourcesWithNew.push(source);
      }
    });

    console.log(`📊 Post tracking: ${newPosts.length} new posts found`);
    console.log(`📊 Sources with new content: ${sourcesWithNew.join(', ')}`);
    console.log(`📊 New posts per source:`, sourceNewCounts);

    return {
      newPosts,
      hasNewContent: newPosts.length > 0,
      sourcesWithNew
    };
  }

  static markPostsAsSeen(posts: any[]): void {
    const tracker = this.loadTracker();
    
    for (const post of posts) {
      const source = post.source as keyof typeof tracker.lastSeen;
      const postId = this.extractPostId(post);
      
      if (!tracker.lastSeen[source].includes(postId)) {
        tracker.lastSeen[source].push(postId);
        
        // Keep only last 1000 posts per source to prevent file from growing too large
        if (tracker.lastSeen[source].length > 1000) {
          tracker.lastSeen[source] = tracker.lastSeen[source].slice(-500);
        }
      }
    }

    tracker.lastUpdated = Date.now();
    this.saveTracker();
    
    console.log(`✅ Marked ${posts.length} posts as seen`);
  }

  private static extractPostId(post: any): string {
    // Extract the actual post ID from the full ID
    if (post.id.startsWith('hackernews-')) {
      return post.id.replace('hackernews-', '');
    } else if (post.id.startsWith('reddit-')) {
      return post.id.replace('reddit-', '');
    } else if (post.id.startsWith('twitter-')) {
      return post.id.replace('twitter-', '');
    }
    return post.id;
  }

  static getStats(): any {
    const tracker = this.loadTracker();
    return {
      totalSeen: {
        hackernews: tracker.lastSeen.hackernews.length,
        reddit: tracker.lastSeen.reddit.length,
        twitter: tracker.lastSeen.twitter.length
      },
      lastUpdated: tracker.lastUpdated
    };
  }

  static reset(): void {
    this.tracker = {
      lastSeen: {
        hackernews: [],
        reddit: [],
        twitter: []
      },
      lastUpdated: Date.now()
    };
    this.saveTracker();
    console.log('🔄 Post tracker reset');
  }
}