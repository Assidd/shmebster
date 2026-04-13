import { useState, useEffect, useCallback } from 'react';
import {
  Eye, EyeOff, Trash2, ChevronUp, ChevronDown,
  Type, Square, Circle, Triangle, Minus, Pencil, Image, Box,
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

const TYPE_ICONS: Record<string, React.ElementType> = {
  rect: Square, circle: Circle, triangle: Triangle, line: Minus,
  textbox: Type, 'i-text': Type, path: Pencil, image: Image,
};

const TYPE_COLORS: Record<string, string> = {
  rect: 'text-blue-500', circle: 'text-purple-500', triangle: 'text-orange-500',
  line: 'text-gray-500', textbox: 'text-green-500', 'i-text': 'text-green-500',
  path: 'text-pink-500', image: 'text-cyan-500',
};

export default function LayersPanel() {
  const { pushHistory } = useEditorStore();
  const canvas = useCanvasInstance();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!canvas) return;
    const objs = canvas.getObjects();
    setLayers(
      objs.map((obj: any, i: number) => ({
        id: obj.id || `layer_${i}`,
        name: obj.name || `${obj.type || 'object'}_${i}`,
        type: obj.type || 'object',
        visible: obj.visible !== false,
        object: obj,
      })).reverse(),
    );
    const active = canvas.getActiveObject();
    setSelectedId(active ? (active as any).id || null : null);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    refresh();
    const events = ['object:added', 'object:removed', 'object:modified',
      'selection:created', 'selection:updated', 'selection:cleared'];
    events.forEach((ev) => canvas.on(ev as any, refresh));
    return () => { events.forEach((ev) => canvas.off(ev as any, refresh)); };
  }, [canvas, refresh]);

  const select = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.setActiveObject(layer.object);
    canvas.requestRenderAll();
    setSelectedId(layer.id);
  };

  const toggleVisible = (layer: LayerItem) => {
    if (!canvas) return;
    layer.object.set('visible', !layer.visible);
    canvas.requestRenderAll();
    refresh();
    pushHistory(stringifyCanvas(canvas));
  };

  const del = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.remove(layer.object);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    pushHistory(stringifyCanvas(canvas));
  };

  const move = (layer: LayerItem, dir: 'up' | 'down') => {
    if (!canvas) return;
    if (dir === 'up') canvas.bringObjectForward(layer.object);
    else canvas.sendObjectBackwards(layer.object);
    canvas.requestRenderAll();
    refresh();
    pushHistory(stringifyCanvas(canvas));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Layers</span>
          </div>
          <span className="text-xs text-gray-400">{layers.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Box size={28} className="text-gray-200 mb-3" />
            <p className="text-xs text-gray-400">No layers yet.<br />Add shapes, text or images.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {layers.map((layer) => {
              const Icon = TYPE_ICONS[layer.type] || Square;
              const iconColor = TYPE_COLORS[layer.type] || 'text-gray-400';
              const active = layer.id === selectedId;
              return (
                <div
                  key={layer.id}
                  onClick={() => select(layer)}
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                    active ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 ${active ? 'text-indigo-500' : iconColor} ${!layer.visible ? 'opacity-30' : ''}`}
                  />
                  <span className={`text-xs truncate flex-1 min-w-0 ${
                    active ? 'text-indigo-700 font-medium' : 'text-gray-700'
                  } ${!layer.visible ? 'opacity-40 line-through' : ''}`}>
                    {layer.name}
                  </span>

                  {/* Actions — show on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionBtn title="Bring forward" onClick={(e) => { e.stopPropagation(); move(layer, 'up'); }}>
                      <ChevronUp size={11} />
                    </ActionBtn>
                    <ActionBtn title="Send backward" onClick={(e) => { e.stopPropagation(); move(layer, 'down'); }}>
                      <ChevronDown size={11} />
                    </ActionBtn>
                    <ActionBtn title={layer.visible ? 'Hide' : 'Show'} onClick={(e) => { e.stopPropagation(); toggleVisible(layer); }}>
                      {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                    </ActionBtn>
                    <ActionBtn title="Delete" onClick={(e) => { e.stopPropagation(); del(layer); }} danger>
                      <Trash2 size={11} />
                    </ActionBtn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ title, onClick, danger, children }: {
  title: string; onClick: (e: React.MouseEvent) => void; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1 rounded-md transition ${
        danger
          ? 'text-gray-400 hover:bg-red-100 hover:text-red-500'
          : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
      }`}>
      {children}
    </button>
  );
}
