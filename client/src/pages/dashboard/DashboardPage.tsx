import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { projectsApi, type Project } from '../../api/projects.api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setMenuOpen(null);
    if (menuOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  const loadProjects = async () => {
    try {
      const { data } = await projectsApi.list();
      setProjects(data.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data } = await projectsApi.create({ name: 'Untitled Project' });
      navigate(`/editor/${data.id}`);
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    try {
      const { data } = await projectsApi.duplicate(id);
      setProjects((prev) => [data, ...prev]);
      toast.success('Project duplicated');
    } catch {
      toast.error('Failed to duplicate project');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/editor/${project.id}`)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition group relative"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {project.thumbnailUrl ? (
                  <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-300 text-xs">
                    {project.canvasWidth} x {project.canvasHeight}
                  </div>
                )}
              </div>
              <div className="p-4 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate group-hover:text-indigo-600 transition">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(project.lastEditedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === project.id ? null : project.id);
                    }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === project.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-40 py-1">
                      <button
                        onClick={(e) => handleDuplicate(e, project.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
