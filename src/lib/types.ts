export interface RedditThreadResponse {
  kind: string;
  data: {
    children: RedditPost[];
  };
}

export interface RedditCommentsResponse {
  kind: string;
  data: {
    children: RedditComment[];
  };
}

export interface RedditPost {
  kind: string;
  data: {
    id: string;
    subreddit: string;
    selftext: string;
    selftext_html: string;
    author: string;
    title: string;
    score: number;
    created_utc: number;
    num_comments: number;
    permalink: string;
    url: string;
    is_self: boolean;
    thumbnail: string;
    ups: number;
    downs: number;
    upvote_ratio: number;
    stickied: boolean;
    locked: boolean;
    over_18: boolean;
    spoiler: boolean;
    subreddit_name_prefixed: string;
    link_flair_text: string | null;
    link_flair_background_color: string | null;
  };
}

export interface RedditComment {
  kind: string;
  data: {
    id: string;
    author: string;
    body: string;
    body_html: string;
    score: number;
    created_utc: number;
    permalink: string;
    replies?: {
      kind: string;
      data: {
        children: RedditComment[];
      };
    };
    stickied: boolean;
    distinguished: string | null;
    is_submitter: boolean;
    score_hidden: boolean;
    collapsed: boolean;
    controversiality: number;
    depth: number;
  };
}

export interface RedditSearchResponse {
  kind: string;
  data: {
    children: RedditPost[];
    after: string | null;
    dist: number;
  };
}

export interface RedditThreadViewerProps {
  url: string;
  className?: string;
  maxCommentDepth?: number;
  showPostContent?: boolean;
  showCommentControls?: boolean;
  onError?: (error: Error) => void;
}
