import { useState, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { getCanvasInstance, useCanvasInstance } from '../../canvasInstance';
import { useEditorStore } from '../../../../stores/editorStore';
import { stringifyCanvas } from '../../canvasSerialization';

interface PropertiesPanelProps {
  selectedObject: any | null;
}

const FONTS = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Verdana', 'Courier New', 'Impact', 'Trebuchet MS'];

export default function PropertiesPanel({ selectedObject }: PropertiesPanelProps) {
  const { pushHistory } = useEditorStore();
  const canvas = useCanvasInstance();
  const [props, setProps] = useState<Record<string, any>>({});
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  const readProps = useCallback(() => {
    if (!selectedObject) { setProps({}); return; }
    setProps({
      left: Math.round(selectedObject.left ?? 0),
      top: Math.round(selectedObject.top ?? 0),
      width: Math.round((selectedObject.width ?? 0) * (selectedObject.scaleX ?? 1)),
      height: Math.round((selectedObject.height ?? 0) * (selectedObject.scaleY ?? 1)),
      angle: Math.round(selectedObject.angle ?? 0),
      opacity: Math.round((selectedObject.opacity ?? 1) * 100),
      fill: typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000',
      stroke: selectedObject.stroke || '',
      strokeWidth: selectedObject.strokeWidth ?? 0,
      fontSize: selectedObject.fontSize,
      fontFamily: selectedObject.fontFamily || 'Arial',
      fontWeight: selectedObject.fontWeight || 'normal',
      fontStyle: selectedObject.fontStyle || 'normal',
      textAlign: selectedObject.textAlign || 'left',
      type: selectedObject.type,
    });
  }, [selectedObject]);

  useEffect(() => { readProps(); }, [readProps]);

  useEffect(() => {
    if (!canvas) return;
    const h = () => readProps();
    canvas.on('object:moving', h);
    canvas.on('object:scaling', h);
    canvas.on('object:rotating', h);
    return () => {
      canvas.off('object:moving', h);
      canvas.off('object:scaling', h);
      canvas.off('object:rotating', h);
    };
  }, [canvas, readProps]);

  const updateProp = (key: string, value: any) => {
    const cv = getCanvasInstance();
    if (!selectedObject || !cv) return;
    if (key === 'width') selectedObject.set('scaleX', value / (selectedObject.width || 1));
    else if (key === 'height') selectedObject.set('scaleY', value / (selectedObject.height || 1));
    else if (key === 'opacity') selectedObject.set('opacity', value / 100);
    else selectedObject.set(key, value);
    cv.requestRenderAll();
    setProps((p) => ({ ...p, [key]: value }));
  };

  const commit = () => {
    const cv = getCanvasInstance();
    if (cv) pushHistory(stringifyCanvas(cv));
  };

  if (!selectedObject) {
    return (
      <div className="p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-6-6m0 0l6-6m-6 6h12" />
          </svg>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Click on an element to edit its properties
        </p>
      </div>
    );
  }

  const isText = props.type === 'textbox' || props.type === 'i-text';
  const isLine = props.type === 'line' || props.type === 'path';

  return (
    <div className="overflow-y-auto">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            {props.type || 'Object'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Position */}
        <Section label="Position">
          <div className="grid grid-cols-2 gap-2">
            <NumInput label="X" value={props.left ?? 0} onChange={(v) => updateProp('left', v)} onBlur={commit} />
            <NumInput label="Y" value={props.top ?? 0} onChange={(v) => updateProp('top', v)} onBlur={commit} />
          </div>
        </Section>

        {/* Size */}
        <Section label="Size">
          <div className="grid grid-cols-2 gap-2">
            <NumInput label="W" value={props.width ?? 0} onChange={(v) => updateProp('width', v)} onBlur={commit} />
            <NumInput label="H" value={props.height ?? 0} onChange={(v) => updateProp('height', v)} onBlur={commit} />
          </div>
        </Section>

        {/* Rotation + Opacity */}
        <Section label="Transform">
          <div className="grid grid-cols-2 gap-2">
            <NumInput label="°" value={props.angle ?? 0} onChange={(v) => updateProp('angle', v)} onBlur={commit} min={-360} max={360} />
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Opacity</label>
              <input type="range" min={0} max={100} value={props.opacity ?? 100}
                onChange={(e) => updateProp('opacity', Number(e.target.value))}
                onMouseUp={commit} className="w-full h-1.5 accent-indigo-600 cursor-pointer" />
              <span className="text-[10px] text-gray-400">{props.opacity ?? 100}%</span>
            </div>
          </div>
        </Section>

        {/* Fill */}
        {!isLine && (
          <Section label="Fill">
            <ColorSwatch
              color={props.fill || '#000000'}
              open={showFillPicker}
              onToggle={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); }}
              onChange={(c) => updateProp('fill', c)}
              onClose={() => { setShowFillPicker(false); commit(); }}
            />
          </Section>
        )}

        {/* Stroke */}
        <Section label="Stroke">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ColorSwatch
                color={props.stroke || '#000000'}
                open={showStrokePicker}
                onToggle={() => { setShowStrokePicker(!showStrokePicker); setShowFillPicker(false); }}
                onChange={(c) => updateProp('stroke', c)}
                onClose={() => { setShowStrokePicker(false); commit(); }}
                showNone
                isNone={!props.stroke}
                onNone={() => { updateProp('stroke', ''); commit(); }}
              />
            </div>
            <NumInput label="W" value={props.strokeWidth ?? 0} onChange={(v) => updateProp('strokeWidth', v)} onBlur={commit} min={0} max={50} className="w-20" />
          </div>
        </Section>

        {/* Text controls */}
        {isText && (
          <Section label="Text">
            <div className="space-y-2.5">
              <select value={props.fontFamily || 'Arial'}
                onChange={(e) => { updateProp('fontFamily', e.target.value); commit(); }}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400">
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="Size" value={props.fontSize ?? 24} onChange={(v) => updateProp('fontSize', v)} onBlur={commit} min={6} max={300} />
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Align</label>
                  <select value={props.textAlign || 'left'}
                    onChange={(e) => { updateProp('textAlign', e.target.value); commit(); }}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-1.5">
                <StyleBtn active={props.fontWeight === 'bold'} onClick={() => { updateProp('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold'); commit(); }} className="font-bold">B</StyleBtn>
                <StyleBtn active={props.fontStyle === 'italic'} onClick={() => { updateProp('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic'); commit(); }} className="italic">I</StyleBtn>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange, onBlur, min, max, className = '' }: {
  label: string; value: number; onChange: (v: number) => void; onBlur: () => void;
  min?: number; max?: number; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">{label}</label>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200" />
    </div>
  );
}

function ColorSwatch({ color, open, onToggle, onChange, onClose, showNone, isNone, onNone }: {
  color: string; open: boolean; onToggle: () => void; onChange: (c: string) => void;
  onClose: () => void; showNone?: boolean; isNone?: boolean; onNone?: () => void;
}) {
  return (
    <div className="relative">
      <button onClick={onToggle}
        className="flex items-center gap-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 hover:border-gray-300 transition">
        <div className="w-4 h-4 rounded border border-gray-200 shrink-0"
          style={{ background: isNone ? 'transparent' : color,
            backgroundImage: isNone ? 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)' : 'none',
            backgroundSize: '8px 8px' }} />
        <span className="text-xs text-gray-600 font-mono">{isNone ? 'none' : color}</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0">
          <div className="fixed inset-0" onClick={onClose} />
          <div className="relative bg-white rounded-xl border border-gray-200 shadow-xl p-3 space-y-2">
            <HexColorPicker color={color} onChange={onChange} />
            <input value={color} onChange={(e) => onChange(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-mono outline-none focus:border-indigo-400" />
            {showNone && (
              <button onClick={onNone} className="w-full text-xs text-gray-500 hover:text-red-500 text-center py-1">
                Remove stroke
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StyleBtn({ active, onClick, children, className = '' }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition ${className} ${
        active ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}>
      {children}
    </button>
  );
}
