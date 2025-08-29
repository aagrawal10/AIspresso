import { NextRequest, NextResponse } from 'next/server';
import { FeedFetcher } from '@/lib/FeedFetcher';
import { FeedMerger } from '@/lib/FeedMerger';
import { HackerNewsFetcher } from '@/lib/fetchers/HackerNewsFetcher';
import { RedditFetcher } from '@/lib/fetchers/RedditFetcher';
import { TwitterFetcher } from '@/lib/fetchers/TwitterFetcher';
import { FeedConfig } from '@/types';

FeedFetcher.registerFetcher(new HackerNewsFetcher());
FeedFetcher.registerFetcher(new RedditFetcher());
FeedFetcher.registerFetcher(new TwitterFetcher());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sources = searchParams.get('sources')?.split(',') || ['hackernews'];
    
    const configs: FeedConfig[] = sources.map(source => ({
      source: source as any,
      enabled: true,
      config: {},
    }));

    const posts = await FeedFetcher.fetchFromAllSources(configs);
    const mergedPosts = FeedMerger.mergePosts(posts);

    return NextResponse.json({
      posts: mergedPosts,
      count: mergedPosts.length,
      sources: FeedFetcher.getRegisteredSources(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}