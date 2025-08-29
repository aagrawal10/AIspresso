import { Post } from '@/types';
import { EmbedRenderer } from './EmbedRenderer';
import { ExternalLink, MessageCircle, TrendingUp, Clock } from 'lucide-react';

interface PostCardProps {
  post: Post;
  showEmbed?: boolean;
}

export function PostCard({ post, showEmbed = true }: PostCardProps) {
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      hackernews: 'bg-orange-500',
      reddit: 'bg-red-500',
      twitter: 'bg-blue-500',
      youtube: 'bg-red-600',
      arxiv: 'bg-purple-500',
      github: 'bg-gray-800',
    };
    return colors[source] || 'bg-gray-500';
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      hackernews: 'HN',
      reddit: 'Reddit',
      twitter: 'Twitter',
      youtube: 'YouTube',
      arxiv: 'arXiv',
      github: 'GitHub',
    };
    return labels[source] || source;
  };

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getSourceColor(post.source)}`}>
          {getSourceLabel(post.source)}
        </span>
        
        <div className="flex items-center text-sm text-gray-500 gap-1">
          <Clock size={12} />
          {formatTimestamp(post.timestamp)}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
        {post.url ? (
          <a 
            href={post.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            {post.title}
          </a>
        ) : (
          post.title
        )}
      </h2>

      {post.content && (
        <p className="text-gray-700 mb-3 line-clamp-3">
          {post.content}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>by {post.author}</span>
          
          {post.score !== undefined && (
            <div className="flex items-center gap-1">
              <TrendingUp size={14} />
              {post.score}
            </div>
          )}
          
          {post.commentsCount !== undefined && (
            <div className="flex items-center gap-1">
              <MessageCircle size={14} />
              {post.commentsCount}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {post.commentsUrl && (
            <a
              href={post.commentsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="View comments"
            >
              <MessageCircle size={16} />
            </a>
          )}
          
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Open link"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {showEmbed && post.embedData && (
        <EmbedRenderer post={post} />
      )}
    </article>
  );
}