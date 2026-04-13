import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, Palette } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          Webster
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link
              to="/templates"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
            >
              <Palette size={18} />
              Templates
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link
              to="/profile"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
            >
              <User size={18} />
              {user?.firstName}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-600 hover:text-indigo-600 transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
