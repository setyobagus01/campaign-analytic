"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Video, Campaign } from '@/lib/db';

interface CampaignFormProps {
  initialData?: Campaign;
}

export function CampaignForm({ initialData }: CampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    timeline: initialData?.timeline || '',
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
  });

  const [videos, setVideos] = useState<Video[]>(initialData?.videos || [{ url: '', cost: 0 }]);

  const addVideo = () => {
    setVideos([...videos, { url: '', cost: 0 }]);
  };

  const removeVideo = (index: number) => {
    const newVideos = [...videos];
    newVideos.splice(index, 1);
    setVideos(newVideos);
  };

  const updateVideo = (index: number, field: keyof Video, value: any) => {
    const newVideos = [...videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    setVideos(newVideos);
  };

  const fetchStats = async (index: number) => {
      const video = videos[index];
      if (!video.url) return;
      
      const newVideos = [...videos];
      // Mark as loading locally if needed, for now just fire request
      try {
          const res = await fetch('/api/tiktok/video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: video.url })
          });
          if (res.ok) {
              const data = await res.json();
              newVideos[index].stats = data.stats;
              newVideos[index].id = data.id;
              // Optionally set title/cover if we want to store it
              setVideos(newVideos);
          } else {
              console.error('Failed to fetch stats');
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Ensure all stats are fetched if missing? 
        // For now assume user can verify via UI or we just save what we have.
        // Ideally we should process all videos server side or client side before saving.
        // Let's iterate and try to fetch stats for new videos that don't have them.
        const processedVideos = await Promise.all(videos.map(async (v) => {
            if (!v.stats && v.url) {
                try {
                    const res = await fetch('/api/tiktok/video', {
                        method: 'POST',
                        body: JSON.stringify({ url: v.url })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        return { ...v, stats: data.stats, id: data.id };
                    }
                } catch (e) {
                     // ignore
                }
            }
            return v;
        }));

        const payload = {
            ...formData,
            videos: processedVideos
        };

        const url = initialData ? `/api/campaigns/${initialData.id}` : '/api/campaigns';
        const method = initialData ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            router.push('/campaigns');
            router.refresh();
        } else {
            console.error('Failed to save');
        }

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <Card>
        <CardContent className="pt-6 space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Summer Sale 2025" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Input id="timeline" value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} placeholder="e.g. Jan 1 - Jan 31" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="image">Banner Image URL</Label>
                <Input id="image" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Campaign goals and details..." />
            </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Videos</h3>
            <Button type="button" onClick={addVideo} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Video
            </Button>
        </div>
        
        {videos.map((video, index) => (
            <Card key={index}>
                <CardContent className="pt-6 flex gap-4 items-start">
                    <div className="grid gap-4 flex-1 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>TikTok URL</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={video.url} 
                                    onChange={e => updateVideo(index, 'url', e.target.value)} 
                                    onBlur={() => fetchStats(index)}
                                    placeholder="https://www.tiktok.com/@user/video/..." 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Cost (IDR)</Label>
                            <Input 
                                type="number" 
                                value={video.cost} 
                                onChange={e => updateVideo(index, 'cost', parseFloat(e.target.value))} 
                            />
                        </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="mt-8 text-destructive" onClick={() => removeVideo(index)}>
                        <Trash className="w-4 h-4" />
                    </Button>
                    
                    {video.stats ? (
                        <div className="mt-8">
                             <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                    ) : video.url && (
                        <div className="mt-8">
                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                        </div>
                    )}
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}
