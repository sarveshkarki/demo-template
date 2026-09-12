'use client';

import { useQuery } from '@tanstack/react-query';
import { getHoldingsApi, type HoldingsResponseData } from '@/lib/services/holdings.api';
import type { UserHolding } from '@/lib/store';

export function useHoldingsQuery() {
  return useQuery({
    queryKey: ['holdings'],
    queryFn: async (): Promise<HoldingsResponseData> => {
      const res = await getHoldingsApi();
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load holdings');
      }
      return res.data;
    },
  });
}

export function toUserHOlding(data: HoldingsResponseData): Omit<UserHolding, 'apxiTokens'> {
  return {
    goldGrams: data.gold,
    silverGrams: data.silver,
    platinumGrams: data.platinum,
  };
}
