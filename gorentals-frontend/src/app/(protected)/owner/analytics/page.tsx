'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { SkeletonDashboard } from '@/components/analytics/SkeletonDashboard';
import { toast } from 'react-hot-toast';

export default function OwnerAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await api.get('/owner/analytics');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast.error('Could not load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <SkeletonDashboard />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">No data available</h2>
          <p className="text-slate-400">Start listing your assets to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AnalyticsDashboard data={data} />
    </div>
  );
}
