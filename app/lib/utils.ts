import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format duration between two dates in a human-readable format
 */
export function formatDuration(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return diffYears === 1 ? "1 year" : `${diffYears} years`;
  }
  if (diffMonths > 0) {
    return diffMonths === 1 ? "1 month" : `${diffMonths} months`;
  }
  if (diffDays > 0) {
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? "1 hour" : `${diffHours} hours`;
  }
  if (diffMinutes > 0) {
    return diffMinutes === 1 ? "1 minute" : `${diffMinutes} minutes`;
  }
  return "less than a minute";
}
