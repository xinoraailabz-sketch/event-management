/**
 * Cloudinary Helper for Uploading QR Code Images
 * Converts Base64 QR code data URLs into permanent HTTPS URLs for email delivery.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dp4ixfvbt';
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '688679891425587';
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'Y8Sv8ecaZyvWeaQ38utBlN1c5qg';

/**
 * Generate SHA-1 hash for Cloudinary authenticated upload
 */
async function generateSha1(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload a Base64 data URL to Cloudinary and return the secure HTTPS URL
 */
export async function uploadQRCodeToCloudinary(
  base64DataUrl: string,
  publicIdPrefix: string = 'eventflow_qr'
): Promise<string> {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'eventflow_qr_passes';
    const cleanPrefix = publicIdPrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${cleanPrefix}_${Date.now()}`;

    // Cloudinary signature parameters in alphabetical order
    const strToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await generateSha1(strToSign);

    const formData = new FormData();
    formData.append('file', base64DataUrl);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', folder);
    formData.append('public_id', publicId);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      console.log('[Cloudinary] Uploaded QR code successfully:', data.secure_url);
      return data.secure_url;
    }

    console.warn('[Cloudinary] Upload did not return secure_url:', data);
    return '';
  } catch (err) {
    console.error('[Cloudinary] Failed to upload QR image to Cloudinary:', err);
    return '';
  }
}

/**
 * Upload any File, Blob, or base64 data to Cloudinary and return secure HTTPS URL
 */
export async function uploadMediaToCloudinary(
  fileOrBase64: File | Blob | string,
  folder: string = 'eventflow_attendee_uploads',
  publicIdPrefix: string = 'attendee_file'
): Promise<string> {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const cleanPrefix = publicIdPrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${cleanPrefix}_${Date.now()}`;

    // Cloudinary signature parameters in alphabetical order
    const strToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await generateSha1(strToSign);

    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', folder);
    formData.append('public_id', publicId);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      console.log('[Cloudinary] Uploaded attendee file successfully:', data.secure_url);
      return data.secure_url;
    }

    console.warn('[Cloudinary] Upload did not return secure_url:', data);
    return '';
  } catch (err) {
    console.error('[Cloudinary] Failed to upload attendee file to Cloudinary:', err);
    return '';
  }
}

