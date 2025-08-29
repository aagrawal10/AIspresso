'use client';

import { Post } from '@/types';
import { useEffect, useRef } from 'react';

interface EmbedRendererProps {
  post: Post;
}

export function EmbedRenderer({ post }: EmbedRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!post.embedData || !containerRef.current) return;

    const container = containerRef.current;
    
    switch (post.embedData.type) {
      case 'twitter':
        loadTwitterEmbed(container, post.embedData.tweetId!);
        break;
      case 'reddit':
        loadRedditEmbed(container, post);
        break;
      case 'youtube':
        loadYouTubeEmbed(container, post.embedData.videoId!);
        break;
    }
  }, [post.embedData]);

  if (!post.embedData) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="embed-container my-4 max-w-full overflow-hidden"
    />
  );
}

function loadTwitterEmbed(container: HTMLElement, tweetId: string) {
  container.innerHTML = '';
  
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'twitter-tweet';
  blockquote.setAttribute('data-theme', 'light');
  blockquote.innerHTML = `<a href="https://twitter.com/i/status/${tweetId}"></a>`;
  
  container.appendChild(blockquote);

  if (!(window as any).twttr) {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.head.appendChild(script);
  } else {
    (window as any).twttr.widgets.load(container);
  }
}

function loadRedditEmbed(container: HTMLElement, post: Post) {
  if (!post.embedData?.postId || !post.embedData?.subreddit) return;
  
  container.innerHTML = '';
  
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'reddit-embed-bq';
  blockquote.setAttribute('data-embed-height', '500');
  
  const link = document.createElement('a');
  link.href = `https://www.reddit.com/r/${post.embedData.subreddit}/comments/${post.embedData.postId}/`;
  link.textContent = post.title;
  
  blockquote.appendChild(link);
  container.appendChild(blockquote);

  if (!(window as any).rembeddit) {
    const script = document.createElement('script');
    script.src = 'https://embed.reddit.com/widgets.js';
    script.async = true;
    document.head.appendChild(script);
  } else {
    (window as any).rembeddit.init();
  }
}

function loadYouTubeEmbed(container: HTMLElement, videoId: string) {
  container.innerHTML = '';
  
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.width = '100%';
  iframe.height = '315';
  iframe.frameBorder = '0';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  
  container.appendChild(iframe);
}