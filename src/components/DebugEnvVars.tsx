'use client';

import { useState, useEffect } from 'react';
import { RedditFetcher } from '@/lib/fetchers/RedditFetcher';
import { TwitterFetcher } from '@/lib/fetchers/TwitterFetcher';

export function DebugEnvVars() {
  const [envStatus, setEnvStatus] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    // Test environment variables accessibility
    const redditClientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const redditClientSecret = process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET;
    const redditUsername = process.env.NEXT_PUBLIC_REDDIT_USERNAME;
    const redditPassword = process.env.NEXT_PUBLIC_REDDIT_PASSWORD;
    const twitterBearerToken = process.env.NEXT_PUBLIC_TWITTER_BEARER_TOKEN;
    const twitterListIds = process.env.NEXT_PUBLIC_TWITTER_LIST_IDS;

    setEnvStatus({
      reddit: {
        clientId: redditClientId ? 'Present' : 'Missing',
        clientSecret: redditClientSecret ? 'Present' : 'Missing', 
        username: redditUsername ? 'Present' : 'Missing',
        password: redditPassword ? 'Present' : 'Missing',
      },
      twitter: {
        bearerToken: twitterBearerToken ? 'Present' : 'Missing',
        listIds: twitterListIds ? 'Present' : 'Missing',
      }
    });

    // Test fetcher initialization
    try {
      const redditFetcher = new RedditFetcher();
      const twitterFetcher = new TwitterFetcher();
      
      setTestResults({
        reddit: {
          sourceName: redditFetcher.getSourceName(),
          canInitialize: true,
          hasAllCredentials: !!(redditClientId && redditClientSecret && redditUsername && redditPassword)
        },
        twitter: {
          sourceName: twitterFetcher.getSourceName(),
          canInitialize: true,
          hasAllCredentials: !!(twitterBearerToken && twitterListIds)
        }
      });
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  const testRedditFetch = async () => {
    try {
      const redditFetcher = new RedditFetcher();
      const posts = await redditFetcher.fetchPosts({ maxPosts: 5 });
      alert(`Reddit test result: ${posts.length} posts fetched`);
      console.log('Reddit posts:', posts);
    } catch (error) {
      alert(`Reddit test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Reddit fetch error:', error);
    }
  };

  const testTwitterFetch = async () => {
    try {
      const twitterFetcher = new TwitterFetcher();
      const posts = await twitterFetcher.fetchPosts({ maxPosts: 5 });
      alert(`Twitter test result: ${posts.length} posts fetched`);
      console.log('Twitter posts:', posts);
    } catch (error) {
      alert(`Twitter test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Twitter fetch error:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔍 Environment Variables Debug</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">📊 Environment Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-red-600">Reddit Variables</h4>
            <ul className="text-sm space-y-1">
              <li>Client ID: <span className={envStatus.reddit?.clientId === 'Present' ? 'text-green-600' : 'text-red-600'}>{envStatus.reddit?.clientId}</span></li>
              <li>Client Secret: <span className={envStatus.reddit?.clientSecret === 'Present' ? 'text-green-600' : 'text-red-600'}>{envStatus.reddit?.clientSecret}</span></li>
              <li>Username: <span className={envStatus.reddit?.username === 'Present' ? 'text-green-600' : 'text-red-600'}>{envStatus.reddit?.username}</span></li>
              <li>Password: <span className={envStatus.reddit?.password === 'Present' ? 'text-green-600' : 'text-red-600'}>{envStatus.reddit?.password}</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-600">Twitter Variables</h4>
            <ul className="text-sm space-y-1">
              <li>Bearer Token: <span className={envStatus.twitter?.bearerToken === 'Present' ? 'text-green-600' : 'text-red-600'}>{envStatus.twitter?.bearerToken}</span></li>
              <li>List IDs: <span className={envStatus.twitter?.listIds === 'Present' ? 'text-green-600' : 'text-red-600'}>{envStatus.twitter?.listIds}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🧪 Fetcher Tests</h3>
        {testResults.error ? (
          <div className="text-red-600">Error: {testResults.error}</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-red-600">Reddit Fetcher</h4>
              <ul className="text-sm space-y-1">
                <li>Source: {testResults.reddit?.sourceName}</li>
                <li>Initialize: <span className={testResults.reddit?.canInitialize ? 'text-green-600' : 'text-red-600'}>{testResults.reddit?.canInitialize ? 'Success' : 'Failed'}</span></li>
                <li>Credentials: <span className={testResults.reddit?.hasAllCredentials ? 'text-green-600' : 'text-red-600'}>{testResults.reddit?.hasAllCredentials ? 'Complete' : 'Incomplete'}</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600">Twitter Fetcher</h4>
              <ul className="text-sm space-y-1">
                <li>Source: {testResults.twitter?.sourceName}</li>
                <li>Initialize: <span className={testResults.twitter?.canInitialize ? 'text-green-600' : 'text-red-600'}>{testResults.twitter?.canInitialize ? 'Success' : 'Failed'}</span></li>
                <li>Credentials: <span className={testResults.twitter?.hasAllCredentials ? 'text-green-600' : 'text-red-600'}>{testResults.twitter?.hasAllCredentials ? 'Complete' : 'Incomplete'}</span></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">🚀 Live Tests</h3>
        <div className="flex gap-2">
          <button 
            onClick={testRedditFetch}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={!testResults.reddit?.hasAllCredentials}
          >
            Test Reddit Fetch
          </button>
          <button 
            onClick={testTwitterFetch}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!testResults.twitter?.hasAllCredentials}
          >
            Test Twitter Fetch
          </button>
        </div>
        <p className="text-sm text-gray-600">Check browser console for detailed results</p>
      </div>
    </div>
  );
}