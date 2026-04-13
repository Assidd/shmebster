import { useEffect, useRef } from 'react';
import { projectsApi } from '../api/projects.api';
import { useEditorStore } from '../stores/editorStore';
import { useCanvasInstance } from '../pages/editor/canvasInstance';
import { serializeCanvas } from '../pages/editor/canvasSerialization';

export function useAutoSave(projectId: string | undefined) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setSaving, setLastSaved } = useEditorStore();
  const canvas = useCanvasInstance();

  useEffect(() => {
    if (!projectId || !canvas) return;

    const handleChange = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        try {
          setSaving(true);
          const canvasData = serializeCanvas(canvas);
          await projectsApi.autoSave(projectId, canvasData);
          setLastSaved(new Date().toISOString());
        } catch {
          // silent fail for autosave
        } finally {
          setSaving(false);
        }
      }, 500);
    };

    canvas.on('object:modified', handleChange);
    canvas.on('object:added', handleChange);
    canvas.on('object:removed', handleChange);
    canvas.on('path:created', handleChange);
    canvas.on('text:changed', handleChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      canvas.off('object:modified', handleChange);
      canvas.off('object:added', handleChange);
      canvas.off('object:removed', handleChange);
      canvas.off('path:created', handleChange);
      canvas.off('text:changed', handleChange);
    };
  }, [canvas, projectId, setSaving, setLastSaved]);
}
