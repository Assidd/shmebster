import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Webster</h1>
          <p className="text-gray-500 mt-1">Graphic Design Editor</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
