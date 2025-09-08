import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Target, 
  Plus, 
  Users, 
  DollarSign, 
  Heart, 
  FileText, 
  PlayCircle,
  Calendar as CalendarIcon,
  Trophy,
  Trash2,
  Edit3
} from 'lucide-react';
import { useCreatorAnalytics, CreatorGoal } from '@/hooks/useCreatorAnalytics';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const goalIcons = {
  followers: Users,
  revenue: DollarSign,
  engagement: Heart,
  content: FileText,
  streams: PlayCircle
};

export const GoalsManager = () => {
  const { goals, createGoal, updateGoalProgress, loading } = useCreatorAnalytics();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'followers' as CreatorGoal['goal_type'],
    target_value: '',
    deadline: undefined as Date | undefined
  });

  const handleCreateGoal = async () => {
    if (!newGoal.target_value || isNaN(Number(newGoal.target_value))) {
      toast({
        title: "Error",
        description: "Please enter a valid target value",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGoal({
        goal_type: newGoal.goal_type,
        target_value: Number(newGoal.target_value),
        deadline: newGoal.deadline?.toISOString().split('T')[0]
      });

      setShowCreateDialog(false);
      setNewGoal({
        goal_type: 'followers',
        target_value: '',
        deadline: undefined
      });

      toast({
        title: "Goal Created",
        description: "Your new goal has been set successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    }
  };

  const getGoalDescription = (goal: CreatorGoal) => {
    const descriptions = {
      followers: 'Grow your audience',
      revenue: 'Increase earnings',
      engagement: 'Boost interaction rates',
      content: 'Create more posts',
      streams: 'Host live streams'
    };
    return descriptions[goal.goal_type];
  };

  const getProgressPercentage = (goal: CreatorGoal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getTimeRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Goals & Targets</h2>
          <p className="text-muted-foreground">Set and track your creator goals</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select
                  value={newGoal.goal_type}
                  onValueChange={(value) => setNewGoal(prev => ({ ...prev, goal_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="revenue">Revenue ($)</SelectItem>
                    <SelectItem value="engagement">Engagement Rate (%)</SelectItem>
                    <SelectItem value="content">Content Posts</SelectItem>
                    <SelectItem value="streams">Live Streams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  placeholder="Enter target number..."
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Deadline (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newGoal.deadline ? format(newGoal.deadline, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newGoal.deadline}
                      onSelect={(date) => setNewGoal(prev => ({ ...prev, deadline: date }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleCreateGoal} className="flex-1" disabled={loading}>
                  Create Goal
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => {
            const IconComponent = goalIcons[goal.goal_type];
            const progressPercentage = getProgressPercentage(goal);
            const isCompleted = goal.current_value >= goal.target_value;
            
            return (
              <Card key={goal.id} className={`relative ${isCompleted ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                {isCompleted && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-green-500 rounded-full p-1">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg capitalize">{goal.goal_type}</CardTitle>
                        <p className="text-sm text-muted-foreground">{getGoalDescription(goal)}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                        {goal.goal_type === 'revenue' && ' $'}
                        {goal.goal_type === 'engagement' && '%'}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progressPercentage.toFixed(1)}% completed
                    </p>
                  </div>

                  {goal.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Deadline:</span>
                      <Badge variant={
                        new Date(goal.deadline) < new Date() ? 'destructive' :
                        new Date(goal.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? 'secondary' :
                        'outline'
                      }>
                        {getTimeRemaining(goal.deadline)}
                      </Badge>
                    </div>
                  )}

                  {isCompleted && goal.achieved_at && (
                    <div className="text-center py-2">
                      <Badge className="bg-green-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        Completed on {new Date(goal.achieved_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Goals Set</h3>
            <p className="text-muted-foreground mb-4">
              Set your first goal to start tracking your creator journey
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};