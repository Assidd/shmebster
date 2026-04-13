import { useEffect, useRef, useCallback } from 'react';
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

function generateId() {
  return `obj_${Date.now()}_${++objectCounter}`;
}

export default function CanvasArea({
  initialData,
  width,
  height,
  onSelectionChange,
}: CanvasAreaProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const { activeTool, zoom, pushHistory, replaceHistory, setActiveTool } = useEditorStore();

  // Initialize canvas
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
    });

    setCanvasInstance(canvas);

    // Load initial data
    if (initialData && Object.keys(initialData).length > 0 && (initialData as any).objects) {
      canvas.loadFromJSON(initialData).then(() => {
        canvas.requestRenderAll();
        replaceHistory(stringifyCanvas(canvas));
      });
    } else {
      replaceHistory(stringifyCanvas(canvas));
    }

    // Selection events
    const handleSelection = () => {
      const active = canvas.getActiveObject();
      onSelectionChange(active || null);
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => onSelectionChange(null));

    canvas.on('object:modified', () => {
      pushHistory(stringifyCanvas(canvas));
    });

    canvas.on('path:created', () => {
      pushHistory(stringifyCanvas(canvas));
    });

    canvas.on('text:changed', () => {
      pushHistory(stringifyCanvas(canvas));
    });

    return () => {
      canvas.dispose();
      setCanvasInstance(null);
      isInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, width, height, onSelectionChange, replaceHistory]);

  // Handle tool changes
  useEffect(() => {
    const canvas = getCanvasInstance();
    if (!canvas) return;

    if (activeTool === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 3;
      canvas.freeDrawingBrush.color = '#000000';
    } else {
      canvas.isDrawingMode = false;
    }

    if (activeTool === 'select') {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    } else {
      canvas.selection = activeTool === 'pencil';
      canvas.defaultCursor = 'crosshair';
    }
  }, [activeTool]);

  // Handle zoom
  useEffect(() => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({
      width: width * zoom,
      height: height * zoom,
    });
    canvas.requestRenderAll();
  }, [zoom, width, height]);

  // Canvas click handler for adding shapes/text
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = getCanvasInstance();
      if (
        !canvas ||
        activeTool === 'select' ||
        activeTool === 'pencil' ||
        activeTool === 'image'
      )
        return;

      // Don't add objects if clicked on existing fabric controls
      const target = canvas.findTarget(e.nativeEvent as any);
      if (target) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      let obj: any = null;
      const id = generateId();

      switch (activeTool as ToolType) {
        case 'text':
          obj = new Textbox('Edit text', {
            left: x - 50,
            top: y - 15,
            width: 200,
            fontSize: 24,
            fontFamily: 'Arial',
            fill: '#000000',
          });
          break;
        case 'rectangle':
          obj = new Rect({
            left: x - 50,
            top: y - 40,
            width: 100,
            height: 80,
            fill: '#4f46e5',
            stroke: '',
            strokeWidth: 0,
          });
          break;
        case 'circle':
          obj = new Circle({
            left: x - 40,
            top: y - 40,
            radius: 40,
            fill: '#4f46e5',
            stroke: '',
            strokeWidth: 0,
          });
          break;
        case 'triangle':
          obj = new Triangle({
            left: x - 40,
            top: y - 35,
            width: 80,
            height: 70,
            fill: '#4f46e5',
            stroke: '',
            strokeWidth: 0,
          });
          break;
        case 'line':
          obj = new Line([x - 50, y, x + 50, y], {
            stroke: '#000000',
            strokeWidth: 2,
          });
          break;
      }

      if (obj) {
        obj.id = id;
        obj.name = `${activeTool}_${objectCounter}`;
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        pushHistory(stringifyCanvas(canvas));
        setActiveTool('select');
        onSelectionChange(obj);
      }
    },
    [activeTool, zoom, pushHistory, setActiveTool, onSelectionChange],
  );

  return (
    <div className="flex-1 bg-gray-200 overflow-auto flex items-center justify-center p-8">
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="shadow-lg relative"
        style={{ width: width * zoom, height: height * zoom }}
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}
