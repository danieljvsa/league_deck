import { create } from 'zustand';
import { InstalledLeague } from '../core/storage/packages';
import { 
  getInstalledLeagues, 
  installPackage as dbInstallPackage, 
  uninstallPackage as dbUninstallPackage,
  updatePackageCapabilities
} from '../core/storage/packages';
import { LeaguePackage } from '../core/package/schema';
import { deriveCapabilities } from '../core/capabilities/derive';

interface LeagueState {
  leagues: InstalledLeague[];
  isLoading: boolean;
  error: string | null;
  isInstalling: boolean;
  isRemoving: string | null;
  loadLeagues: () => Promise<void>;
  addLeague: (pkg: LeaguePackage, manifestUrl?: string) => Promise<boolean>;
  removeLeague: (id: string) => Promise<boolean>;
  refreshLeague: (id: string) => Promise<boolean>;
  getLeague: (id: string) => InstalledLeague | undefined;
  clearError: () => void;
}

export const useLeagueStore = create<LeagueState>((set, get) => ({
  leagues: [],
  isLoading: false,
  error: null,
  isInstalling: false,
  isRemoving: null,

  loadLeagues: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const leagues = await getInstalledLeagues();
      set({ leagues, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load leagues. Please try again.' 
      });
    }
  },

  addLeague: async (pkg: LeaguePackage, manifestUrl?: string): Promise<boolean> => {
    if (get().isInstalling) return false;
    
    set({ isInstalling: true, error: null });
    try {
      const capabilities = deriveCapabilities(pkg);
      const installed = await dbInstallPackage(pkg, manifestUrl);
      installed.capabilities = capabilities;
      await updatePackageCapabilities(pkg.league.id, capabilities);
      
      const leagues = await getInstalledLeagues();
      set({ leagues, isInstalling: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to install package';
      set({ 
        isInstalling: false, 
        error: message
      });
      return false;
    }
  },

  removeLeague: async (id: string): Promise<boolean> => {
    if (get().isRemoving === id) return false;
    
    set({ isRemoving: id, error: null });
    try {
      await dbUninstallPackage(id);
      const leagues = await getInstalledLeagues();
      set({ leagues, isRemoving: null });
      return true;
    } catch (error) {
      set({ 
        isRemoving: null, 
        error: error instanceof Error ? error.message : 'Failed to remove package. Please try again.' 
      });
      return false;
    }
  },

  refreshLeague: async (id: string): Promise<boolean> => {
    const league = get().getLeague(id);
    if (!league?.manifestUrl) {
      set({ error: 'Cannot refresh: no update URL available for this league.' });
      return false;
    }

    if (get().isLoading) return false;
    
    set({ isLoading: true, error: null });
    try {
      const { refreshPackage } = await import('../core/package/updater');
      await refreshPackage(id);
      const leagues = await getInstalledLeagues();
      set({ leagues, isLoading: false });
      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh package. Check your connection and try again.' 
      });
      return false;
    }
  },

  getLeague: (id: string) => {
    return get().leagues.find((l) => l.id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));
