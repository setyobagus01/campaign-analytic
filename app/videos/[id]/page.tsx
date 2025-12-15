"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch comments via our proxy
  async function fetchAllComments() {
      setLoading(true);
      setError('');
      let allComments: any[] = [];
      let cursor = 0;
      let hasMore = true;
      let seenCids = new Set<string>();

      try {
          while (hasMore) {
              const res = await fetch(`/api/tiktok/comments?aweme_id=${id}&cursor=${cursor}&count=50&aid=1988&app_language=en`);
              
              if (!res.ok) throw new Error('API Request Failed');
              
              const data = await res.json();
              
              if (data.comments && Array.isArray(data.comments)) {
                 const newComments = data.comments.filter((c: any) => {
                     if (seenCids.has(c.cid)) return false;
                     seenCids.add(c.cid);
                     return true;
                 });
                 
                 if (newComments.length > 0) {
                     allComments = [...allComments, ...newComments];
                     setComments([...allComments]); 
                 }
              }

              if (data.has_more === 1) {
                  cursor = data.cursor;
                  await new Promise(r => setTimeout(r, 1500));
              } else {
                  hasMore = false;
              }
              
              if (!data.comments || data.comments.length === 0) {
                   if (!data.has_more) hasMore = false;
              }
              
              setProgress(allComments.length);
          }
      } catch (e) {
          console.error(e);
          setError(`Failed to fetch all comments. Loaded: ${allComments.length}`);
      } finally {
          setLoading(false);
      }
  }

  useEffect(() => {
      if(id) fetchAllComments();
  }, [id]);

  // Export to CSV
  const handleExport = () => {
    if (comments.length === 0) return;

    // Define CSV headers
    const headers = ['Comment ID', 'User', 'Date', 'Comment', 'Likes', 'Replies'];
    
    // Convert data to CSV rows
    const rows = comments.map(c => [
        c.cid,
        c.user.nickname,
        format(new Date(c.create_time * 1000), 'yyyy-MM-dd HH:mm:ss'),
        // Escape quotes in text
        `"${c.text.replace(/"/g, '""')}"`,
        c.digg_count,
        c.reply_comment_total
    ]);

    const csvContent = [
        headers.join(','), 
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tiktok_comments_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComments = comments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(comments.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Video Analysis</h2>
                    <p className="text-muted-foreground">ID: {id}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleExport} disabled={comments.length === 0} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>
        </div>

        {loading && <div className="text-muted-foreground animate-pulse">Loading comments... retrieved {progress} so far</div>}
        {error && <div className="text-destructive">{error}</div>}

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {Math.max(1, totalPages)}
                </div>
            </div>

            {currentComments.map((comment) => (
                <Card key={comment.cid}>
                    <CardContent className="p-4 flex gap-4">
                        <img src={comment.user?.avatar_thumb?.url_list[0]} alt="Avatar" className="w-10 h-10 rounded-full bg-muted" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{comment.user?.nickname}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(comment.create_time * 1000), 'MMM d, yyyy')}</span>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                            <div className="text-xs text-muted-foreground flex gap-4 mt-2">
                                <span>Likes: {comment.digg_count}</span>
                                <span>Replies: {comment.reply_comment_total}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            
            {comments.length === 0 && !loading && !error && (
                <div className="text-muted-foreground">No comments to display.</div>
            )}

            {/* Pagination Controls */}
            {comments.length > itemsPerPage && (
                <div className="flex justify-center gap-2 mt-4 pb-8">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <div className="flex items-center px-4 text-sm">
                        Page {currentPage} / {totalPages}
                    </div>
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
}
