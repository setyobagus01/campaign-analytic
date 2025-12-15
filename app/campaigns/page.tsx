"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Campaign } from '@/lib/db';
import { calculateMetrics, formatCurrency, formatNumber } from '@/lib/analytics';
import { Plus, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        setCampaigns(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
            <p className="text-muted-foreground">Manage your influencer campaigns.</p>
        </div>
        <Link href="/campaigns/new">
            <Button>
                <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map(campaign => {
            const metrics = calculateMetrics([campaign]);
            return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                    <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="line-clamp-1">{campaign.name}</CardTitle>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xs text-muted-foreground">{campaign.timeline}</p>
                        </CardHeader>
                        <CardContent>
                             {campaign.imageUrl && (
                                <img src={campaign.imageUrl} alt={campaign.name} className="w-full h-32 object-cover rounded-md mb-4" />
                             )}
                             <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Cost</p>
                                    <p className="font-semibold">{formatCurrency(metrics.cost)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Engagement</p>
                                    <p className="font-semibold">{formatNumber(metrics.engagement)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Views</p>
                                    <p className="font-semibold">{formatNumber(metrics.views)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Videos</p>
                                    <p className="font-semibold">{campaign.videos.length}</p>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </Link>
            )
        })}
        {campaigns.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                No campaigns found. Create one to get started.
            </div>
        )}
      </div>
    </div>
  );
}
