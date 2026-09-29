import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setModal: (modal: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setModal: (modal) => set({ activeModal: modal }),
}));