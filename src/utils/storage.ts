// safe storage helpers for captionHistory
import { HistoryItem } from '../types';

const STORAGE_KEY = 'captionHistory';
const MAX_HISTORY_ITEMS = 10;

/**
 * Load history from localStorage with safe parsing.
 */
export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Failed to load captionHistory from localStorage', err);
    return [];
  }
}

/**
 * Save history with quota-aware fallback:
 *  - Try to save full history
 *  - If quota exceeded, remove imageUrl from older items and retry
 *  - If still failing, trim to MAX_HISTORY_ITEMS and retry
 */
export function saveHistory(history: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return;
  } catch (err: unknown) {
    // If quota exceeded, try to salvage things
    console.warn('Initial localStorage.setItem failed, attempting to reduce payload', err);

    try {
      // Make a deep copy so we don't modify the original array passed in
      const copy = history.map(h => ({ ...h }));

      // Strategy 1: Remove image data (imageUrl) from older entries first
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].imageUrl && copy[i].imageUrl.startsWith('data:')) {
          copy[i].imageUrl = ''; // drop base64 data
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      console.info('Saved history after stripping image data from items.');
      return;
    } catch (err2) {
      console.warn('Failed to save after stripping images, trying to trim length', err2);
    }

    try {
      // Strategy 2: Trim to MAX_HISTORY_ITEMS and also strip images
      const trimmed = history.slice(0, MAX_HISTORY_ITEMS).map(h => ({ ...h, imageUrl: '' }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      console.info(`Saved trimmed history (max ${MAX_HISTORY_ITEMS}) after quota issues.`);
      return;
    } catch (err3) {
      console.error('Failed to save trimmed history to localStorage', err3);
      // Final fallback: remove the key entirely to avoid repeated errors
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (cleanupErr) {
        console.error('Failed to remove captionHistory during cleanup', cleanupErr);
      }
    }
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear captionHistory', err);
  }
}