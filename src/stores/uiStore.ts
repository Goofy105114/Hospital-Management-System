import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  searchModalOpen: boolean;
  activeDepartment: string;
  facilityName: string;
  facilityLocation: string;
  toggleSidebar: () => void;
  setSearchModalOpen: (open: boolean) => void;
  setActiveDepartment: (dept: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  searchModalOpen: false,
  activeDepartment: "Cardiology",
  facilityName: "Going Merry Central Hospital",
  facilityLocation: "Main Clinic - Bldg B",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchModalOpen: (open) => set({ searchModalOpen: open }),
  setActiveDepartment: (dept) => set({ activeDepartment: dept }),
}));
