import { storage, isConfigured } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const storageService = {
  /**
   * Uploads a local image file to Firebase Storage.
   * Returns public download URL.
   */
  async uploadPhoto(localUri: string, destinationPath: string): Promise<string> {
    if (!isConfigured) {
      // In offline / unconfigured mode, maintain local file reference
      return localUri;
    }

    try {
      // Fetch the file as a blob
      const response = await fetch(localUri);
      const blob = await response.blob();

      const storageRef = ref(storage, destinationPath);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return downloadUrl;
    } catch (error) {
      console.warn('[FirebaseStorage] Upload failed, falling back to local reference:', error);
      throw error;
    }
  },

  /**
   * Uploads material lot photos and returns remote URLs.
   */
  async uploadLotPhotos(lotId: string, localUris: string[]): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < localUris.length; i++) {
      const uri = localUris[i];
      // Skip if already a remote URL
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        urls.push(uri);
        continue;
      }

      const filename = `photo_${Date.now()}_${i}.jpg`;
      const path = `lots/${lotId}/${filename}`;
      const url = await this.uploadPhoto(uri, path);
      urls.push(url);
    }

    return urls;
  },
};
