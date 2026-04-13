import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  notifications: { id: string; message: string; type: 'success' | 'error' | 'info' }[];

  toggleSidebar: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: true,
  activeModal: null,
  notifications: [],

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  addNotification: (message, type) => {
    const id = Date.now().toString();
    set({ notifications: [...get().notifications, { id, message, type }] });
    setTimeout(() => get().removeNotification(id), 5000);
  },

  removeNotification: (id) =>
    set({ notifications: get().notifications.filter((n) => n.id !== id) }),
}));
