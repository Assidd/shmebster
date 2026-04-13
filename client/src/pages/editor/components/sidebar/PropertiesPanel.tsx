import { useState, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { getCanvasInstance, useCanvasInstance } from '../../canvasInstance';
import { useEditorStore } from '../../../../stores/editorStore';
import { stringifyCanvas } from '../../canvasSerialization';

interface PropertiesPanelProps {
  selectedObject: any | null;
}

export default function PropertiesPanel({ selectedObject }: PropertiesPanelProps) {
  const { pushHistory } = useEditorStore();
  const canvas = useCanvasInstance();
  const [props, setProps] = useState<Record<string, any>>({});
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  const readProps = useCallback(() => {
    if (!selectedObject) {
      setProps({});
      return;
    }
    setProps({
      left: Math.round(selectedObject.left ?? 0),
      top: Math.round(selectedObject.top ?? 0),
      width: Math.round((selectedObject.width ?? 0) * (selectedObject.scaleX ?? 1)),
      height: Math.round((selectedObject.height ?? 0) * (selectedObject.scaleY ?? 1)),
      angle: Math.round(selectedObject.angle ?? 0),
      opacity: Math.round((selectedObject.opacity ?? 1) * 100),
      fill: selectedObject.fill || '#000000',
      stroke: selectedObject.stroke || '',
      strokeWidth: selectedObject.strokeWidth ?? 0,
      // Text-specific
      fontSize: selectedObject.fontSize,
      fontFamily: selectedObject.fontFamily,
      fontWeight: selectedObject.fontWeight || 'normal',
      fontStyle: selectedObject.fontStyle || 'normal',
      textAlign: selectedObject.textAlign || 'left',
      type: selectedObject.type,
    });
  }, [selectedObject]);

  useEffect(() => {
    readProps();
  }, [readProps]);

  // Also update on object moving/scaling
  useEffect(() => {
    if (!canvas) return;
    const handler = () => readProps();
    canvas.on('object:moving', handler);
    canvas.on('object:scaling', handler);
    canvas.on('object:rotating', handler);
    return () => {
      canvas.off('object:moving', handler);
      canvas.off('object:scaling', handler);
      canvas.off('object:rotating', handler);
    };
  }, [canvas, readProps]);

  const updateProp = (key: string, value: any) => {
    const canvas = getCanvasInstance();
    if (!selectedObject || !canvas) return;

    if (key === 'width') {
      selectedObject.set('scaleX', value / selectedObject.width);
    } else if (key === 'height') {
      selectedObject.set('scaleY', value / selectedObject.height);
    } else if (key === 'opacity') {
      selectedObject.set('opacity', value / 100);
    } else {
      selectedObject.set(key, value);
    }

    canvas.renderAll();
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  const commitChange = () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    pushHistory(stringifyCanvas(canvas));
  };

  if (!selectedObject) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Properties</h3>
        <p className="text-xs text-gray-400">Select an element to see its properties</p>
      </div>
    );
  }

  const isText = props.type === 'textbox' || props.type === 'i-text';

  return (
    <div className="p-4 space-y-4 text-sm">
      <h3 className="font-semibold text-gray-700">Properties</h3>

      {/* Position */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-400">X</span>
            <input
              type="number"
              value={props.left ?? 0}
              onChange={(e) => updateProp('left', Number(e.target.value))}
              onBlur={commitChange}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400">Y</span>
            <input
              type="number"
              value={props.top ?? 0}
              onChange={(e) => updateProp('top', Number(e.target.value))}
              onBlur={commitChange}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Size</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-400">W</span>
            <input
              type="number"
              value={props.width ?? 0}
              onChange={(e) => updateProp('width', Number(e.target.value))}
              onBlur={commitChange}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400">H</span>
            <input
              type="number"
              value={props.height ?? 0}
              onChange={(e) => updateProp('height', Number(e.target.value))}
              onBlur={commitChange}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
            />
          </div>
        </div>
      </div>

      {/* Rotation + Opacity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Rotation</label>
          <input
            type="number"
            value={props.angle ?? 0}
            onChange={(e) => updateProp('angle', Number(e.target.value))}
            onBlur={commitChange}
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Opacity</label>
          <input
            type="range"
            min={0}
            max={100}
            value={props.opacity ?? 100}
            onChange={(e) => updateProp('opacity', Number(e.target.value))}
            onMouseUp={commitChange}
            className="w-full h-1 mt-2"
          />
          <span className="text-[10px] text-gray-400">{props.opacity ?? 100}%</span>
        </div>
      </div>

      {/* Fill Color */}
      {props.type !== 'line' && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fill</label>
          <div className="relative">
            <button
              onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 border border-gray-200 rounded"
            >
              <div
                className="w-5 h-5 rounded border border-gray-300"
                style={{ backgroundColor: typeof props.fill === 'string' ? props.fill : '#000' }}
              />
              <span className="text-xs text-gray-600">{typeof props.fill === 'string' ? props.fill : 'mixed'}</span>
            </button>
            {showFillPicker && (
              <div className="absolute z-20 mt-1 left-0">
                <div
                  className="fixed inset-0"
                  onClick={() => { setShowFillPicker(false); commitChange(); }}
                />
                <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <HexColorPicker
                    color={typeof props.fill === 'string' ? props.fill : '#000000'}
                    onChange={(color) => updateProp('fill', color)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stroke */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Stroke</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => { setShowStrokePicker(!showStrokePicker); setShowFillPicker(false); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 border border-gray-200 rounded"
            >
              <div
                className="w-5 h-5 rounded border border-gray-300"
                style={{ backgroundColor: props.stroke || 'transparent' }}
              />
              <span className="text-xs text-gray-600">{props.stroke || 'none'}</span>
            </button>
            {showStrokePicker && (
              <div className="absolute z-20 mt-1 left-0">
                <div
                  className="fixed inset-0"
                  onClick={() => { setShowStrokePicker(false); commitChange(); }}
                />
                <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <HexColorPicker
                    color={props.stroke || '#000000'}
                    onChange={(color) => updateProp('stroke', color)}
                  />
                </div>
              </div>
            )}
          </div>
          <input
            type="number"
            min={0}
            max={50}
            value={props.strokeWidth ?? 0}
            onChange={(e) => updateProp('strokeWidth', Number(e.target.value))}
            onBlur={commitChange}
            className="w-14 px-2 py-1.5 border border-gray-200 rounded text-xs"
            title="Stroke width"
          />
        </div>
      </div>

      {/* Text properties */}
      {isText && (
        <>
          <div className="border-t border-gray-100 pt-3">
            <label className="text-xs text-gray-500 mb-1 block">Font</label>
            <select
              value={props.fontFamily || 'Arial'}
              onChange={(e) => { updateProp('fontFamily', e.target.value); commitChange(); }}
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs"
            >
              {['Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Impact', 'Comic Sans MS'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Size</label>
              <input
                type="number"
                min={8}
                max={200}
                value={props.fontSize ?? 24}
                onChange={(e) => updateProp('fontSize', Number(e.target.value))}
                onBlur={commitChange}
                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Align</label>
              <select
                value={props.textAlign || 'left'}
                onChange={(e) => { updateProp('textAlign', e.target.value); commitChange(); }}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => { updateProp('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold'); commitChange(); }}
              className={`px-3 py-1 rounded text-xs font-bold border ${
                props.fontWeight === 'bold' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              B
            </button>
            <button
              onClick={() => { updateProp('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic'); commitChange(); }}
              className={`px-3 py-1 rounded text-xs italic border ${
                props.fontStyle === 'italic' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              I
            </button>
          </div>
        </>
      )}
    </div>
  );
}
