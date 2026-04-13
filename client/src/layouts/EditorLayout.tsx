import { Outlet } from 'react-router-dom';

export default function EditorLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Outlet />
    </div>
  );
}
