'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { DashboardView } from '@/components/views/dashboard-view';
import { PorView } from '@/components/views/por-view';
import { ZakatView } from '@/components/views/zakat-view';
import { RedemptionView } from '@/components/views/redemption-view';
import { ShariaView } from '@/components/views/sharia-view';
import { useAPAXStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { activeView, addAuditLog } = useAPAXStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Client site route guard
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      useAPAXStore.setState((state) => ({
        metalPrices: {
          gold: state.metalPrices.gold + (Math.random() - 0.5) * 2,
          silver: state.metalPrices.silver + (Math.random() - 0.5) * 0.1,
          platinum: state.metalPrices.platinum + (Math.random() - 0.5) * 1,
          lastUpdated: new Date(),
        },
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Simulate occasional audit log events
  useEffect(() => {
    const events = [
      'Vault Verification',
      'Token Mint',
      'Reserve Audit',
      'Price Oracle Update',
      'Compliance Check',
    ];

    const interval = setInterval(() => {
      const event = events[Math.floor(Math.random() * events.length)];
      addAuditLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        event,
        details: `Automated ${event.toLowerCase()} completed`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [addAuditLog]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'por':
        return <PorView />;
      case 'zakat':
        return <ZakatView />;
      case 'redemption':
        return <RedemptionView />;
      case 'sharia':
        return <ShariaView />;
      default:
        return <DashboardView />;
    }
  };

  // This prevents from flashing real content before we know whether the user is authed or not.
  if (!mounted || !isAuthenticated) {
    return null;
  }

  return <DashboardLayout>{renderView()}</DashboardLayout>;
}
