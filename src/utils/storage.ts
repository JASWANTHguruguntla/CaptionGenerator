// Safe storage helpers for captionHistory
import { HistoryItem } from "../types";

const STORAGE_KEY = "captionHistory";
const MAX_HISTORY_ITEMS = 10;

/**
 * Load history from localStorage or fallback to sessionStorage.
 */
export function loadHistory(): HistoryItem[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load captionHistory", err);
    return [];
  }
}

/**
 * Save history with strong quota handling and automatic cleanup.
 */
export function saveHistory(history: HistoryItem[]): void {
  try {
    // Always keep only the most recent items
    const trimmed = history.slice(-MAX_HISTORY_ITEMS);

    // Remove large base64 data to save space
    const compact = trimmed.map((item) => {
      const cleanItem = { ...item };
      if (cleanItem.imageUrl && cleanItem.imageUrl.startsWith("data:")) {
        cleanItem.imageUrl = ""; // remove base64 data
      }
      return cleanItem;
    });

    // Try saving compacted version
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    return;
  } catch (err: any) {
    console.warn("localStorage full, attempting recovery...", err);

    try {
      // Fallback: Try to clear space and retry
      localStorage.removeItem(STORAGE_KEY);
      const trimmed = history
        .slice(-MAX_HISTORY_ITEMS)
        .map((h) => ({ ...h, imageUrl: "" }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      console.info(`Saved trimmed history (max ${MAX_HISTORY_ITEMS}) after quota issue.`);
    } catch (err2) {
      console.warn("Failed to save in localStorage, falling back to sessionStorage", err2);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      } catch (err3) {
        console.error("Failed to save even in sessionStorage", err3);
      }
    }
  }
}

/**
 * Clear all history safely.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    console.log("Caption history cleared successfully.");
  } catch (err) {
    console.error("Failed to clear captionHistory", err);
  }
}
