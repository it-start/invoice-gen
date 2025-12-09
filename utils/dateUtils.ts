

import { Language } from '../types';

export const humanizeTime = (timestamp: number, lang: Language): string => {
  if (!timestamp) return '';

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  // Future dates (shouldn't happen in chat usually, but safe fallback)
  if (diffMs < 0) {
      return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
          hour: '2-digit', 
          minute: '2-digit'
      }).format(date);
  }

  // < 1 minute
  if (diffSec < 60) {
    return lang === 'ru' ? 'Только что' : 'Just now';
  }

  // < 1 hour
  if (diffMin < 60) {
    return `${diffMin}${lang === 'ru' ? 'м' : 'm'}`;
  }

  // < 24 hours
  if (diffHour < 24) {
    // Check if it was actually yesterday (e.g. 11pm vs 1am)
    if (now.getDate() !== date.getDate()) {
        return lang === 'ru' ? 'Вчера' : 'Yesterday';
    }
    return `${diffHour}${lang === 'ru' ? 'ч' : 'h'}`;
  }

  // < 48 hours (Yesterday)
  if (diffDays < 2) {
    return lang === 'ru' ? 'Вчера' : 'Yesterday';
  }

  // < 7 days
  if (diffDays < 7) {
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' }).format(date);
  }

  // Older: Absolute Date
  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short'
  }).format(date);
};

export const formatShortDate = (dateStr: string, lang: Language): string => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
            day: 'numeric',
            month: 'short'
        }).format(date);
    } catch {
        return dateStr;
    }
};

/**
 * Checks if two date ranges overlap.
 * @param start1 ISO start date string
 * @param end1 ISO end date string
 * @param start2 ISO start date string
 * @param end2 ISO end date string
 * @returns boolean
 */
export const checkDateOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    
    // Standard overlap check: (StartA < EndB) and (EndA > StartB)
    return s1 < e2 && e1 > s2;
};

/**
 * Calculates the CSS position and width for a timeline bar relative to a viewing window.
 * @param itemStart ISO string
 * @param itemEnd ISO string
 * @param timelineStart Date object
 * @param timelineEnd Date object
 */
export const getTimelinePosition = (itemStart: string, itemEnd: string, timelineStart: Date, timelineEnd: Date) => {
    const tStart = timelineStart.getTime();
    const tEnd = timelineEnd.getTime();
    const iStart = new Date(itemStart).getTime();
    const iEnd = new Date(itemEnd).getTime();

    // Check if item is outside the view completely
    if (iEnd < tStart || iStart > tEnd) return null;

    // Clamp values to visible area
    const visibleStart = Math.max(iStart, tStart);
    const visibleEnd = Math.min(iEnd, tEnd);

    const totalDuration = tEnd - tStart;
    
    // Calculate percentage positions
    const left = ((visibleStart - tStart) / totalDuration) * 100;
    const width = ((visibleEnd - visibleStart) / totalDuration) * 100;

    return { left: `${left}%`, width: `${width}%` };
};