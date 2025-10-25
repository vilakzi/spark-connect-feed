import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter,
  MoreHorizontal,
  Shield,
  Ban,
  Mail,
  Eye,
  Calendar,
  MapPin
} from 'lucide-react';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  displayName: string;
  email: string;
  age?: number;
  location?: string;
  createdAt: string;
  lastActive?: string;
  isBlocked: boolean;
  verificationLevel: number;
  role: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { stats } = useAdminAnalytics();

  // Mock data for demonstration
  React.useEffect(() => {
    // In a real app, this would fetch from your API
    const mockUsers: User[] = [
      {
        id: '1',
        displayName: 'Alice Johnson',
        email: 'alice@example.com',
        age: 28,
        location: 'New York, NY',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        verificationLevel: 3,
        role: 'user'
      },
      {
        id: '2',
        displayName: 'Bob Smith',
        email: 'bob@example.com',
        age: 32,
        location: 'Los Angeles, CA',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isBlocked: false,
        verificationLevel: 2,
        role: 'user'
      },
      {
        id: '3',
        displayName: 'Charlie Brown',
        email: 'charlie@example.com',
        age: 26,
        location: 'Chicago, IL',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: true,
        verificationLevel: 1,
        role: 'user'
      }
    ];
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && !user.isBlocked) ||
                         (filterStatus === 'blocked' && user.isBlocked);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getVerificationBadge = (level: number) => {
    if (level >= 3) return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    if (level >= 2) return <Badge className="bg-blue-100 text-blue-800">Partial</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Unverified</Badge>;
  };

  const getLastActiveStatus = (lastActive?: string) => {
    if (!lastActive) return 'Never';
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'Online';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return formatDistanceToNow(lastActiveDate, { addSuffix: true });
  };

  const getStatusColor = (lastActive?: string) => {
    if (!lastActive) return 'text-gray-500';
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'text-green-500';
    if (diffMinutes < 60) return 'text-blue-500';
    if (diffMinutes < 1440) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const handleUserAction = (userId: string, action: string) => {
    console.log(`${action} user:`, userId);
    // In a real app, this would make an API call
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management</span>
          <Badge variant="secondary">
            {stats?.totalUsers || 0} total users
          </Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4 mb-2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                </div>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No users found matching your criteria</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" alt={user.displayName} />
                  <AvatarFallback>
                    {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{user.displayName}</h3>
                    {user.verificationLevel > 0 && <Shield className="h-4 w-4 text-blue-500" />}
                    {user.isBlocked && <Ban className="h-4 w-4 text-red-500" />}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    {user.age && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {user.age} years
                      </span>
                    )}
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {user.location}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getVerificationBadge(user.verificationLevel)}
                  
                  <div className={`text-sm ${getStatusColor(user.lastActive)}`}>
                    {getLastActiveStatus(user.lastActive)}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'view')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'message')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUserAction(user.id, user.isBlocked ? 'unblock' : 'block')}
                        className={user.isBlocked ? 'text-green-600' : 'text-red-600'}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {user.isBlocked ? 'Unblock User' : 'Block User'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};