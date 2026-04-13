import { useEffect } from 'react';
import { ActiveSelection } from 'fabric';
import { useEditorStore, type ToolType } from '../stores/editorStore';
import { getCanvasInstance } from '../pages/editor/canvasInstance';
import { stringifyCanvas } from '../pages/editor/canvasSerialization';

export function useKeyboardShortcuts() {
  const { undo, redo, pushHistory, setActiveTool } = useEditorStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const canvas = getCanvasInstance();
      if (!canvas) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const json = undo();
        if (json) {
          canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.requestRenderAll());
        }
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((ctrl && e.key === 'z' && e.shiftKey) || (ctrl && e.key === 'y')) {
        e.preventDefault();
        const json = redo();
        if (json) {
          canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.requestRenderAll());
        }
        return;
      }

      // Delete
      if (e.key === 'Delete' || (e.key === 'Backspace' && !ctrl)) {
        const active = canvas.getActiveObject();
        if (active && !(active as any).isEditing) {
          e.preventDefault();
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          pushHistory(stringifyCanvas(canvas));
        }
        return;
      }

      // Select all: Ctrl+A
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        canvas.discardActiveObject();
        const objects = canvas.getObjects();
        if (objects.length > 0) {
          const selection = new ActiveSelection(objects, { canvas });
          canvas.setActiveObject(selection);
          canvas.requestRenderAll();
        }
        return;
      }

      if (e.key.startsWith('Arrow')) {
        const active = canvas.getActiveObject();
        if (!active || (active as any).isEditing) {
          return;
        }

        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const deltaX = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const deltaY = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        active.set({
          left: (active.left ?? 0) + deltaX,
          top: (active.top ?? 0) + deltaY,
        });
        active.setCoords();
        canvas.requestRenderAll();
        pushHistory(stringifyCanvas(canvas));
        return;
      }

      // Tool shortcuts (single keys, no modifiers)
      if (!ctrl && !e.shiftKey && !e.altKey) {
        const toolMap: Record<string, ToolType> = {
          v: 'select',
          t: 'text',
          r: 'rectangle',
          c: 'circle',
          l: 'line',
          p: 'pencil',
        };
        if (toolMap[e.key]) {
          setActiveTool(toolMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, pushHistory, setActiveTool]);
}
