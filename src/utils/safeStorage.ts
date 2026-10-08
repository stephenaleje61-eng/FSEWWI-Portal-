// Safe localStorage wrapper that protects against SecurityError / DOMException in mobile private browsing,
// WebViews, and cross-origin iframes with strict storage access partitioning.

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('safeStorage.getItem access denied or failed:', e);
    }
    return null;
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn('safeStorage.setItem access denied or failed:', e);
    }
    return false;
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('safeStorage.removeItem access denied or failed:', e);
    }
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('safeStorage.clear access denied or failed:', e);
    }
  },
};
