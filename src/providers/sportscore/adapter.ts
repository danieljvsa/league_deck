import { ProviderAdapter } from '../types';
import { Participant, Event } from '../../domain';

export class SportScoreAdapter implements ProviderAdapter {
  id = 'sportscore';
  name = 'SportScore';

  async fetchParticipants(_leagueId: string): Promise<Participant[]> {
    if (__DEV__) console.warn('SportScore adapter: fetchParticipants not yet implemented');
    return [];
  }

  async fetchEvents(_leagueId: string): Promise<Event[]> {
    if (__DEV__) console.warn('SportScore adapter: fetchEvents not yet implemented');
    return [];
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  getAttribution(): string {
    return 'Live data provided by SportScore';
  }
}
