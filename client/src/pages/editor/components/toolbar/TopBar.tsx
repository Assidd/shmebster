import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import {
  Undo2,
  Redo2,
  Save,
  ZoomIn,
  ZoomOut,
  Download,
  ArrowLeft,
  Check,
  Loader2,
  LayoutTemplate,
  History,
  Expand,
  X,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

import { useEditorStore } from '../../../../stores/editorStore';
import { projectsApi, type Project } from '../../../../api/projects.api';
import { versionsApi, type ProjectVersion } from '../../../../api/versions.api';
import { getCanvasInstance } from '../../canvasInstance';
import { serializeCanvas, stringifyCanvas } from '../../canvasSerialization';

interface TopBarProps {
  project: Project;
  onProjectUpdate: (project: Project, options?: { clearSelection?: boolean }) => void;
}

type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';

// ─── Client-side export helpers ─────────────────────────────────────────────
function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function safeFilename(name: string): string {
  return (name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-') || 'webster') ;
}

function exportClientSide(
  format: ExportFormat,
  canvas: NonNullable<ReturnType<typeof getCanvasInstance>>,
  projectName: string,
  jpgQuality: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const base = safeFilename(projectName);
  const prev = canvas.getActiveObject();
  canvas.discardActiveObject();
  canvas.requestRenderAll();

  try {
    switch (format) {
      case 'png': {
        const url = canvas.toDataURL({ format: 'png', multiplier: 2 });
        downloadDataUrl(url, `${base}.png`);
        break;
      }
      case 'jpg': {
        const url = canvas.toDataURL({
          format: 'jpeg',
          quality: jpgQuality / 100,
          multiplier: 2,
        });
        downloadDataUrl(url, `${base}.jpg`);
        break;
      }
      case 'svg': {
        const svgData = canvas.toSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${base}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        break;
      }
      case 'pdf': {
        const isLandscape = canvasWidth > canvasHeight;
        const pdf = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvasWidth, canvasHeight],
          hotfixes: ['px_scaling'],
        });
        const imgData = canvas.toDataURL({ format: 'png', multiplier: 1 });
        pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
        pdf.save(`${base}.pdf`);
        break;
      }
    }
  } finally {
    if (prev) {
      canvas.setActiveObject(prev);
      canvas.requestRenderAll();
    }
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TopBar({ project, onProjectUpdate }: TopBarProps) {
  const navigate = useNavigate();
  const {
    zoom, setZoom,
    undo, redo,
    historyIndex, history,
    isSaving, setSaving,
    setLastSaved, lastSavedAt,
    canvasWidth, canvasHeight,
    setCanvasSize, replaceHistory,
  } = useEditorStore();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [jpgQuality, setJpgQuality] = useState(92);
  const [resizeValues, setResizeValues] = useState({
    width: String(project.canvasWidth),
    height: String(project.canvasHeight),
  });
  const [isResizing, setIsResizing] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameValue(project.name); }, [project.name]);
  useEffect(() => {
    setResizeValues({ width: String(project.canvasWidth), height: String(project.canvasHeight) });
  }, [project.canvasWidth, project.canvasHeight]);
  useEffect(() => { if (editingName) nameInputRef.current?.select(); }, [editingName]);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const { data } = await versionsApi.list(project.id, { limit: 30 });
      setVersions(data.data);
    } catch { toast.error('Failed to load versions'); }
    finally { setVersionsLoading(false); }
  }, [project.id]);

  useEffect(() => {
    if (isHistoryOpen) void loadVersions();
  }, [isHistoryOpen, loadVersions]);

  const handleUndo = () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    const json = undo();
    if (json) canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.requestRenderAll());
  };

  const handleRedo = () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    const json = redo();
    if (json) canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.requestRenderAll());
  };

  const handleSave = async () => {
    const canvas = getCanvasInstance();
    if (!canvas) { toast.error('Canvas not ready'); return; }
    setSaving(true);
    try {
      const { data } = await projectsApi.saveCanvas(
        project.id, serializeCanvas(canvas), canvasWidth, canvasHeight,
      );
      onProjectUpdate(data);
      setLastSaved(new Date().toISOString());
      toast.success('Saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleSaveAsTemplate = async () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    const templateName = window.prompt('Template name:', `${project.name} Template`)?.trim();
    if (!templateName) return;
    setSaving(true);
    try {
      await projectsApi.saveCanvas(project.id, serializeCanvas(canvas), canvasWidth, canvasHeight);
      await projectsApi.saveAsTemplate(project.id, templateName);
      toast.success('Saved as template!');
    } catch { toast.error('Failed to save template'); }
    finally { setSaving(false); }
  };

  const handleNameSave = async () => {
    setEditingName(false);
    const nextName = nameValue.trim();
    if (!nextName || nextName === project.name) { setNameValue(project.name); return; }
    try {
      const { data } = await projectsApi.update(project.id, { name: nextName });
      onProjectUpdate(data);
      setNameValue(data.name);
    } catch {
      setNameValue(project.name);
      toast.error('Failed to rename');
    }
  };

  // ── Export: 100% client-side ─────────────────────────────────────────────
  const handleExport = (format: ExportFormat) => {
    const canvas = getCanvasInstance();
    if (!canvas) { toast.error('Canvas not ready'); return; }
    setExportingFormat(format);
    try {
      exportClientSide(format, canvas, project.name, jpgQuality, canvasWidth, canvasHeight);
      toast.success(`${format.toUpperCase()} exported`);
    } catch (err) {
      console.error(err);
      toast.error(`Export failed`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleCreateVersion = async () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;
    setCreatingVersion(true);
    try {
      const { data } = await versionsApi.create(project.id, {
        label: versionLabel.trim() || undefined,
        canvasData: serializeCanvas(canvas),
        canvasWidth, canvasHeight,
      });
      setVersionLabel('');
      toast.success(`Version v${data.versionNumber} saved`);
      await loadVersions();
    } catch { toast.error('Failed to save version'); }
    finally { setCreatingVersion(false); }
  };

  const handleRestoreVersion = async (version: ProjectVersion) => {
    if (!window.confirm(`Restore v${version.versionNumber}? Unsaved changes will be replaced.`)) return;
    setRestoringVersionId(version.id);
    try {
      const { data } = await versionsApi.restore(project.id, version.id);
      const canvas = getCanvasInstance();
      if (canvas) {
        await canvas.loadFromJSON(data.project.canvasData);
        canvas.setZoom(zoom);
        canvas.setDimensions({ width: data.project.canvasWidth * zoom, height: data.project.canvasHeight * zoom });
        canvas.requestRenderAll();
        replaceHistory(stringifyCanvas(canvas));
      }
      setCanvasSize(data.project.canvasWidth, data.project.canvasHeight);
      onProjectUpdate(data.project, { clearSelection: true });
      toast.success(`Restored v${data.restoredFrom.versionNumber}`);
      await loadVersions();
    } catch { toast.error('Failed to restore'); }
    finally { setRestoringVersionId(null); }
  };

  const handleResizeCanvas = async () => {
    const w = Number.parseInt(resizeValues.width, 10);
    const h = Number.parseInt(resizeValues.height, 10);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      toast.error('Size must be positive'); return;
    }
    const canvas = getCanvasInstance();
    if (!canvas) return;
    setIsResizing(true);
    try {
      const { data } = await projectsApi.resize(project.id, w, h, serializeCanvas(canvas));
      canvas.setZoom(zoom);
      canvas.setDimensions({ width: w * zoom, height: h * zoom });
      canvas.requestRenderAll();
      setCanvasSize(w, h);
      replaceHistory(stringifyCanvas(canvas));
      onProjectUpdate(data, { clearSelection: true });
      setIsResizeOpen(false);
      toast.success('Canvas resized');
    } catch { toast.error('Failed to resize canvas'); }
    finally { setIsResizing(false); }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const zoomPercent = Math.round(zoom * 100);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="h-13 bg-white border-b border-gray-100 flex items-center justify-between px-3 shrink-0 shadow-sm" style={{ height: 52 }}>

        {/* Left: back + project name */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          {/* Webster logo mark */}
          <span className="text-lg font-black text-indigo-600 tracking-tight select-none">W</span>
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={() => void handleNameSave()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleNameSave();
                if (e.key === 'Escape') { setNameValue(project.name); setEditingName(false); }
              }}
              className="text-sm font-semibold border border-indigo-300 rounded-md px-2 py-0.5 outline-none ring-1 ring-indigo-400 w-52"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold text-gray-800 hover:text-indigo-600 truncate max-w-[200px] transition"
              title="Click to rename"
            >
              {project.name}
            </button>
          )}
        </div>

        {/* Center: undo/redo + zoom */}
        <div className="flex items-center gap-1">
          <IconBtn onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <Undo2 size={15} />
          </IconBtn>
          <IconBtn onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={15} />
          </IconBtn>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <IconBtn onClick={() => setZoom(Math.round((zoom - 0.1) * 10) / 10)} disabled={zoom <= 0.2} title="Zoom out">
            <ZoomOut size={15} />
          </IconBtn>
          <button
            className="text-xs font-medium text-gray-600 w-12 text-center tabular-nums hover:bg-gray-100 py-1 rounded"
            onClick={() => setZoom(1)}
            title="Reset zoom"
          >
            {zoomPercent}%
          </button>
          <IconBtn onClick={() => setZoom(Math.round((zoom + 0.1) * 10) / 10)} disabled={zoom >= 3} title="Zoom in">
            <ZoomIn size={15} />
          </IconBtn>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Auto-save indicator */}
          {lastSavedAt && (
            <span className="hidden lg:flex items-center gap-1 text-xs text-gray-400">
              <Check size={11} className="text-emerald-500" />
              {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <OutlineBtn onClick={() => setIsHistoryOpen(true)} icon={<History size={13} />}>
            History
          </OutlineBtn>
          <OutlineBtn onClick={() => setIsResizeOpen(true)} icon={<Expand size={13} />}>
            Resize
          </OutlineBtn>
          <OutlineBtn onClick={handleSaveAsTemplate} disabled={isSaving} icon={<LayoutTemplate size={13} />}>
            Template
          </OutlineBtn>
          <OutlineBtn onClick={() => setIsExportOpen(true)} icon={<Download size={13} />}>
            Export
            <ChevronDown size={11} className="ml-0.5 opacity-60" />
          </OutlineBtn>

          <button
            onClick={handleSave}
            disabled={isSaving}
            title="Save (Ctrl+S)"
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 shadow-sm"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      {/* ── Version history modal ─────────────────────────────────────────── */}
      <Modal open={isHistoryOpen} title="Version History" description="Save manual snapshots and restore earlier states." onClose={() => setIsHistoryOpen(false)}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="Snapshot label (optional)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
            />
            <button onClick={() => void handleCreateVersion()} disabled={creatingVersion}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {creatingVersion ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Snapshot
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2.5 pr-0.5">
            {versionsLoading ? (
              <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
            ) : versions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                No snapshots yet.
              </div>
            ) : versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">v{v.versionNumber}</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-px text-[10px] font-semibold uppercase tracking-wide text-indigo-500">{v.source}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600 truncate">{v.label || 'Untitled snapshot'}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{new Date(v.createdAt).toLocaleString()} — {v.canvasWidth}×{v.canvasHeight}</p>
                </div>
                <button onClick={() => void handleRestoreVersion(v)} disabled={restoringVersionId === v.id}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  {restoringVersionId === v.id ? <Loader2 size={12} className="animate-spin" /> : <History size={12} />}
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Resize modal ─────────────────────────────────────────────────── */}
      <Modal open={isResizeOpen} title="Resize Canvas" description="Change canvas dimensions without losing objects." onClose={() => setIsResizeOpen(false)}>
        <div className="space-y-4">
          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Instagram', w: 1080, h: 1080 },
              { label: 'Story', w: 1080, h: 1920 },
              { label: 'A4', w: 794, h: 1123 },
              { label: 'Banner', w: 1500, h: 500 },
              { label: 'Presentation', w: 1920, h: 1080 },
              { label: 'Twitter', w: 1500, h: 500 },
            ].map((p) => (
              <button key={p.label}
                onClick={() => setResizeValues({ width: String(p.w), height: String(p.h) })}
                className="rounded-lg border border-gray-200 py-2 px-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition">
                <div className="text-xs font-semibold text-gray-700">{p.label}</div>
                <div className="text-[10px] text-gray-400">{p.w}×{p.h}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-600">
              Width (px)
              <input type="number" min={1} value={resizeValues.width}
                onChange={(e) => setResizeValues((p) => ({ ...p, width: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300" />
            </label>
            <label className="text-sm font-medium text-gray-600">
              Height (px)
              <input type="number" min={1} value={resizeValues.height}
                onChange={(e) => setResizeValues((p) => ({ ...p, height: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300" />
            </label>
          </div>
          <p className="text-xs text-gray-400">Current: {canvasWidth}×{canvasHeight} px</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsResizeOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={() => void handleResizeCanvas()} disabled={isResizing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {isResizing ? <Loader2 size={13} className="animate-spin" /> : <Expand size={13} />}
              Apply
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Export modal ─────────────────────────────────────────────────── */}
      <Modal open={isExportOpen} title="Export" description="Download the current canvas in your preferred format." onClose={() => setIsExportOpen(false)}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {([
              { format: 'png' as ExportFormat, label: 'PNG', desc: 'Best for web sharing, transparent backgrounds' },
              { format: 'jpg' as ExportFormat, label: 'JPG', desc: 'Smaller file, ideal for photos' },
              { format: 'svg' as ExportFormat, label: 'SVG', desc: 'Infinitely scalable vector format' },
              { format: 'pdf' as ExportFormat, label: 'PDF', desc: 'Ready-to-print document' },
            ] as const).map(({ format, label, desc }) => (
              <button key={format}
                onClick={() => handleExport(format)}
                disabled={exportingFormat !== null}
                className={`rounded-xl border-2 px-4 py-3.5 text-left transition disabled:opacity-50 hover:border-indigo-300 hover:bg-indigo-50 ${exportingFormat === format ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">{label}</span>
                  {exportingFormat === format && <Loader2 size={13} className="animate-spin text-indigo-600" />}
                </div>
                <p className="mt-1 text-xs text-gray-500">{desc}</p>
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>JPG quality</span>
              <span className="font-bold text-indigo-600">{jpgQuality}%</span>
            </label>
            <input type="range" min={40} max={100} step={1} value={jpgQuality}
              onChange={(e) => setJpgQuality(Number(e.target.value))}
              className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Smaller file</span><span>Higher quality</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Small shared primitives ─────────────────────────────────────────────────
function IconBtn({ onClick, disabled, title, children }: { onClick: () => void; disabled?: boolean; title?: string; children: ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default transition">
      {children}
    </button>
  );
}

function OutlineBtn({ onClick, disabled, icon, children }: { onClick: () => void; disabled?: boolean; icon?: ReactNode; children: ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50">
      {icon}
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, title, description, onClose, children }: {
  open: boolean; title: string; description: string; onClose: () => void; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
