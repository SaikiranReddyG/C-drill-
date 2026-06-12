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
          if (res !== null && res !== undefined) {
            if (typeof res === 'object' && 'value' in res) {
              rawData = typeof res.value === 'string' ? res.value : (res.value ? JSON.stringify(res.value) : null);
            } else if (typeof res === 'string') {
              rawData = res;
            } else {
              rawData = JSON.stringify(res);
            }
          }
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
  },

  async getNote(key: string): Promise<string> {
    try {
      const win = window as any;
      if (win.storage) {
        if (typeof win.storage.get === 'function') {
          const res = await win.storage.get(key);
          console.log(`[Notes Load] window.storage.get('${key}') raw response:`, res);
          if (res !== null && res !== undefined) {
            if (typeof res === 'object' && 'value' in res) {
              console.log(`[Notes Load] Found 'value' property in object. Value is:`, res.value);
              return typeof res.value === 'string' ? res.value : (res.value !== null && res.value !== undefined ? String(res.value) : "");
            }
            if (typeof res === 'string') {
              return res;
            }
            return String(res);
          }
          return "";
        } else if (typeof win.storage.getItem === 'function') {
          const res = await win.storage.getItem(key);
          console.log(`[Notes Load] window.storage.getItem('${key}') response:`, res);
          return res || "";
        }
      }
      const localRes = localStorage.getItem(key);
      console.log(`[Notes Load] localStorage.getItem('${key}') response:`, localRes);
      return localRes || "";
    } catch (e) {
      console.warn("Could not load note from storage", e);
      return "";
    }
  },

  async saveNote(key: string, value: string): Promise<void> {
    try {
      const win = window as any;
      console.log(`[Notes Save] Attempting to save key: '${key}', value:`, value);
      if (win.storage) {
        if (typeof win.storage.set === 'function') {
          await win.storage.set(key, value);
          console.log(`[Notes Save] window.storage.set('${key}') completed successfully.`);
          return;
        } else if (typeof win.storage.setItem === 'function') {
          await win.storage.setItem(key, value);
          console.log(`[Notes Save] window.storage.setItem('${key}') completed successfully.`);
          return;
        }
      }
      localStorage.setItem(key, value);
      console.log(`[Notes Save] localStorage.setItem('${key}') completed successfully.`);
    } catch (e) {
      console.error("Failed to save note to storage", e);
      localStorage.setItem(key, value);
    }
  }
};
