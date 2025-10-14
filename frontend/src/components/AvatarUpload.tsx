import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Camera, Loader2, User as UserIcon } from 'lucide-react';
import { storageService } from '../services/storageService';

interface AvatarUploadProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
  onImageRemove: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentImage,
  onImageChange,
  onImageRemove,
  size = 'md',
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await storageService.uploadImage(file, 'avatars');
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
      <div className={`relative group ${sizeClasses[size]} ${className}`}>
        <img
          src={currentImage}
          alt="Avatar"
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-primary-500`}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center w-8 h-8 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onImageRemove}
              className="flex items-center justify-center w-8 h-8 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
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
    <div className={`${sizeClasses[size]} ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-dashed transition-colors cursor-pointer flex items-center justify-center bg-primary-600 ${
          dragActive 
            ? 'border-primary-500 bg-primary-900/20' 
            : 'border-primary-500 hover:border-primary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
        ) : (
          <div className="text-center">
            <Camera className={`${iconSizes[size]} text-white mx-auto mb-1`} />
            <p className="text-xs text-white">Upload</p>
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

export default AvatarUpload;
