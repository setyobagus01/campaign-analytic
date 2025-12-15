"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Campaign, Video } from '@/lib/db';
import { calculateMetrics, formatCurrency, formatNumber } from '@/lib/analytics';
import { ArrowLeft, Trash, Edit, MessageSquare, ExternalLink, Activity, CreditCard, Eye, Heart, Share2, Bookmark, RefreshCcw, X, Save, Pencil } from 'lucide-react';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  /* Restore useEffect */
  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
      })
      .then(data => {
        setCampaign(data);
        setLoading(false);
      })
      .catch((e) => {
          console.error(e);
          router.push('/campaigns');
      });
  }, [id, router]);

  const handleDelete = async () => {
      if(!confirm('Are you sure you want to delete this campaign?')) return;
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      router.push('/campaigns');
  };

  /* Add Video State */
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoCost, setNewVideoCost] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);

  /* Edit Video State */
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editCost, setEditCost] = useState('');
  const [updatingVideo, setUpdatingVideo] = useState(false);

  const handleAddVideo = async () => {
      if (!newVideoUrl) return;
      setAddingVideo(true);

      try {
          const res = await fetch('/api/tiktok/video', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ url: newVideoUrl }) 
          });

          if (!res.ok) throw new Error('Failed to fetch video stats');
          const data = await res.json();

          const newVideo: Video = {
              url: newVideoUrl,
              cost: Number(newVideoCost) || 0,
              stats: data.stats,
              id: data.id, 
              updatedAt: new Date().toISOString()
          };

          const updatedVideos = [...(campaign?.videos || []), newVideo];
          await updateCampaignVideos(updatedVideos);
           
           setNewVideoUrl('');
           setNewVideoCost('');
      } catch (e) {
          console.error(e);
          alert('Failed to add video. Check URL.');
      } finally {
          setAddingVideo(false);
      }
  };

  const handleDeleteVideo = async (index: number) => {
      if (!campaign) return;
      if (!confirm('Remove this video?')) return;
      
      const updatedVideos = [...campaign.videos];
      updatedVideos.splice(index, 1);
      await updateCampaignVideos(updatedVideos);
  };

  const openEditModal = (video: Video, index: number) => {
      setEditingVideoIndex(index);
      setEditUrl(video.url);
      setEditCost(video.cost.toString());
  };

  const handleUpdateVideo = async () => {
      if (editingVideoIndex === null || !campaign) return;
      setUpdatingVideo(true);

      try {
          // Always re-scrape to refresh data as requested
          const res = await fetch('/api/tiktok/video', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ url: editUrl }) 
          });

          if (!res.ok) throw new Error('Failed to fetch video stats');
          const data = await res.json();

          const updatedVideos = [...campaign.videos];
          updatedVideos[editingVideoIndex] = {
              ...updatedVideos[editingVideoIndex],
              url: editUrl,
              cost: Number(editCost) || 0,
              stats: data.stats,
              id: data.id,
              updatedAt: new Date().toISOString()
          };

          await updateCampaignVideos(updatedVideos);
          setEditingVideoIndex(null);
      } catch (e) {
          console.error(e);
          alert('Failed to update video info.');
      } finally {
          setUpdatingVideo(false);
      }
  };

  const updateCampaignVideos = async (videos: Video[]) => {
      await fetch(`/api/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videos })
       });
       if (campaign) {
           setCampaign({ ...campaign, videos });
       }
  };
  /* Edit Campaign State */
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [editCamName, setEditCamName] = useState('');
  const [editCamTimeline, setEditCamTimeline] = useState('');
  const [editCamDesc, setEditCamDesc] = useState('');
  const [updatingCampaign, setUpdatingCampaign] = useState(false);

  const openEditCampaignModal = () => {
      if(!campaign) return;
      setEditCamName(campaign.name);
      setEditCamTimeline(campaign.timeline);
      setEditCamDesc(campaign.description || '');
      setIsEditingCampaign(true);
  };

  const handleUpdateCampaign = async () => {
      if(!campaign) return;
      setUpdatingCampaign(true);
      try {
          const res = await fetch(`/api/campaigns/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: editCamName,
                  timeline: editCamTimeline,
                  description: editCamDesc
              })
          });

          if(!res.ok) throw new Error('Failed to update');
          const updated = await res.json();
          setCampaign(updated);
          setIsEditingCampaign(false);
      } catch(e) {
          console.error(e);
          alert('Failed to update campaign');
      } finally {
          setUpdatingCampaign(false);
      }
  };

  // ... (keeping existing render logic)

  if (loading || !campaign) return <div>Loading...</div>;

  const metrics = calculateMetrics([campaign]);

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/campaigns">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
            </Link>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{campaign.name}</h2>
                <p className="text-muted-foreground">{campaign.timeline}</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={openEditCampaignModal}>
                <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash className="w-4 h-4" />
            </Button>
        </div>
      </div>
      
      {campaign.description && (
          <div className="bg-card p-4 rounded-lg border text-sm text-muted-foreground">
              {campaign.description}
          </div>
      )}

      {/* Campaign Dashboard (Matching Main Dashboard) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Cost" value={formatCurrency(metrics.cost)} url="#" />
        <MetricCard title="Total Views" value={formatNumber(metrics.views)} />
        <MetricCard title="Total Engagement" value={formatNumber(metrics.engagement)} />
        <MetricCard title="Total Videos" value={metrics.videoCount.toString()} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="CPE" value={formatCurrency(metrics.cpe)} description="Cost per Engagement" />
        <MetricCard title="CPV" value={formatCurrency(metrics.cpv)} description="Cost per View" />
        <MetricCard title="CPM" value={formatCurrency(metrics.cpm)} description="Cost per Mille" />
        <MetricCard title="Engagement Rate" value={`${metrics.engagementRate.toFixed(2)}%`} />
      </div>

       <div className="grid gap-4 md:grid-cols-4">
         <MetricCard title="Likes" value={formatNumber(metrics.likes)} small />
         <MetricCard title="Comments" value={formatNumber(metrics.comments)} small />
         <MetricCard title="Shares" value={formatNumber(metrics.shares)} small />
         <MetricCard title="Saved" value={formatNumber(metrics.saved)} small />
      </div>

      { /* Edit Campaign Modal */ }
      {isEditingCampaign && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Edit Campaign</h3>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditingCampaign(false)}>
                          <X className="w-4 h-4" />
                      </Button>
                  </div>
                  <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Campaign Name</label>
                          <Input 
                              value={editCamName}
                              onChange={e => setEditCamName(e.target.value)}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Timeline</label>
                          <Input 
                              value={editCamTimeline}
                              onChange={e => setEditCamTimeline(e.target.value)}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Input 
                              value={editCamDesc}
                              onChange={e => setEditCamDesc(e.target.value)}
                          />
                       </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEditingCampaign(false)}>Cancel</Button>
                      <Button onClick={handleUpdateCampaign} disabled={updatingCampaign}>
                          {updatingCampaign ? 'Saving...' : 'Save Changes'}
                      </Button>
                  </div>
              </div>
          </div>
      )}

      <h3 className="text-xl font-semibold mt-8">Total Videos Analysis</h3>
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm min-w-[1000px]">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/20">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky left-0 bg-card">Video</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Views</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Engagement</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cost</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">CPE</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">CPV</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">CPM</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ER%</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {campaign.videos.map((video, i) => {
                         // Calculate video level metrics
                         const vStats = video.stats || { diggCount: 0, commentCount: 0, shareCount: 0, collectCount: 0, playCount: 0 };
                         const engagement = vStats.diggCount + vStats.commentCount + vStats.shareCount + vStats.collectCount;
                         const views = vStats.playCount;
                         const cost = video.cost;
                         
                         const cpe = engagement > 0 ? cost / engagement : 0;
                         const cpv = views > 0 ? cost / views : 0;
                         const cpm = views > 0 ? cost / (views / 1000) : 0;
                         const er = views > 0 ? (engagement / views) * 100 : 0;

                         return (
                            <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle sticky left-0 bg-card border-r">
                                    <div className="flex flex-col gap-1">
                                        <a href={video.url} target="_blank" className="font-medium hover:underline flex items-center gap-1 text-primary">
                                            Video Link <ExternalLink className="w-3 h-3" />
                                        </a>
                                        {video.id && <span className="text-xs text-muted-foreground">ID: {video.id}</span>}
                                    </div>
                                </td>
                                <td className="p-4 align-middle font-medium">{formatNumber(views)}</td>
                                <td className="p-4 align-middle font-medium">{formatNumber(engagement)}</td>
                                <td className="p-4 align-middle font-medium text-destructive">{formatCurrency(cost)}</td>
                                <td className="p-4 align-middle text-muted-foreground">{formatCurrency(cpe)}</td>
                                <td className="p-4 align-middle text-muted-foreground">{formatCurrency(cpv)}</td>
                                <td className="p-4 align-middle text-muted-foreground">{formatCurrency(cpm)}</td>
                                <td className="p-4 align-middle font-medium">{er.toFixed(2)}%</td>
                                <td className="p-4 align-middle flex items-center gap-2">
                                    {video.id && (
                                        <Link href={`/videos/${video.id}`}>
                                            <Button variant="outline" size="sm" title="Comments">
                                                <MessageSquare className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => openEditModal(video, i)} title="Edit & Refresh">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteVideo(i)} title="Delete">
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                         )
                    })}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add Video Section */}
      <div className="border rounded-lg bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Video</h3>
          <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                  <Input 
                      placeholder="TikTok Video URL" 
                      value={newVideoUrl}
                      onChange={e => setNewVideoUrl(e.target.value)}
                  />
              </div>
              <div className="w-[150px] space-y-2">
                  <Input 
                      type="number" 
                      placeholder="Cost" 
                      value={newVideoCost}
                      onChange={e => setNewVideoCost(e.target.value)}
                  />
              </div>
              <Button onClick={handleAddVideo} disabled={addingVideo || !newVideoUrl}>
                  {addingVideo ? 'Adding...' : 'Add Video'}
              </Button>
          </div>
      </div>

      {/* Edit Video Modal */}
      {editingVideoIndex !== null && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Edit Video</h3>
                      <Button variant="ghost" size="icon" onClick={() => setEditingVideoIndex(null)}>
                          <X className="w-4 h-4" />
                      </Button>
                  </div>
                  <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Video URL</label>
                          <Input 
                              value={editUrl}
                              onChange={e => setEditUrl(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Updating logic will re-fetch stats from this URL.</p>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Cost</label>
                          <Input 
                              type="number"
                              value={editCost}
                              onChange={e => setEditCost(e.target.value)}
                          />
                       </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setEditingVideoIndex(null)}>Cancel</Button>
                      <Button onClick={handleUpdateVideo} disabled={updatingVideo}>
                          {updatingVideo ? (
                              <>
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                              </>
                          ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save & Refresh
                              </>
                          )}
                      </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, description, small }: any) {
    return (
        <Card className={small ? "bg-muted/30" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={small ? "text-sm font-medium text-muted-foreground" : "text-sm font-medium"}>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={small ? "text-xl font-bold" : "text-2xl font-bold"}>{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    )
}
