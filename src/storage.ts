import { Question, QuestionFormat } from "./types";

/**
 * Accesses persistent storage values cleanly if it's available, otherwise uses localStorage.
 * It is asynchronous as per standard specifications, but we will store a cache in memory to make 
 * our React dashboard extremely responsive.
 */
export const persistentStorage = {
  async getQuestions(topicId: number, subCategoryId: string, format: QuestionFormat): Promise<Question[]> {
    const key = `questions:${topicId}:${subCategoryId}:${format}`;
    try {
      const win = window as any;
      let rawData: string | null = null;
      if (win.storage) {
        if (typeof win.storage.get === 'function') {
          const res = await win.storage.get(key);
          rawData = typeof res === 'string' ? res : (res ? JSON.stringify(res) : null);
        } else if (typeof win.storage.getItem === 'function') {
          rawData = await win.storage.getItem(key);
        }
      } else {
        rawData = localStorage.getItem(key);
      }
      
      if (!rawData) {
        return [];
      }
      
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.warn("Could not load from storage, returning empty array", e);
      return [];
    }
  },

  async saveQuestions(topicId: number, subCategoryId: string, format: QuestionFormat, questions: Question[]): Promise<void> {
    const key = `questions:${topicId}:${subCategoryId}:${format}`;
    try {
      const serialized = JSON.stringify(questions);
      const win = window as any;
      if (win.storage) {
        if (typeof win.storage.set === 'function') {
          await win.storage.set(key, serialized);
          return;
        } else if (typeof win.storage.setItem === 'function') {
          await win.storage.setItem(key, serialized);
          return;
        }
      }
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.error("Failed to save to storage", e);
      localStorage.setItem(key, JSON.stringify(questions));
    }
  }
};
