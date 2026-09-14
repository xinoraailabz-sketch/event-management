import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (base64Url: string) => void;
  className?: string;
  recommendedResolution?: string;
  aspectRatioLabel?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  className,
  recommendedResolution = '1200 × 630 px',
  aspectRatioLabel = '16:9 Landscape',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stock presets for quick fallback
  const stockPresets = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
  ];

  // Client-side image processor: compresses and resizes to max 1200px width base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions preserving aspect ratio (max 1200px width)
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to base64 JPEG format at 0.85 quality
          const base64Data = canvas.toDataURL('image/jpeg', 0.85);
          onChange(base64Data);
        } else {
          // Fallback to raw data URL
          onChange(e.target?.result as string);
        }

        setIsProcessing(false);
      };

      img.onerror = () => {
        setErrorMessage('Failed to process the image. Please try another file.');
        setIsProcessing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setErrorMessage('Error reading image file.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload / Preview Box */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-[#E8E5DF] bg-[#1A1A1A] group shadow-xs">
          <div className="aspect-[16/7] sm:aspect-[16/6] w-full relative">
            <img
              src={value}
              alt="Event Banner Preview"
              className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Top Badge */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#1A1A1A] text-[11px] font-bold shadow-xs">
                Active Event Banner
              </span>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1A1A1A] text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-xl bg-black/60 hover:bg-red-600 text-white shadow-sm transition-all cursor-pointer"
                title="Remove banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-3 left-3 right-3 text-white text-xs flex items-center justify-between">
              <span className="text-white/80 font-medium">Stored as Base64 in Database</span>
              <span className="text-[11px] bg-black/40 px-2 py-0.5 rounded-md font-mono">
                {recommendedResolution}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3',
            isDragging
              ? 'border-[#C49A3C] bg-[#FFFDF9]'
              : 'border-[#E8E5DF] bg-[#FAFAF7] hover:bg-[#F5F3EE] hover:border-[#D5D0C8]'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5EDD8] border border-[#E8E5DF] flex items-center justify-center text-[#8B6914] shadow-xs">
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-[#8B6914]/40 border-t-[#8B6914] rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">
              Click to upload or drag and drop event banner
            </p>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Exact Recommended Resolution: <strong className="text-[#1A1A1A] font-semibold">{recommendedResolution}</strong> ({aspectRatioLabel})
            </p>
            <p className="text-[11px] text-[#9A9A9A] mt-0.5">
              Supports: JPG, PNG, WebP (Max 5MB) • Converted to Base64
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
      )}

      {/* Preset Library Fallback */}
      <div>
        <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider block mb-2">
          Or pick from stock event presets
        </span>
        <div className="grid grid-cols-3 gap-3">
          {stockPresets.map((imgUrl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(imgUrl)}
              className={cn(
                'h-20 rounded-xl overflow-hidden border-2 transition-all relative cursor-pointer',
                value === imgUrl
                  ? 'border-[#C49A3C] ring-2 ring-[#C49A3C]/30 shadow-xs'
                  : 'border-transparent opacity-75 hover:opacity-100 hover:border-[#E8E5DF]'
              )}
            >
              <img src={imgUrl} className="w-full h-full object-cover" alt={`Preset ${i + 1}`} />
              {value === imgUrl && (
                <div className="absolute top-1.5 right-1.5 bg-[#C49A3C] text-white rounded-full p-0.5 shadow-xs">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
