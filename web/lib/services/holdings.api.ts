import { apiFetch } from './base.api';

export interface HoldingsResponseData {
  gold: number;
  silver: number;
  platinum: number;
  updatedAt: string;
}

export const getHoldingsApi = () => apiFetch<HoldingsResponseData>('api/holdings', 'GET');
