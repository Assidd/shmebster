import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { templatesApi, type Template, type TemplateCategory } from '../../api/templates.api';
import { projectsApi } from '../../api/projects.api';
import toast from 'react-hot-toast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      templatesApi.list().then((response) => setTemplates(response.data.data)),
      templatesApi.getCategories().then((response) => setCategories(response.data)),
    ])
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const handleUseTemplate = async (template: Template) => {
    try {
      const { data } = await projectsApi.create({
        name: `${template.name} - Copy`,
        templateId: template.id,
        canvasWidth: template.canvasWidth,
        canvasHeight: template.canvasHeight,
      });
      navigate(`/editor/${data.id}`);
    } catch {
      toast.error('Failed to create project from template');
    }
  };

  const filtered = templates.filter((template) => {
    const matchesCategory = !activeCategory || template.categoryId === activeCategory;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Templates</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search templates by name, description or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
            !activeCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No templates found</p>
          <p className="text-sm mt-1">Try another category or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((template) => (
            <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {template.thumbnailUrl ? (
                  <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">
                    {template.canvasWidth}x{template.canvasHeight}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium truncate">{template.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      template.isSystem
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {template.isSystem ? 'Webster' : 'Yours'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {template.canvasWidth} x {template.canvasHeight}
                </p>
                {template.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{template.description}</p>
                )}
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="mt-3 w-full bg-indigo-600 text-white py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
