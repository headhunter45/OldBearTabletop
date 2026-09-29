import { useState, useRef, useCallback } from 'react';

export interface ChatHistoryManager {
  history: string[];
  historyIndex: number;
  draft: string;
  isNavigating: boolean;
  addToHistory: (text: string) => void;
  navigateUp: (currentText: string) => string | null;
  navigateDown: () => string | null;
  resetNavigation: () => void;
}

/**
 * Pure state manager for chat command and message history cycling (OB-179).
 */
export function createChatHistory(initialHistory: string[] = []): {
  getHistory: () => string[];
  getIndex: () => number;
  getDraft: () => string;
  isNavigating: () => boolean;
  addToHistory: (text: string) => void;
  navigateUp: (currentText: string) => string | null;
  navigateDown: () => string | null;
  resetNavigation: () => void;
} {
  let history = [...initialHistory];
  let historyIndex = -1;
  let draft = '';

  return {
    getHistory: () => [...history],
    getIndex: () => historyIndex,
    getDraft: () => draft,
    isNavigating: () => historyIndex !== -1,
    addToHistory: (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (history.length === 0 || history[history.length - 1] !== trimmed) {
        history.push(trimmed);
      }
      historyIndex = -1;
      draft = '';
    },
    navigateUp: (currentText: string): string | null => {
      if (history.length === 0) return null;
      if (historyIndex === -1) {
        draft = currentText;
        historyIndex = history.length - 1;
        return history[historyIndex];
      }
      if (historyIndex > 0) {
        historyIndex--;
        return history[historyIndex];
      }
      return history[0];
    },
    navigateDown: (): string | null => {
      if (historyIndex === -1) return null;
      if (historyIndex < history.length - 1) {
        historyIndex++;
        return history[historyIndex];
      }
      historyIndex = -1;
      return draft;
    },
    resetNavigation: () => {
      historyIndex = -1;
      draft = '';
    },
  };
}

/**
 * React hook for cycling sent messages and commands in the chat panel input box.
 */
export function useChatHistory(initialItems: string[] = []): ChatHistoryManager {
  const [history, setHistory] = useState<string[]>(initialItems);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const draftRef = useRef<string>('');

  const addToHistory = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === trimmed) {
        return prev;
      }
      return [...prev, trimmed];
    });
    setHistoryIndex(-1);
    draftRef.current = '';
  }, []);

  const navigateUp = useCallback(
    (currentText: string): string | null => {
      if (history.length === 0) return null;

      if (historyIndex === -1) {
        draftRef.current = currentText;
        const newIndex = history.length - 1;
        setHistoryIndex(newIndex);
        return history[newIndex];
      }

      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        return history[newIndex];
      }

      return history[0];
    },
    [history, historyIndex]
  );

  const navigateDown = useCallback((): string | null => {
    if (historyIndex === -1) return null;

    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }

    setHistoryIndex(-1);
    return draftRef.current;
  }, [history, historyIndex]);

  const resetNavigation = useCallback(() => {
    setHistoryIndex(-1);
    draftRef.current = '';
  }, []);

  return {
    history,
    historyIndex,
    draft: draftRef.current,
    isNavigating: historyIndex !== -1,
    addToHistory,
    navigateUp,
    navigateDown,
    resetNavigation,
  };
}
