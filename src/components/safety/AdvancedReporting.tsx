import { useState } from 'react';
import { Shield, AlertTriangle, Camera, MessageSquare, User, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useReporting } from '@/hooks/useReporting';
import { useToast } from '@/hooks/use-toast';

interface AdvancedReportingProps {
  reportedUserId: string;
  reportedUserName: string;
  onClose: () => void;
}

export const AdvancedReporting = ({ reportedUserId, reportedUserName, onClose }: AdvancedReportingProps) => {
  const { submitting, submitReport, blockUser } = useReporting();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidenceType: '',
    evidenceFiles: [] as File[]
  });

  const reportReasons = [
    { value: 'harassment', label: 'Harassment or bullying', icon: AlertTriangle },
    { value: 'inappropriate_content', label: 'Inappropriate content', icon: Camera },
    { value: 'spam', label: 'Spam or fake profile', icon: User },
    { value: 'inappropriate_messages', label: 'Inappropriate messages', icon: MessageSquare },
    { value: 'underage', label: 'Underage user', icon: Shield },
    { value: 'scam', label: 'Scam or fraud', icon: AlertTriangle },
    { value: 'violence', label: 'Threats or violence', icon: AlertTriangle },
    { value: 'other', label: 'Other', icon: AlertTriangle }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason) {
      toast({
        title: "Please select a reason",
        description: "A reason for the report is required",
        variant: "destructive"
      });
      return;
    }

    // For now, we'll handle file uploads in a future implementation
    const success = await submitReport(reportedUserId, {
      reason: formData.reason,
      description: formData.description,
      evidenceUrls: [], // Will be implemented with file upload
      evidenceData: []
    });

    if (success) {
      onClose();
    }
  };

  const handleBlockUser = async () => {
    const success = await blockUser(reportedUserId);
    if (success) {
      onClose();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Report {reportedUserName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div>
            <Label htmlFor="reason">Reason for report *</Label>
            <Select 
              value={formData.reason} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reason) => {
                  const Icon = reason.icon;
                  return (
                    <SelectItem key={reason.value} value={reason.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {reason.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about this report..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              maxLength={500}
            />
            <div className="text-sm text-muted-foreground mt-1">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Evidence Upload Section */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium text-muted-foreground">
              Evidence (Screenshots, messages, etc.)
            </Label>
            <div className="mt-2 p-4 border-2 border-dashed border-muted rounded-lg">
              <div className="text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  File upload coming soon
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Screenshots help us investigate reports faster
                </p>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Your safety is our priority</p>
                <p className="text-muted-foreground">
                  All reports are reviewed by our moderation team within 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={submitting || !formData.reason}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
            
            <Button 
              type="button"
              variant="destructive"
              onClick={handleBlockUser}
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Block User
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};