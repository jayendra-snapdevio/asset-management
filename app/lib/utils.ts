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
  
  // Calculate months and years using date arithmetic for accuracy
  const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthsDiff = endDate.getMonth() - startDate.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;
  const diffYears = Math.floor(totalMonths / 12);

  if (diffYears > 0) {
    return diffYears === 1 ? "1 year" : `${diffYears} years`;
  }
  if (totalMonths > 0) {
    return totalMonths === 1 ? "1 month" : `${totalMonths} months`;
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
