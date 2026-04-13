import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import EditorLayout from '../layouts/EditorLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ConfirmEmailPage from '../pages/auth/ConfirmEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import TemplatesPage from '../pages/templates/TemplatesPage';
import EditorPage from '../pages/editor/EditorPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SharedViewPage from '../pages/shared/SharedViewPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/confirm-email', element: <ConfirmEmailPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/templates', element: <TemplatesPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
      {
        element: <EditorLayout />,
        children: [
          { path: '/editor/:projectId', element: <EditorPage /> },
        ],
      },
    ],
  },
  { path: '/shared/:token', element: <SharedViewPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
