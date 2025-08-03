import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRedditDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}

export function getRedditJson(url: string): string {
  // Convert regular Reddit URL to JSON URL
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  if (!url.endsWith('.json')) {
    url = `${url}.json`;
  }
  
  return url;
}
