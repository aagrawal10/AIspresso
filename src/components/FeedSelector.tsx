'use client';

interface FeedSelectorProps {
  selectedFeeds: string[];
  onFeedToggle: (feed: string) => void;
}

export function FeedSelector({ selectedFeeds, onFeedToggle }: FeedSelectorProps) {
  const feeds = [
    { id: 'hackernews', name: 'Hacker News', color: 'orange' },
    { id: 'reddit', name: 'Reddit', color: 'red' },
    { id: 'twitter', name: 'Twitter', color: 'blue' },
  ];

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Feeds</h3>
      <div className="flex gap-3 flex-wrap">
        {feeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => onFeedToggle(feed.id)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selectedFeeds.includes(feed.id)
                ? `bg-${feed.color}-100 border-${feed.color}-300 text-${feed.color}-700`
                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {feed.name}
          </button>
        ))}
      </div>
    </div>
  );
}