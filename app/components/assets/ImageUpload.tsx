import { useState, useRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Upload, Trash2, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface ImageUploadProps {
  assetId: string;
  currentImageUrl?: string | null;
  onImageChange?: (imageUrl: string | null) => void;
  canEdit?: boolean;
}

export function ImageUpload({
  assetId,
  currentImageUrl,
  onImageChange,
  canEdit = true,
}: ImageUploadProps) {
  const fetcher = useFetcher<{ success: boolean; imageUrl?: string | null; error?: string }>();
  const deleteFetcher = useFetcher();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isUploading = fetcher.state === "submitting";
  const isDeleting = deleteFetcher.state === "submitting";

  // Use fetcher result or current image
  const displayImageUrl = fetcher.data?.imageUrl ?? currentImageUrl;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetId", assetId);

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/upload",
      encType: "multipart/form-data",
    });
  };

  const handleDelete = () => {

    deleteFetcher.submit(
      { intent: "delete-image" },
      { method: "POST" }
    );

    setPreviewUrl(null);
    onImageChange?.(null);
  };

  const handleClick = () => {
    if (canEdit && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Clear preview on successful upload
  if (fetcher.data?.success && previewUrl) {
    setPreviewUrl(null);
    onImageChange?.(fetcher.data.imageUrl ?? null);
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          className={`relative aspect-square bg-muted ${canEdit ? "cursor-pointer group" : ""}`}
          onClick={handleClick}
        >
          {/* Image or placeholder */}
          {displayImageUrl || previewUrl ? (
            <img
              src={previewUrl || displayImageUrl || ""}
              alt="Asset"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p className="text-sm">No image</p>
              {canEdit && <p className="text-xs">Click to upload</p>}
            </div>
          )}

          {/* Loading overlay */}
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">{isDeleting ? "Deleting..." : "Uploading..."}</span>
            </div>
          )}

          {/* Hover overlay for edit */}
          {canEdit && !isUploading && !isDeleting && (
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          )}
        </div>

        {/* Error message */}
        {fetcher.data?.error && (
          <div className="p-2 bg-destructive/10 text-destructive text-sm">
            {fetcher.data.error}
          </div>
        )}

        {/* Delete button */}
        {canEdit && displayImageUrl && !isUploading && !isDeleting && (
          <div className="p-2 border-t">
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Image
                </Button>
              </DialogTrigger>
              <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Remove Image</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this asset image? This action will permanently delete the image file.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      handleDelete();
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Remove Image
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
          disabled={!canEdit || isUploading}
        />
      </CardContent>
    </Card>
  );
}
