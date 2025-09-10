import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ThumbsUp,
  Share,
  MoreHorizontal,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logInfo } from '@/lib/secureLogger';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  content_type: string;
  status: string;
  approval_status: string;
  view_count: number;
  like_count: number;
  share_count: number;
  is_promoted: boolean;
  created_at: string;
}

export const ContentModeration = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch posts from the existing posts table and transform to ContentItem format
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform posts to ContentItem format
      const transformedContent: ContentItem[] = (posts || []).map(post => ({
        id: post.id,
        title: `Post ${post.id.substring(0, 8)}`,
        description: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
        content: post.content,
        content_type: post.media_type || 'text',
        status: 'published',
        approval_status: 'approved',
        view_count: 0,
        like_count: post.likes_count || 0,
        share_count: post.shares_count || 0,
        is_promoted: false,
        created_at: post.created_at
      }));
      
      setContent(transformedContent);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error loading content",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (contentId: string, action: 'approve' | 'reject') => {
    try {
      // Mock approval - in a real app, this would update approval status
      logInfo(`${action} content`, { contentId, action }, 'ContentModeration');

      setContent(prev => 
        prev.map(item => 
          item.id === contentId 
            ? { ...item, approval_status: action === 'approve' ? 'approved' : 'rejected' }
            : item
        )
      );

      toast({
        title: `Content ${action}d`,
        description: `Content has been ${action}d successfully`
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error updating content",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handlePromotion = async (contentId: string, promote: boolean) => {
    try {
      // Mock promotion - in a real app, this would call RPC functions
      logInfo(`${promote ? 'Promote' : 'Unpromote'} content`, { contentId, promote }, 'ContentModeration');

      setContent(prev => 
        prev.map(item => 
          item.id === contentId 
            ? { ...item, is_promoted: promote }
            : item
        )
      );

      toast({
        title: `Content ${promote ? 'promoted' : 'unpromoted'}`,
        description: `Content has been ${promote ? 'promoted' : 'unpromoted'} successfully`
      });
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast({
        title: "Error updating promotion",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getApprovalBadge = (approval: string) => {
    switch (approval) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{approval}</Badge>;
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesApproval = approvalFilter === 'all' || item.approval_status === approvalFilter;
    
    return matchesSearch && matchesStatus && matchesApproval;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
        <p className="text-muted-foreground">Review and manage platform content</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Approval Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approvals</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContent.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    {getStatusBadge(item.status)}
                    {getApprovalBadge(item.approval_status)}
                    {item.is_promoted && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Promoted
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {item.view_count || 0} views
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {item.like_count || 0} likes
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="h-4 w-4" />
                      {item.share_count || 0} shares
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.approval_status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproval(item.id, 'approve')}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproval(item.id, 'reject')}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {item.approval_status === 'approved' && (
                    <Button
                      variant={item.is_promoted ? "outline" : "default"}
                      size="sm"
                      onClick={() => handlePromotion(item.id, !item.is_promoted)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {item.is_promoted ? 'Unpromote' : 'Promote'}
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};