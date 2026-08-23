import { create } from 'zustand';
import { Event, Participant, Standing } from '../domain';
import { ProviderAdapter } from '../providers/types';
import { getCachedData, setCachedData } from '../core/storage/cache';

interface DataState {
  events: Event[];
  participants: Participant[];
  standings: Standing[];
  isLoading: boolean;
  error: string | null;
  loadEvents: (packageId: string, provider: ProviderAdapter, leagueId: string) => Promise<void>;
  loadParticipants: (packageId: string, provider: ProviderAdapter, leagueId: string) => Promise<void>;
  loadStandings: (packageId: string, provider: ProviderAdapter, leagueId: string) => Promise<void>;
  clearData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  events: [],
  participants: [],
  standings: [],
  isLoading: false,
  error: null,

  loadEvents: async (packageId: string, provider: ProviderAdapter, leagueId: string) => {
    set({ isLoading: true, error: null });
    try {
      const cacheKey = `events-${leagueId}`;
      const cached = await getCachedData<Event[]>(packageId, provider.id, cacheKey);
      
      if (cached) {
        set({ events: cached, isLoading: false });
        return;
      }

      if (!provider.fetchEvents) {
        set({ events: [], isLoading: false });
        return;
      }

      const events = await provider.fetchEvents(leagueId);
      await setCachedData(packageId, provider.id, cacheKey, events);
      set({ events, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load events' 
      });
    }
  },

  loadParticipants: async (packageId: string, provider: ProviderAdapter, leagueId: string) => {
    set({ isLoading: true, error: null });
    try {
      const cacheKey = `participants-${leagueId}`;
      const cached = await getCachedData<Participant[]>(packageId, provider.id, cacheKey);
      
      if (cached) {
        set({ participants: cached, isLoading: false });
        return;
      }

      if (!provider.fetchParticipants) {
        set({ participants: [], isLoading: false });
        return;
      }

      const participants = await provider.fetchParticipants(leagueId);
      await setCachedData(packageId, provider.id, cacheKey, participants);
      set({ participants, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load participants' 
      });
    }
  },

  loadStandings: async (packageId: string, provider: ProviderAdapter, leagueId: string) => {
    set({ isLoading: true, error: null });
    try {
      const cacheKey = `standings-${leagueId}`;
      const cached = await getCachedData<Standing[]>(packageId, provider.id, cacheKey);
      
      if (cached) {
        set({ standings: cached, isLoading: false });
        return;
      }

      if (!provider.fetchStandings) {
        set({ standings: [], isLoading: false });
        return;
      }

      const standings = await provider.fetchStandings(leagueId);
      await setCachedData(packageId, provider.id, cacheKey, standings);
      set({ standings, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load standings' 
      });
    }
  },

  clearData: () => {
    set({ events: [], participants: [], standings: [], error: null });
  },
}));
