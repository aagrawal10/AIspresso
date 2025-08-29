import { CheckCircle, RefreshCw } from 'lucide-react';

interface CaughtUpMessageProps {
  onRefresh: () => void;
}

export function CaughtUpMessage({ onRefresh }: CaughtUpMessageProps) {
  return (
    <div className="text-center py-12">
      <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        ✅ You're all caught up!
      </h2>
      <p className="text-gray-600 mb-6">
        No new posts to show. All your feeds are up to date.
      </p>
      
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        <RefreshCw size={16} />
        Check for new posts
      </button>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Configure more sources or adjust your settings to see more content.</p>
      </div>
    </div>
  );
}