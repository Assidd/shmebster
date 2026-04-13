import { useEffect, useRef } from 'react';
import {
  Canvas,
  Rect,
  Circle,
  Triangle,
  Line,
  Textbox,
  PencilBrush,
} from 'fabric';
import { useEditorStore, type ToolType } from '../../../../stores/editorStore';
import { setCanvasInstance, getCanvasInstance } from '../../canvasInstance';
import {
  ensureFabricCustomProperties,
  stringifyCanvas,
} from '../../canvasSerialization';

interface CanvasAreaProps {
  initialData: Record<string, unknown>;
  width: number;
  height: number;
  onSelectionChange: (obj: any | null) => void;
}

let objectCounter = 0;
function makeId(type: string) {
  return `${type}_${Date.now()}_${++objectCounter}`;
}

// Cursor map per tool
const CURSORS: Record<ToolType, string> = {
  select: 'default',
  text: 'text',
  rectangle: 'crosshair',
  circle: 'crosshair',
  triangle: 'crosshair',
  line: 'crosshair',
  pencil: 'crosshair',
  image: 'default',
  arrow: 'crosshair',
};

export default function CanvasArea({
  initialData,
  width,
  height,
  onSelectionChange,
}: CanvasAreaProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const isInitialized = useRef(false);
  const activeToolRef = useRef<ToolType>('select');
  const { activeTool, zoom, pushHistory, replaceHistory, setActiveTool } =
    useEditorStore();

  // Keep a ref to activeTool so Fabric event handlers always see the latest value
  // without needing to re-register on every tool change.
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // ─── Canvas initialisation (runs once) ──────────────────────────────────
  useEffect(() => {
    if (!canvasElRef.current || isInitialized.current) return;
    isInitialized.current = true;
    ensureFabricCustomProperties();

    const canvas = new Canvas(canvasElRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      stopContextMenu: true,
    });

    setCanvasInstance(canvas);

    // ── Load saved canvas data ──────────────────────────────────────────
    const hasObjects =
      initialData &&
      Object.keys(initialData).length > 0 &&
      Array.isArray((initialData as any).objects);

    if (hasObjects) {
      canvas.loadFromJSON(initialData).then(() => {
        canvas.requestRenderAll();
        replaceHistory(stringifyCanvas(canvas));
      });
    } else {
      replaceHistory(stringifyCanvas(canvas));
    }

    // ── Selection events ────────────────────────────────────────────────
    canvas.on('selection:created', () =>
      onSelectionChange(canvas.getActiveObject() || null),
    );
    canvas.on('selection:updated', () =>
      onSelectionChange(canvas.getActiveObject() || null),
    );
    canvas.on('selection:cleared', () => onSelectionChange(null));

    // ── History events ──────────────────────────────────────────────────
    canvas.on('object:modified', () => pushHistory(stringifyCanvas(canvas)));
    canvas.on('path:created', () => pushHistory(stringifyCanvas(canvas)));
    canvas.on('text:changed', () => pushHistory(stringifyCanvas(canvas)));

    // ── Shape / text insertion on mouse:up ─────────────────────────────
    // Must use Fabric events because Fabric absorbs native mouse events.
    canvas.on('mouse:up', (opt) => {
      const tool = activeToolRef.current;
      if (
        tool === 'select' ||
        tool === 'pencil' ||
        tool === 'image' ||
        !opt.scenePoint
      )
        return;

      // If the user clicked on an existing object, just select it — don't add.
      if (opt.target) return;

      const { x, y } = opt.scenePoint;
      const id = makeId(tool);
      let obj: any = null;

      switch (tool) {
        case 'text':
          obj = new Textbox('Edit text', {
            left: x - 60,
            top: y - 15,
            width: 200,
            fontSize: 28,
            fontFamily: 'Arial',
            fill: '#1a1a2e',
          });
          break;

        case 'rectangle':
          obj = new Rect({
            left: x - 60,
            top: y - 45,
            width: 120,
            height: 90,
            fill: '#4f46e5',
            stroke: '',
            strokeWidth: 0,
            rx: 4,
            ry: 4,
          });
          break;

        case 'circle':
          obj = new Circle({
            left: x - 50,
            top: y - 50,
            radius: 50,
            fill: '#4f46e5',
            stroke: '',
            strokeWidth: 0,
          });
          break;

        case 'triangle':
          obj = new Triangle({
            left: x - 50,
            top: y - 43,
            width: 100,
            height: 86,
            fill: '#4f46e5',
            stroke: '',
            strokeWidth: 0,
          });
          break;

        case 'line':
          obj = new Line([x - 60, y, x + 60, y], {
            stroke: '#1a1a2e',
            strokeWidth: 2,
            strokeLineCap: 'round',
          });
          break;
      }

      if (obj) {
        obj.id = id;
        obj.name = id;
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        pushHistory(stringifyCanvas(canvas));
        setActiveTool('select');
        onSelectionChange(obj);
      }
    });

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      canvas.dispose();
      setCanvasInstance(null);
      isInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Tool changes (drawing mode + cursor) ─────────────────────────────
  useEffect(() => {
    const canvas = getCanvasInstance();
    if (!canvas) return;

    if (activeTool === 'pencil') {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.width = 3;
      brush.color = '#1a1a2e';
      canvas.freeDrawingBrush = brush;
    } else {
      canvas.isDrawingMode = false;
    }

    canvas.selection = activeTool === 'select';
    canvas.defaultCursor = CURSORS[activeTool] ?? 'default';
    canvas.hoverCursor =
      activeTool === 'select' ? 'move' : CURSORS[activeTool] ?? 'crosshair';
    canvas.requestRenderAll();
  }, [activeTool]);

  // ─── Zoom ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({ width: width * zoom, height: height * zoom });
    canvas.requestRenderAll();
  }, [zoom, width, height]);

  return (
    <div className="flex-1 bg-[#e8eaf0] overflow-auto flex items-center justify-center p-10">
      {/* Checkered pattern as outer wrapper so empty canvas looks professional */}
      <div
        className="relative shadow-2xl rounded-sm"
        style={{
          width: width * zoom,
          height: height * zoom,
          /* subtle drop shadow */
          boxShadow:
            '0 4px 6px -1px rgba(0,0,0,.12), 0 20px 40px -8px rgba(0,0,0,.20)',
        }}
      >
        <canvas ref={canvasElRef} className="rounded-sm" />
      </div>
    </div>
  );
}
