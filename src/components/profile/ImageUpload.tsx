import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  currentImages: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ 
  currentImages, 
  onImagesChange, 
  maxImages = 6 
}: ImageUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(url => url !== null) as string[];
      
      if (successfulUploads.length > 0) {
        onImagesChange([...currentImages, ...successfulUploads]);
        toast({
          title: "Images uploaded",
          description: `${successfulUploads.length} image(s) uploaded successfully`
        });
      }

      if (successfulUploads.length !== results.length) {
        toast({
          title: "Some uploads failed",
          description: "Some images could not be uploaded",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageUrl: string) => {
    try {
      // Extract file path from URL for deletion
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from('profiles')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
      }

      // Remove from current images
      onImagesChange(currentImages.filter(img => img !== imageUrl));
      
      toast({
        title: "Image removed",
        description: "Image has been deleted"
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete image",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {currentImages.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <Card className="overflow-hidden">
              <div className="aspect-square">
                <img
                  src={imageUrl}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(imageUrl)}
              >
                <X className="w-4 h-4" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2">
                  <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Main
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}

        {currentImages.length < maxImages && (
          <Card 
            className="aspect-square border-dashed border-2 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Add Photo'}
              </p>
            </div>
          </Card>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <div className="text-sm text-muted-foreground">
        {currentImages.length}/{maxImages} photos • First photo will be your main profile picture
      </div>
    </div>
  );
};