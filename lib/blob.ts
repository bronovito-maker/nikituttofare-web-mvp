import { put } from '@vercel/blob';

export async function uploadPublicBlob(filename: string, body: ReadableStream | Blob | ArrayBuffer) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('Variabile BLOB_READ_WRITE_TOKEN mancante.');
  }

  return put(filename, body, {
    access: 'public',
    addRandomSuffix: true,
    token,
  });
}
