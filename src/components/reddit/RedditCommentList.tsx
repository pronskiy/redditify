import React from 'react';
import { RedditComment } from '../../lib/types';
import RedditCommentItem from './RedditCommentItem';

interface RedditCommentListProps {
  comments: RedditComment[];
  maxDepth?: number;
  showControls?: boolean;
  currentDepth?: number;
}

export default function RedditCommentList({ 
  comments, 
  maxDepth = 5, 
  showControls = true,
  currentDepth = 0 
}: RedditCommentListProps) {
  // Don't render any comments if maxDepth is 0
  if (maxDepth === 0) {
    return null;
  }
  
  // Filter out any non-comment items (like "more" items)
  const validComments = comments.filter(comment => 
    comment.kind === 't1' && comment.data && comment.data.body
  );
  
  if (validComments.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm p-2">
        No comments yet
      </div>
    );
  }
  
  return (
    <div className="reddit-comment-list space-y-2">
      {validComments.map(comment => (
        <RedditCommentItem 
          key={comment.data.id}
          comment={comment}
          maxDepth={maxDepth}
          showControls={showControls}
          currentDepth={currentDepth}
        />
      ))}
    </div>
  );
}
