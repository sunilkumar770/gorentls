import api from '@/lib/axios';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Placeholder for Java backend avatar upload
  console.log('Uploading avatar for', userId);
  return URL.createObjectURL(file);
}

export async function deleteFile(bucket: string, path: string) {
  // Placeholder for Java backend file delete
  console.log('Deleting file', path, 'from', bucket);
}
