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
      // Fetch the file as a blob. On Web, use window.fetch to avoid React Native base64 blob polyfill warning
      let blob: Blob;
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const response = await window.fetch(localUri);
        blob = await response.blob();
      } else {
        const response = await fetch(localUri);
        blob = await response.blob();
      }

      const storageRef = ref(storage, destinationPath);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return downloadUrl;
    } catch (error: any) {
      if (error?.code === 'storage/unauthorized' || error?.message?.includes('unauthorized') || error?.message?.includes('User does not have permission')) {
        console.warn(
          `[FirebaseStorage] Cloud storage unauthorized for ${destinationPath} (deploy storage.rules to allow photo uploads). Maintaining local reference.`
        );
      } else {
        console.warn('[FirebaseStorage] Upload failed, falling back to local reference:', error);
      }
      // Return local URI safely so offline-first flow and lot sync continue without crashing
      return localUri;
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
