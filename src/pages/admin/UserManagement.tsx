import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  MoreHorizontal,
  Eye,
  Ban,
  Crown,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  id: string;
  display_name: string;
  email: string;
  role: string;
  user_type: string;
  created_at: string;
  last_active: string;
  is_blocked: boolean;
  total_swipes: number;
  total_matches: number;
  total_posts: number;
  subscription_tier: string;
  subscribed: boolean;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data since admin_user_overview table doesn't exist in types
      const mockUsers = [
        {
          id: '1',
          display_name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          user_type: 'user',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          is_blocked: false,
          total_swipes: 15,
          total_matches: 5,
          total_posts: 3,
          subscription_tier: 'basic',
          subscribed: false
        },
        {
          id: '2',
          display_name: 'Jane Smith', 
          email: 'jane@example.com',
          role: 'user',
          user_type: 'user',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          is_blocked: false,
          total_swipes: 48,
          total_matches: 12,
          total_posts: 8,
          subscription_tier: 'premium',
          subscribed: true
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !isBlocked })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_blocked: !isBlocked }
            : user
        )
      );

      toast({
        title: `User ${!isBlocked ? 'blocked' : 'unblocked'}`,
        description: "User status updated successfully"
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error updating user",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handlePromoteUser = async (userEmail: string) => {
    try {
      const { error } = await supabase.rpc('promote_to_admin', {
        _user_email: userEmail
      });

      if (error) throw error;

      // Refresh users list
      await fetchUsers();

      toast({
        title: "User promoted",
        description: "User has been promoted to admin successfully"
      });
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: "Error promoting user",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'service_provider':
        return <Badge className="bg-blue-500"><Shield className="h-3 w-3 mr-1" />Provider</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'premium':
        return <Badge className="bg-yellow-500">Premium</Badge>;
      default:
        return <Badge variant="outline">Basic</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'blocked' && user.is_blocked) ||
                         (statusFilter === 'active' && !user.is_blocked);
    
    return matchesSearch && matchesRole && matchesStatus;
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
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage platform users and their permissions</p>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                      {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{user.display_name || 'Unknown'}</h4>
                      {getRoleBadge(user.role)}
                      {getUserTypeBadge(user.user_type)}
                      {user.is_blocked && (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                      {user.subscribed && (
                        <Badge className="bg-green-500">Subscribed</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Last active {new Date(user.last_active).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{user.total_matches || 0} matches</span>
                      <span>•</span>
                      <span>{user.total_swipes || 0} swipes</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  {user.role !== 'admin' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePromoteUser(user.email)}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Promote
                    </Button>
                  )}
                  
                  <Button
                    variant={user.is_blocked ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => handleBlockUser(user.id, user.is_blocked)}
                  >
                    {user.is_blocked ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Block
                      </>
                    )}
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};