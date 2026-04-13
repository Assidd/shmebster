import { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Pencil,
  Image,
} from 'lucide-react';
import { useCanvasInstance } from '../../canvasInstance';
import { useEditorStore } from '../../../../stores/editorStore';
import { stringifyCanvas } from '../../canvasSerialization';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  object: any;
}

const typeIcons: Record<string, typeof Square> = {
  rect: Square,
  circle: Circle,
  triangle: Triangle,
  line: Minus,
  textbox: Type,
  'i-text': Type,
  path: Pencil,
  image: Image,
};

export default function LayersPanel() {
  const { pushHistory } = useEditorStore();
  const canvas = useCanvasInstance();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refreshLayers = useCallback(() => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const items: LayerItem[] = objects
      .map((obj: any, i: number) => ({
        id: obj.id || `layer_${i}`,
        name: obj.name || `${obj.type || 'object'}_${i}`,
        type: obj.type || 'object',
        visible: obj.visible !== false,
        object: obj,
      }))
      .reverse(); // top layer first
    setLayers(items);

    const active = canvas.getActiveObject();
    setSelectedId(active ? (active as any).id || null : null);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    refreshLayers();

    canvas.on('object:added', refreshLayers);
    canvas.on('object:removed', refreshLayers);
    canvas.on('object:modified', refreshLayers);
    canvas.on('selection:created', refreshLayers);
    canvas.on('selection:updated', refreshLayers);
    canvas.on('selection:cleared', refreshLayers);

    return () => {
      canvas.off('object:added', refreshLayers);
      canvas.off('object:removed', refreshLayers);
      canvas.off('object:modified', refreshLayers);
      canvas.off('selection:created', refreshLayers);
      canvas.off('selection:updated', refreshLayers);
      canvas.off('selection:cleared', refreshLayers);
    };
  }, [canvas, refreshLayers]);

  const selectLayer = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.setActiveObject(layer.object);
    canvas.requestRenderAll();
    setSelectedId(layer.id);
  };

  const toggleVisibility = (layer: LayerItem) => {
    if (!canvas) return;
    layer.object.set('visible', !layer.visible);
    canvas.requestRenderAll();
    refreshLayers();
    pushHistory(stringifyCanvas(canvas));
  };

  const deleteLayer = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.remove(layer.object);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    pushHistory(stringifyCanvas(canvas));
  };

  const moveLayer = (layer: LayerItem, direction: 'up' | 'down') => {
    if (!canvas) return;
    if (direction === 'up') {
      canvas.bringObjectForward(layer.object);
    } else {
      canvas.sendObjectBackwards(layer.object);
    }
    canvas.requestRenderAll();
    refreshLayers();
    pushHistory(stringifyCanvas(canvas));
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Layers</h3>
      {layers.length === 0 ? (
        <p className="text-xs text-gray-400">No elements yet. Use tools to add shapes or text.</p>
      ) : (
        <div className="space-y-0.5">
          {layers.map((layer) => {
            const Icon = typeIcons[layer.type] || Square;
            const isSelected = layer.id === selectedId;
            return (
              <div
                key={layer.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
                  isSelected ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => selectLayer(layer)}
              >
                <Icon size={14} className={`shrink-0 ${isSelected ? 'text-indigo-500' : 'text-gray-400'}`} />
                <span className={`text-xs truncate flex-1 ${!layer.visible ? 'opacity-40' : ''}`}>
                  {layer.name}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'up'); }}
                    className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                    title="Bring forward"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'down'); }}
                    className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                    title="Send backward"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(layer); }}
                    className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                    title="Toggle visibility"
                  >
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer); }}
                    className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
