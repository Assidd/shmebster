import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi, type Project } from '../../api/projects.api';
import { useEditorStore } from '../../stores/editorStore';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import TopBar from './components/toolbar/TopBar';
import ToolBar from './components/toolbar/ToolBar';
import CanvasArea from './components/canvas/CanvasArea';
import PropertiesPanel from './components/sidebar/PropertiesPanel';
import LayersPanel from './components/sidebar/LayersPanel';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [sidebarTab, setSidebarTab] = useState<'properties' | 'layers'>('properties');
  const { setCanvasSize, reset } = useEditorStore();

  useEffect(() => {
    reset();
    if (projectId) {
      projectsApi
        .get(projectId)
        .then(({ data }) => {
          setProject(data);
          setCanvasSize(data.canvasWidth, data.canvasHeight);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useAutoSave(projectId);
  useKeyboardShortcuts();

  const handleSelectionChange = useCallback((obj: any | null) => {
    setSelectedObject(obj);
    if (obj) setSidebarTab('properties');
  }, []);

  const handleNameChange = useCallback(
    (nextProject: Project, options?: { clearSelection?: boolean }) => {
      setProject(nextProject);
      setCanvasSize(nextProject.canvasWidth, nextProject.canvasHeight);

      if (options?.clearSelection) {
        setSelectedObject(null);
      }
    },
    [setCanvasSize],
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        project={project}
        onProjectUpdate={handleNameChange}
      />

      <div className="flex-1 flex overflow-hidden">
        <ToolBar />

        <CanvasArea
          initialData={project.canvasData}
          width={project.canvasWidth}
          height={project.canvasHeight}
          onSelectionChange={handleSelectionChange}
        />

        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSidebarTab('properties')}
              className={`flex-1 text-xs py-2.5 font-medium transition ${
                sidebarTab === 'properties'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setSidebarTab('layers')}
              className={`flex-1 text-xs py-2.5 font-medium transition ${
                sidebarTab === 'layers'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Layers
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'properties' ? (
              <PropertiesPanel selectedObject={selectedObject} />
            ) : (
              <LayersPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
