"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface ImageHistoryItem {
  id: string;
  imageData: string; // base64 data URL
  mimeType: string;
  prompt: string;
  style?: string;
  size: string;
  provider: string;
  model?: string;
  timestamp: number;
}

interface ImageHistoryContextType {
  images: ImageHistoryItem[];
  addImage: (image: Omit<ImageHistoryItem, "id" | "timestamp">) => void;
  deleteImage: (id: string) => void;
  clearHistory: () => void;
  exportHistory: () => void;
  isLoading: boolean;
}

const ImageHistoryContext = createContext<ImageHistoryContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "gatekeep_image_history";
const MAX_IMAGES = 100; // Limit to prevent localStorage overflow

export function ImageHistoryProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setImages(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load image history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever images change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
      } catch (error) {
        console.error("Failed to save image history:", error);
      }
    }
  }, [images, isLoading]);

  const addImage = useCallback(
    (image: Omit<ImageHistoryItem, "id" | "timestamp">) => {
      const newImage: ImageHistoryItem = {
        ...image,
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: Date.now(),
      };

      setImages((prev) => {
        const updated = [newImage, ...prev];
        // Keep only the most recent MAX_IMAGES
        return updated.slice(0, MAX_IMAGES);
      });
    },
    [],
  );

  const deleteImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to delete all image history? This cannot be undone.",
      )
    ) {
      setImages([]);
    }
  }, []);

  const exportHistory = useCallback(() => {
    if (images.length === 0) {
      alert("No images to export.");
      return;
    }

    const exportData = {
      version: 1,
      exported: new Date().toISOString(),
      images: images.map((img) => ({
        ...img,
        timestamp: new Date(img.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gatekeep-image-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [images]);

  return (
    <ImageHistoryContext.Provider
      value={{
        images,
        addImage,
        deleteImage,
        clearHistory,
        exportHistory,
        isLoading,
      }}
    >
      {children}
    </ImageHistoryContext.Provider>
  );
}

export function useImageHistory() {
  const context = useContext(ImageHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useImageHistory must be used within ImageHistoryProvider",
    );
  }
  return context;
}
