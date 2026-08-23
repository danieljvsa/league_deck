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
  loadLeagues: () => Promise<void>;
  addLeague: (pkg: LeaguePackage, manifestUrl?: string) => Promise<void>;
  removeLeague: (id: string) => Promise<void>;
  refreshLeague: (id: string) => Promise<void>;
  getLeague: (id: string) => InstalledLeague | undefined;
}

export const useLeagueStore = create<LeagueState>((set, get) => ({
  leagues: [],
  isLoading: false,
  error: null,

  loadLeagues: async () => {
    set({ isLoading: true, error: null });
    try {
      const leagues = await getInstalledLeagues();
      set({ leagues, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load leagues' 
      });
    }
  },

  addLeague: async (pkg: LeaguePackage, manifestUrl?: string) => {
    set({ isLoading: true, error: null });
    try {
      const capabilities = deriveCapabilities(pkg);
      const installed = await dbInstallPackage(pkg, manifestUrl);
      installed.capabilities = capabilities;
      await updatePackageCapabilities(pkg.league.id, capabilities);
      
      const leagues = await getInstalledLeagues();
      set({ leagues, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to install package' 
      });
    }
  },

  removeLeague: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await dbUninstallPackage(id);
      const leagues = await getInstalledLeagues();
      set({ leagues, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to remove package' 
      });
    }
  },

  refreshLeague: async (id: string) => {
    const league = get().getLeague(id);
    if (!league?.manifestUrl) return;

    set({ isLoading: true, error: null });
    try {
      const { refreshPackage } = await import('../core/package/updater');
      await refreshPackage(id);
      const leagues = await getInstalledLeagues();
      set({ leagues, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh package' 
      });
    }
  },

  getLeague: (id: string) => {
    return get().leagues.find((l) => l.id === id);
  },
}));
