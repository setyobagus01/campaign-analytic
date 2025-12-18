"use client";

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateMetrics, formatCurrency, formatNumber, Metrics } from '@/lib/analytics';
import { Campaign } from '@prisma/client';
import { Activity, CreditCard, Eye, Heart, MessageCircle, MoreHorizontal, Share2, Bookmark } from 'lucide-react';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        setCampaigns(data);
        setMetrics(calculateMetrics(data));
      } catch (error) {
        console.error('Failed to fetch campaigns', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
      return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of all campaign performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Cost" value={formatCurrency(metrics.cost)} icon={CreditCard} description="Total split across all campaigns" />
        <MetricCard title="Total Views" value={formatNumber(metrics.views)} icon={Eye} />
        <MetricCard title="Total Engagement" value={formatNumber(metrics.engagement)} icon={Activity} />
        <MetricCard title="Total Videos" value={metrics.videoCount.toString()} icon={VideoIcon} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="CPE" value={formatCurrency(metrics.cpe)} description="Cost per Engagement" />
        <MetricCard title="CPV" value={formatCurrency(metrics.cpv)} description="Cost per View" />
        <MetricCard title="CPM" value={formatCurrency(metrics.cpm)} description="Cost per Mille (1k views)" />
        <MetricCard title="Engagement Rate" value={`${metrics.engagementRate.toFixed(2)}%`} description="Engagements / Views" />
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4">Detailed Metrics</h3>
      <div className="grid gap-4 md:grid-cols-4">
         <MetricCard title="Likes" value={formatNumber(metrics.likes)} icon={Heart} small />
         <MetricCard title="Comments" value={formatNumber(metrics.comments)} icon={MessageCircle} small />
         <MetricCard title="Shares" value={formatNumber(metrics.shares)} icon={Share2} small />
         <MetricCard title="Saved" value={formatNumber(metrics.saved)} icon={Bookmark} small />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, description, small }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("font-medium", small ? "text-sm" : "text-sm font-medium")}>
                    {title}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className={cn("font-bold", small ? "text-xl" : "text-2xl")}>{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    )
}

function VideoIcon(props: any) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
      </svg>
    )
}
