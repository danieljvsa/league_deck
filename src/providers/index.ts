export { ProviderAdapter, ProviderResponse, ProviderMetadata } from './types';
export { 
  normalizeEventStatus, 
  normalizeScore, 
  normalizeParticipant, 
  normalizeEvent, 
  normalizeStanding 
} from './types';
export { Normalizer } from './normalize';
export { TheSportsDBAdapter } from './thesportsdb/adapter';
export { StaticJsonAdapter } from './static-json/adapter';
export { 
  createProvider, 
  getProviderMetadata, 
  getAllProviderMetadata, 
  registerProvider, 
  isProviderSupported, 
  getSupportedProviders,
  getProvidersForCapability 
} from './registry';
export { ProviderService, providerService } from './service';
