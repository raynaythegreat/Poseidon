"use client";

import { useState } from "react";
import { useImageHistory, ImageHistoryItem } from "@/contexts/ImageHistoryContext";

interface ImageHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onReuseImage: (imageData: string, mimeType: string) => void;
  onReusePrompt: (prompt: string, style?: string) => void;
}

export default function ImageHistoryPanel({
  open,
  onClose,
  onReuseImage,
  onReusePrompt,
}: ImageHistoryPanelProps) {
  const { images, deleteImage, clearHistory, exportHistory } = useImageHistory();
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);

  if (!open) return null;

  const handleDownload = (image: ImageHistoryItem) => {
    const a = document.createElement("a");
    a.href = image.imageData;
    a.download = `gatekeep-${image.id}.${image.mimeType.split("/")[1] || "png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this image from history?")) {
      deleteImage(id);
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="card w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-line/60">
          <div>
            <h2 className="text-lg font-semibold text-ink">Image History</h2>
            <p className="text-xs text-ink-muted mt-1">
              {images.length} {images.length === 1 ? "image" : "images"} saved locally
            </p>
          </div>
          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={exportHistory}
                  className="btn-secondary px-3 py-1.5 text-xs"
                  title="Export history as JSON"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="px-3 py-1.5 rounded-sm text-xs border border-red-300/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300/70 transition-colors"
                  title="Clear all history"
                >
                  Clear All
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-sm hover:bg-surface-muted/70 dark:hover:bg-surface-strong/70 text-ink-muted hover:text-ink  transition-colors"
              aria-label="Close history"
            >
              <svg className="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-muted/60 flex items-center justify-center">
                <svg className="w-8 h-8 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-ink-muted text-sm">No images generated yet</p>
              <p className="text-ink-muted text-xs mt-2">Generated images will appear here</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex">
            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    className={`group relative aspect-square rounded-none overflow-hidden cursor-pointer transition-all ${
                      selectedImage?.id === image.id
                        ? "ring-2 ring-accent-500 scale-105"
                        : "hover:ring-2 hover:ring-accent-400/60"
                    }`}
                  >
                    <img
                      src={image.imageData}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDelete(image.id, e)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-md bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                      <p className="text-[10px] text-white/90 truncate">{image.provider}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Image Detail */}
            {selectedImage && (
              <div className="w-80 border-l border-line/60 bg-surface/85 overflow-y-auto">
                <div className="p-4">
                  <img
                    src={selectedImage.imageData}
                    alt={selectedImage.prompt}
                    className="w-full rounded-sm mb-4"
                  />

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-ink mb-1">Prompt</p>
                      <p className="text-xs text-ink break-words">{selectedImage.prompt}</p>
                    </div>

                    {selectedImage.style && (
                      <div>
                        <p className="text-xs font-medium text-ink mb-1">Style</p>
                        <p className="text-xs text-ink">{selectedImage.style}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-ink mb-1">Size</p>
                        <p className="text-xs text-ink">{selectedImage.size}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink mb-1">Provider</p>
                        <p className="text-xs text-ink">{selectedImage.provider}</p>
                      </div>
                    </div>

                    {selectedImage.model && (
                      <div>
                        <p className="text-xs font-medium text-ink mb-1">Model</p>
                        <p className="text-xs text-ink">{selectedImage.model}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-ink mb-1">Generated</p>
                      <p className="text-xs text-ink">
                        {new Date(selectedImage.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-line/60 space-y-2">
                      <button
                        onClick={() => {
                          onReuseImage(selectedImage.imageData, selectedImage.mimeType);
                          onClose();
                        }}
                        className="w-full btn-gold px-3 py-2 text-xs"
                      >
                        Attach to Message
                      </button>
                      <button
                        onClick={() => {
                          onReusePrompt(selectedImage.prompt, selectedImage.style);
                          onClose();
                        }}
                        className="w-full btn-secondary px-3 py-2 text-xs"
                      >
                        Reuse Prompt
                      </button>
                      <button
                        onClick={() => handleDownload(selectedImage)}
                        className="w-full btn-secondary px-3 py-2 text-xs"
                      >
                        Download Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
