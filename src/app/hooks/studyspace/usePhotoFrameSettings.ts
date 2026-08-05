import { useRef, useState } from "react";

export type PhotoFrameTransition = "fade" | "slide" | "none";

const MAX_PHOTOS = 20;

export function usePhotoFrameSettings() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [images, setImages]             = useState<string[]>([]);
  const [intervalSec, setIntervalSec]   = useState(8);
  const [transition, setTransition]     = useState<PhotoFrameTransition>("fade");
  const [shuffle, setShuffle]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const containerRef                    = useRef<HTMLDivElement>(null);

  const addImage = (url: string) => setImages(prev => prev.length >= MAX_PHOTOS ? prev : [...prev, url]);
  const removeImage = (url: string) => setImages(prev => prev.filter(u => u !== url));

  return {
    settingsOpen, setSettingsOpen,
    images, setImages, addImage, removeImage,
    intervalSec, setIntervalSec,
    transition, setTransition,
    shuffle, setShuffle,
    uploading, setUploading,
    uploadProgress, setUploadProgress,
    containerRef,
    maxPhotos: MAX_PHOTOS,
  };
}
