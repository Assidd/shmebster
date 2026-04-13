import { create } from 'zustand';

export type ToolType = 'select' | 'text' | 'pencil' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'image';

interface EditorState {
  activeTool: ToolType;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  selectedObjectId: string | null;
  history: string[];
  historyIndex: number;
  isSaving: boolean;
  lastSavedAt: string | null;

  setActiveTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setSelectedObject: (id: string | null) => void;
  pushHistory: (canvasJson: string) => void;
  replaceHistory: (canvasJson: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: string) => void;
  reset: () => void;
}

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'select',
  zoom: 1,
  canvasWidth: 1080,
  canvasHeight: 1080,
  selectedObjectId: null,
  history: [],
  historyIndex: -1,
  isSaving: false,
  lastSavedAt: null,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),

  pushHistory: (canvasJson) => {
    const { history, historyIndex } = get();
    if (history[historyIndex] === canvasJson) {
      return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasJson);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  replaceHistory: (canvasJson) =>
    set({
      history: [canvasJson],
      historyIndex: 0,
    }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  setSaving: (saving) => set({ isSaving: saving }),
  setLastSaved: (date) => set({ lastSavedAt: date }),

  reset: () =>
    set({
      activeTool: 'select',
      zoom: 1,
      canvasWidth: 1080,
      canvasHeight: 1080,
      selectedObjectId: null,
      history: [],
      historyIndex: -1,
      isSaving: false,
      lastSavedAt: null,
    }),
}));
