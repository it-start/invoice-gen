
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
