import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  Loader2,
  Camera,
  Crop,
  Palette,
  Type,
  RotateCw,
  Sun,
  Contrast
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface MediaFile {
  file: File;
  preview: string;
  type: string;
  id: string;
  compressed?: File;
  edited?: boolean;
}

interface MediaUploaderProps {
  mediaFiles: MediaFile[];
  onMediaChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  uploading?: boolean;
  uploadProgress?: Record<string, number>;
}

interface ImageEditorProps {
  mediaFile: MediaFile;
  onSave: (editedFile: MediaFile) => void;
  onClose: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ mediaFile, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    rotation: 0
  });
  const [textOverlay, setTextOverlay] = useState('');

  const applyFilters = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply rotation
      if (filters.rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((filters.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Apply filters
      ctx.filter = `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        blur(${filters.blur}px)
      `;

      ctx.drawImage(img, 0, 0);

      // Add text overlay
      if (textOverlay) {
        ctx.font = '32px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText(textOverlay, canvas.width / 2, canvas.height - 50);
        ctx.fillText(textOverlay, canvas.width / 2, canvas.height - 50);
      }

      if (filters.rotation !== 0) {
        ctx.restore();
      }
    };
    img.src = mediaFile.preview;
  }, [mediaFile.preview, filters, textOverlay]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const editedFile = new File([blob], mediaFile.file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        const editedMediaFile: MediaFile = {
          ...mediaFile,
          file: editedFile,
          preview: URL.createObjectURL(blob),
          edited: true
        };
        
        onSave(editedMediaFile);
      }
    }, 'image/jpeg', 0.9);
  };

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Image Editor
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="relative bg-card rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Brightness
              </label>
              <Slider
                value={[filters.brightness]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, brightness: value }))}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{filters.brightness}%</span>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                Contrast
              </label>
              <Slider
                value={[filters.contrast]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, contrast: value }))}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{filters.contrast}%</span>
            </div>

            <div>
              <label className="text-sm font-medium mb-2">Saturation</label>
              <Slider
                value={[filters.saturation]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, saturation: value }))}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{filters.saturation}%</span>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Rotation
              </label>
              <Slider
                value={[filters.rotation]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, rotation: value }))}
                min={-180}
                max={180}
                step={90}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{filters.rotation}°</span>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Text Overlay
              </label>
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="Add text..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  mediaFiles,
  onMediaChange,
  maxFiles = 10,
  uploading = false,
  uploadProgress = {}
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/webm', 'video/avi'
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload images (JPG, PNG, GIF, WEBP) or videos (MP4, MOV, WEBM, AVI)",
        variant: "destructive"
      });
      return false;
    }

    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 25 * 1024 * 1024; // 100MB for video, 25MB for images
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${file.type.startsWith('video/') ? '100MB' : '25MB'}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, []);

  const processFiles = useCallback((files: FileList) => {
    const newFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file) && mediaFiles.length + newFiles.length < maxFiles) {
        const mediaFile: MediaFile = {
          file,
          preview: URL.createObjectURL(file),
          type: file.type,
          id: `${Date.now()}-${Math.random()}`
        };
        newFiles.push(mediaFile);
      }
    });

    if (newFiles.length > 0) {
      onMediaChange([...mediaFiles, ...newFiles]);
    }

    if (mediaFiles.length + newFiles.length >= maxFiles) {
      toast({
        title: "Upload limit reached",
        description: `You can upload up to ${maxFiles} files`,
        variant: "destructive"
      });
    }
  }, [mediaFiles, maxFiles, onMediaChange, validateFile]);

  const removeFile = useCallback((id: string) => {
    const updatedFiles = mediaFiles.filter(file => file.id !== id);
    onMediaChange(updatedFiles);
  }, [mediaFiles, onMediaChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  const handleEditImage = useCallback((mediaFile: MediaFile) => {
    if (mediaFile.type.startsWith('image/')) {
      setEditingFile(mediaFile);
    }
  }, []);

  const handleSaveEdit = useCallback((editedFile: MediaFile) => {
    const updatedFiles = mediaFiles.map(file => 
      file.id === editedFile.id ? editedFile : file
    );
    onMediaChange(updatedFiles);
    setEditingFile(null);
  }, [mediaFiles, onMediaChange]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-dashed transition-colors cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <CardContent className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Media</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop files here, or click to select
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={openFileSelector} variant="outline" size="sm">
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
            <Button onClick={openCameraCapture} variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mediaFiles.length}/{maxFiles} files • Images: 25MB • Videos: 100MB
          </p>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Media Preview Grid */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaFiles.map((mediaFile) => (
            <Card key={mediaFile.id} className="relative overflow-hidden group">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  {mediaFile.type.startsWith('image/') ? (
                    <img
                      src={mediaFile.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-card flex items-center justify-center">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Progress overlay */}
                  {uploading && uploadProgress[`media_${mediaFiles.indexOf(mediaFile)}`] && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <Progress 
                          value={uploadProgress[`media_${mediaFiles.indexOf(mediaFile)}`]} 
                          className="w-20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {mediaFile.type.startsWith('image/') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditImage(mediaFile);
                        }}
                      >
                        <Crop className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(mediaFile.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* File type badge */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {mediaFile.type.startsWith('image/') ? 'IMG' : 'VID'}
                      {mediaFile.edited && ' (Edited)'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Editor */}
      {editingFile && (
        <ImageEditor
          mediaFile={editingFile}
          onSave={handleSaveEdit}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
};