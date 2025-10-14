import supabase from './supabaseClient';

export interface UploadResult {
  url: string;
  path: string;
}

class StorageService {
  private bucketName = 'article-images';

  async uploadImage(file: File, folder: string = 'covers'): Promise<UploadResult> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  }

  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Create bucket if it doesn't exist (run this once)
  async createBucket(): Promise<void> {
    const { data, error } = await supabase.storage.createBucket(this.bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && !error.message.includes('already exists')) {
      throw new Error(`Bucket creation failed: ${error.message}`);
    }
  }
}

export const storageService = new StorageService();
export default storageService;
