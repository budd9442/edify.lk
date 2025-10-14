import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
  onImageRemove: () => void;
  placeholder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  onImageRemove,
  placeholder = "Upload cover image",
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await storageService.uploadImage(file, 'covers');
      onImageChange(result.url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (currentImage) {
    return (
      <div className={`relative group ${className}`}>
        <img
          src={currentImage}
          alt="Cover"
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="text-sm">Replace</span>
            </button>
            <button
              onClick={onImageRemove}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Remove</span>
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary-500 bg-primary-900/20' 
            : 'border-dark-700 hover:border-primary-500/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto" />
            <div>
              <p className="text-white font-medium">Uploading image...</p>
              <p className="text-gray-400 text-sm">Please wait</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-white font-medium mb-2">
                {placeholder}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, WebP (max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
