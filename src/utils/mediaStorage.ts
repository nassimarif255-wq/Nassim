import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImageToBlob } from './imageProcessor';

export type MediaFolder = 'projects' | 'artisans' | 'requests';

/**
 * Compresses image on client, attempts upload to Firebase Storage for HTTPS URL,
 * and falls back cleanly to compressed Data URI when Storage bucket rules/CORS are unavailable.
 */
export async function uploadMediaImage(
  file: File,
  folder: MediaFolder,
  ownerUid: string
): Promise<string> {
  const { blob, dataUrl } = await compressImageToBlob(file);

  const safeFolder = folder;
  const safeUid = ownerUid.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const storagePath =
    safeFolder === 'requests'
      ? `requests/${safeUid}/${fileName}`
      : `${safeFolder}/${safeUid}/${fileName}`;

  try {
    const storageRef = ref(storage, storagePath);
    const uploadPromise = uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    }).then((snap) => getDownloadURL(snap.ref));

    const timeoutPromise = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error('storage_timeout')), 5000)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    if (downloadUrl && downloadUrl.startsWith('https://')) {
      return downloadUrl;
    }
  } catch {
    // Graceful fallback to validated compressed Data URI (< 340 KB)
  }

  if (dataUrl.length > 340000) {
    throw new Error('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر.');
  }
  return dataUrl;
}
