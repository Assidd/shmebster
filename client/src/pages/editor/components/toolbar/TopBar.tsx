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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useEditorStore } from '../../../../stores/editorStore';
import { exportApi } from '../../../../api/export.api';
import { projectsApi, type Project } from '../../../../api/projects.api';
import { versionsApi, type ProjectVersion } from '../../../../api/versions.api';
import { getCanvasInstance } from '../../canvasInstance';
import { serializeCanvas, stringifyCanvas } from '../../canvasSerialization';

interface TopBarProps {
  project: Project;
  onProjectUpdate: (
    project: Project,
    options?: { clearSelection?: boolean },
  ) => void;
}

type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';

export default function TopBar({ project, onProjectUpdate }: TopBarProps) {
  const navigate = useNavigate();
  const {
    zoom,
    setZoom,
    undo,
    redo,
    historyIndex,
    history,
    isSaving,
    setSaving,
    setLastSaved,
    lastSavedAt,
    canvasWidth,
    canvasHeight,
    setCanvasSize,
    replaceHistory,
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

  useEffect(() => {
    setNameValue(project.name);
  }, [project.name]);

  useEffect(() => {
    setResizeValues({
      width: String(project.canvasWidth),
      height: String(project.canvasHeight),
    });
  }, [project.canvasWidth, project.canvasHeight]);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const { data } = await versionsApi.list(project.id, { limit: 30 });
      setVersions(data.data);
    } catch {
      toast.error('Failed to load versions');
    } finally {
      setVersionsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (isHistoryOpen) {
      void loadVersions();
    }
  }, [isHistoryOpen, loadVersions]);

  const handleUndo = () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;

    const json = undo();
    if (json) {
      canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.requestRenderAll());
    }
  };

  const handleRedo = () => {
    const canvas = getCanvasInstance();
    if (!canvas) return;

    const json = redo();
    if (json) {
      canvas.loadFromJSON(JSON.parse(json)).then(() => canvas.requestRenderAll());
    }
  };

  const getCanvasSnapshot = () => {
    const canvas = getCanvasInstance();
    if (!canvas) {
      toast.error('Canvas is not ready');
      return null;
    }

    return {
      canvas,
      canvasData: serializeCanvas(canvas),
    };
  };

  const handleSave = async () => {
    const snapshot = getCanvasSnapshot();
    if (!snapshot) return;

    setSaving(true);
    try {
      const { data } = await projectsApi.saveCanvas(
        project.id,
        snapshot.canvasData,
        canvasWidth,
        canvasHeight,
      );
      onProjectUpdate(data);
      setLastSaved(new Date().toISOString());
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    const snapshot = getCanvasSnapshot();
    if (!snapshot) return;

    const templateName = window.prompt('Template name', `${project.name} Template`)?.trim();
    if (!templateName) {
      return;
    }

    setSaving(true);
    try {
      const { data } = await projectsApi.saveCanvas(
        project.id,
        snapshot.canvasData,
        canvasWidth,
        canvasHeight,
      );
      onProjectUpdate(data);
      await projectsApi.saveAsTemplate(project.id, templateName);
      setLastSaved(new Date().toISOString());
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleNameSave = async () => {
    setEditingName(false);

    const nextName = nameValue.trim();
    if (!nextName || nextName === project.name) {
      setNameValue(project.name);
      return;
    }

    try {
      const { data } = await projectsApi.update(project.id, { name: nextName });
      onProjectUpdate(data);
      setNameValue(data.name);
    } catch {
      setNameValue(project.name);
      toast.error('Failed to rename project');
    }
  };

  const downloadBlob = (blob: Blob, extension: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName =
      project.name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-') || 'webster-project';

    link.href = url;
    link.download = `${safeName}.${extension}`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format: ExportFormat) => {
    const canvas = getCanvasInstance();
    if (!canvas) {
      toast.error('Canvas is not ready');
      return;
    }

    setExportingFormat(format);
    try {
      let response;

      if (format === 'png') {
        response = await exportApi.exportPng(project.id, {
          dataUrl: canvas.toDataURL({ format: 'png', multiplier: 2 }),
          canvasWidth,
          canvasHeight,
        });
      } else if (format === 'jpg') {
        response = await exportApi.exportJpg(project.id, {
          dataUrl: canvas.toDataURL({
            format: 'jpeg',
            quality: jpgQuality / 100,
            multiplier: 2,
          }),
          canvasWidth,
          canvasHeight,
          quality: jpgQuality,
        });
      } else if (format === 'svg') {
        response = await exportApi.exportSvg(project.id, {
          svg: canvas.toSVG(),
          canvasWidth,
          canvasHeight,
        });
      } else {
        response = await exportApi.exportPdf(project.id, {
          dataUrl: canvas.toDataURL({ format: 'png', multiplier: 2 }),
          canvasWidth,
          canvasHeight,
        });
      }

      downloadBlob(response.data, format);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleCreateVersion = async () => {
    const snapshot = getCanvasSnapshot();
    if (!snapshot) return;

    setCreatingVersion(true);
    try {
      const { data } = await versionsApi.create(project.id, {
        label: versionLabel.trim() || undefined,
        canvasData: snapshot.canvasData,
        canvasWidth,
        canvasHeight,
      });
      setLastSaved(new Date().toISOString());
      setVersionLabel('');
      toast.success(`Version v${data.versionNumber} saved`);
      await loadVersions();
    } catch {
      toast.error('Failed to save version');
    } finally {
      setCreatingVersion(false);
    }
  };

  const handleRestoreVersion = async (version: ProjectVersion) => {
    const shouldRestore = window.confirm(
      `Restore version v${version.versionNumber}? Current unsaved changes will be replaced.`,
    );

    if (!shouldRestore) {
      return;
    }

    setRestoringVersionId(version.id);
    try {
      const { data } = await versionsApi.restore(project.id, version.id);
      const canvas = getCanvasInstance();

      if (canvas) {
        await canvas.loadFromJSON(data.project.canvasData);
        canvas.setZoom(zoom);
        canvas.setDimensions({
          width: data.project.canvasWidth * zoom,
          height: data.project.canvasHeight * zoom,
        });
        canvas.requestRenderAll();
        replaceHistory(stringifyCanvas(canvas));
      } else {
        replaceHistory(JSON.stringify(data.project.canvasData));
      }

      setCanvasSize(data.project.canvasWidth, data.project.canvasHeight);
      setLastSaved(new Date().toISOString());
      onProjectUpdate(data.project, { clearSelection: true });
      toast.success(`Restored v${data.restoredFrom.versionNumber}`);
      await loadVersions();
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleResizeCanvas = async () => {
    const width = Number.parseInt(resizeValues.width, 10);
    const height = Number.parseInt(resizeValues.height, 10);

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      toast.error('Canvas size must be positive');
      return;
    }

    const snapshot = getCanvasSnapshot();
    if (!snapshot) return;

    setIsResizing(true);
    try {
      const { data } = await projectsApi.resize(
        project.id,
        width,
        height,
        snapshot.canvasData,
      );

      snapshot.canvas.setZoom(zoom);
      snapshot.canvas.setDimensions({
        width: width * zoom,
        height: height * zoom,
      });
      snapshot.canvas.requestRenderAll();

      setCanvasSize(width, height);
      replaceHistory(stringifyCanvas(snapshot.canvas));
      setLastSaved(new Date().toISOString());
      onProjectUpdate(data, { clearSelection: true });
      setIsResizeOpen(false);
      toast.success('Canvas resized');
    } catch {
      toast.error('Failed to resize canvas');
    } finally {
      setIsResizing(false);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-5 w-px bg-gray-200" />
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={() => void handleNameSave()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleNameSave();
                }
                if (e.key === 'Escape') {
                  setNameValue(project.name);
                  setEditingName(false);
                }
              }}
              className="text-sm font-medium border border-indigo-300 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 w-56"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate max-w-[220px]"
            >
              {project.name}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-default"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-default"
          >
            <Redo2 size={16} />
          </button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button
            onClick={() => setZoom(zoom - 0.1)}
            disabled={zoom <= 0.2}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">{zoomPercent}%</span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            disabled={zoom >= 3}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Check size={12} />
              Saved {new Date(lastSavedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <History size={14} />
            History
          </button>
          <button
            onClick={() => setIsResizeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Expand size={14} />
            Resize
          </button>
          <button
            onClick={handleSaveAsTemplate}
            disabled={isSaving}
            title="Save as template"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <LayoutTemplate size={14} />
            Template
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            title="Save (Ctrl+S)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      <Modal
        open={isHistoryOpen}
        title="Version History"
        description="Create manual snapshots and restore older editor states."
        onClose={() => setIsHistoryOpen(false)}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="Snapshot label (optional)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={() => void handleCreateVersion()}
              disabled={creatingVersion}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creatingVersion ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Snapshot
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto space-y-3">
            {versionsLoading ? (
              <div className="py-10 text-center text-sm text-gray-500">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No versions yet. Save a manual snapshot to start history tracking.
              </div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        v{version.versionNumber}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        {version.source}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 truncate">
                      {version.label || 'Untitled snapshot'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(version.createdAt).toLocaleString()} - {version.canvasWidth} x{' '}
                      {version.canvasHeight}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleRestoreVersion(version)}
                    disabled={restoringVersionId === version.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {restoringVersionId === version.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <History size={14} />
                    )}
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={isResizeOpen}
        title="Resize Canvas"
        description="Update the working dimensions without dropping current objects."
        onClose={() => setIsResizeOpen(false)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Width
              <input
                type="number"
                min={1}
                value={resizeValues.width}
                onChange={(e) =>
                  setResizeValues((prev) => ({ ...prev, width: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-indigo-400"
              />
            </label>
            <label className="text-sm text-gray-600">
              Height
              <input
                type="number"
                min={1}
                value={resizeValues.height}
                onChange={(e) =>
                  setResizeValues((prev) => ({ ...prev, height: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-indigo-400"
              />
            </label>
          </div>
          <p className="text-xs text-gray-400">
            Current canvas: {canvasWidth} x {canvasHeight}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsResizeOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleResizeCanvas()}
              disabled={isResizing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isResizing ? <Loader2 size={14} className="animate-spin" /> : <Expand size={14} />}
              Apply
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isExportOpen}
        title="Export Project"
        description="Generate files from the current editor state."
        onClose={() => setIsExportOpen(false)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['png', 'jpg', 'svg', 'pdf'] as ExportFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => void handleExport(format)}
                disabled={exportingFormat !== null}
                className="rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="text-sm font-semibold uppercase text-gray-800">{format}</div>
                <div className="mt-1 text-xs text-gray-400">
                  {format === 'png' && 'Lossless image for sharing and downloads.'}
                  {format === 'jpg' && 'Compressed photo-friendly image.'}
                  {format === 'svg' && 'Scalable vector output.'}
                  {format === 'pdf' && 'Printable document export.'}
                </div>
                {exportingFormat === format && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600">
                    <Loader2 size={12} className="animate-spin" />
                    Preparing...
                  </div>
                )}
              </button>
            ))}
          </div>

          <label className="block text-sm text-gray-600">
            JPG quality: <span className="font-medium text-gray-800">{jpgQuality}</span>
            <input
              type="range"
              min={40}
              max={100}
              step={1}
              value={jpgQuality}
              onChange={(e) => setJpgQuality(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>
        </div>
      </Modal>
    </>
  );
}

interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

function Modal({ open, title, description, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
