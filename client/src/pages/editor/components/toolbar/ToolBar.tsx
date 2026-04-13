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

interface ToolDef {
  id: ToolType;
  icon: React.ElementType;
  label: string;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select',    icon: MousePointer2, label: 'Select',    shortcut: 'V' },
  { id: 'text',      icon: Type,          label: 'Text',       shortcut: 'T' },
  { id: 'rectangle', icon: Square,        label: 'Rectangle',  shortcut: 'R' },
  { id: 'circle',    icon: Circle,        label: 'Circle',     shortcut: 'C' },
  { id: 'triangle',  icon: Triangle,      label: 'Triangle',   shortcut: '' },
  { id: 'line',      icon: Minus,         label: 'Line',       shortcut: 'L' },
  { id: 'pencil',    icon: Pencil,        label: 'Draw',       shortcut: 'P' },
  { id: 'image',     icon: ImagePlus,     label: 'Image',      shortcut: '' },
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

        const maxW = canvas.width! * 0.6;
        const maxH = canvas.height! * 0.6;
        if (img.width! > maxW || img.height! > maxH) {
          img.scale(Math.min(maxW / img.width!, maxH / img.height!));
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
    <div className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-3 gap-0.5 shadow-sm">
      {/* Group separator after select */}
      {TOOLS.map((tool, i) => {
        const Icon = tool.icon;
        const active = activeTool === tool.id;
        const needsDivider = i === 1 || i === 6; // after select, before pencil

        return (
          <div key={tool.id} className="flex flex-col items-center w-full">
            {needsDivider && <div className="w-8 h-px bg-gray-100 my-1.5" />}
            <button
              onClick={() => handleToolClick(tool.id)}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
              className={`relative w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {tool.shortcut && (
                <span className={`text-[8px] font-bold leading-none ${active ? 'text-indigo-200' : 'text-gray-300'}`}>
                  {tool.shortcut}
                </span>
              )}
            </button>
          </div>
        );
      })}
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
