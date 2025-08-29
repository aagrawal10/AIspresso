'use client';

import { useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { FeedFetcher } from '@/lib/FeedFetcher';
import { HackerNewsFetcher } from '@/lib/fetchers/HackerNewsFetcher';
import { RedditFetcher } from '@/lib/fetchers/RedditFetcher';
import { TwitterFetcher } from '@/lib/fetchers/TwitterFetcher';

export default function Home() {
  useEffect(() => {
    FeedFetcher.registerFetcher(new HackerNewsFetcher());
    FeedFetcher.registerFetcher(new RedditFetcher());
    FeedFetcher.registerFetcher(new TwitterFetcher());
  }, []);

  return <Dashboard />;
}