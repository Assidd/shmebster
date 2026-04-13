import { useRef } from 'react';
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Pencil,
  ImagePlus,
} from 'lucide-react';
import { useEditorStore, type ToolType } from '../../../../stores/editorStore';
import { getCanvasInstance } from '../../canvasInstance';
import { stringifyCanvas } from '../../canvasSerialization';
import { FabricImage } from 'fabric';

const tools: { id: ToolType; icon: typeof MousePointer2; label: string; shortcut: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { id: 'triangle', icon: Triangle, label: 'Triangle', shortcut: '' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'pencil', icon: Pencil, label: 'Draw', shortcut: 'P' },
  { id: 'image', icon: ImagePlus, label: 'Image', shortcut: '' },
];

export default function ToolBar() {
  const { activeTool, setActiveTool, pushHistory } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (tool: ToolType) => {
    if (tool === 'image') {
      fileInputRef.current?.click();
      return;
    }
    setActiveTool(tool);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const canvas = getCanvasInstance();
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      FabricImage.fromURL(dataUrl).then((img) => {
        (img as any).id = `img_${Date.now()}`;
        (img as any).name = `image_${file.name}`;

        // Scale down if too large
        const maxW = canvas.width! * 0.6;
        const maxH = canvas.height! * 0.6;
        if (img.width! > maxW || img.height! > maxH) {
          const scale = Math.min(maxW / img.width!, maxH / img.height!);
          img.scale(scale);
        }
        img.set({ left: 50, top: 50 });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        pushHistory(stringifyCanvas(canvas));
        setActiveTool('select');
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1">
      {tools.map(({ id, icon: Icon, label, shortcut }) => (
        <button
          key={id}
          onClick={() => handleToolClick(id)}
          title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
            activeTool === id
              ? 'bg-indigo-100 text-indigo-600'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <Icon size={18} />
        </button>
      ))}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
