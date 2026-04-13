import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sharingApi } from '../../api/sharing.api';

export default function SharedViewPage() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (token) {
      sharingApi.getShared(token)
        .then(({ data }) => setProject(data as Record<string, unknown>))
        .catch(() => setError(true));
    }
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Project Not Found</h1>
          <p className="text-gray-500 mt-2">This shared link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading shared project...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-600">Webster</span>
        <span className="text-sm text-gray-500">Shared Project</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white shadow-lg" style={{ width: 1080, height: 1080 }}>
          <canvas id="shared-canvas" />
        </div>
      </div>
    </div>
  );
}
