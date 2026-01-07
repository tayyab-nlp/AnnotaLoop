/**
 * Tauri File Storage Service
 * Handles persistent file storage using Tauri's filesystem APIs
 * This provides better persistence than IndexedDB for desktop apps
 */

import { BaseDirectory, exists, mkdir, readFile, writeFile, remove } from '@tauri-apps/plugin-fs';

// Directory structure:
// app_data/
//   files/
//     originals/     - Original uploaded files
//     annotated/     - Annotated PDFs

const FILES_DIR = 'files';
const ORIGINALS_DIR = 'files/originals';
const ANNOTATED_DIR = 'files/annotated';

/**
 * Initialize file storage directories
 */
export async function initTauriFileStorage(): Promise<void> {
    try {
        // Create directories if they don't exist
        const dirs = [FILES_DIR, ORIGINALS_DIR, ANNOTATED_DIR];

        for (const dir of dirs) {
            const dirExists = await exists(dir, { baseDir: BaseDirectory.AppData });
            if (!dirExists) {
                await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
            }
        }
        console.log('[FileStorage] Initialized Tauri file storage');
    } catch (error) {
        console.error('[FileStorage] Failed to initialize:', error);
        throw error;
    }
}

/**
 * Save a file to app data storage
 * @param fileData - File data as Uint8Array or ArrayBuffer
 * @param fileId - Unique file ID (should be generated before calling)
 * @param ext - File extension (e.g., '.pdf')
 * @param isAnnotated - Whether this is an annotated file
 */
export async function saveTauriFile(
    fileData: Uint8Array | ArrayBuffer,
    fileId: string,
    ext: string,
    isAnnotated: boolean = false
): Promise<void> {
    try {
        // Determine path
        const dir = isAnnotated ? ANNOTATED_DIR : ORIGINALS_DIR;
        const filePath = `${dir}/${fileId}${ext}`;

        // Convert ArrayBuffer to Uint8Array if needed
        const data = fileData instanceof ArrayBuffer ? new Uint8Array(fileData) : fileData;

        // Write file
        await writeFile(filePath, data, { baseDir: BaseDirectory.AppData });
        console.log(`[FileStorage] Saved file: ${filePath}`);
    } catch (error) {
        console.error('[FileStorage] Failed to save file:', error);
        throw error;
    }
}

/**
 * Load a file from app data storage
 * @param fileId - File ID
 * @param ext - File extension (e.g., '.pdf')
 * @param isAnnotated - Whether to look in annotated directory
 * @returns File data as Uint8Array
 */
export async function loadTauriFile(
    fileId: string,
    ext: string,
    isAnnotated: boolean = false
): Promise<Uint8Array> {
    try {
        const dir = isAnnotated ? ANNOTATED_DIR : ORIGINALS_DIR;
        const filePath = `${dir}/${fileId}${ext}`;

        const data = await readFile(filePath, { baseDir: BaseDirectory.AppData });
        console.log(`[FileStorage] Loaded file: ${filePath}, size: ${data.length} bytes`);
        return data;
    } catch (error) {
        console.error(`[FileStorage] Failed to load file ${fileId}${ext}:`, error);
        throw error;
    }
}

/**
 * Delete a file from app data storage
 * @param fileId - File ID to delete
 * @param ext - File extension
 * @param isAnnotated - Whether to look in annotated directory
 */
export async function deleteTauriFile(
    fileId: string,
    ext: string,
    isAnnotated: boolean = false
): Promise<void> {
    try {
        const dir = isAnnotated ? ANNOTATED_DIR : ORIGINALS_DIR;
        const filePath = `${dir}/${fileId}${ext}`;

        const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });
        if (fileExists) {
            await remove(filePath, { baseDir: BaseDirectory.AppData });
            console.log(`[FileStorage] Deleted file: ${filePath}`);
        }
    } catch (error) {
        console.error('[FileStorage] Failed to delete file:', error);
        throw error;
    }
}

/**
 * Check if a file exists in storage
 * @param fileId - File ID
 * @param ext - File extension
 * @param isAnnotated - Whether to check annotated directory
 * @returns True if file exists
 */
export async function fileExists(
    fileId: string,
    ext: string,
    isAnnotated: boolean = false
): Promise<boolean> {
    try {
        const dir = isAnnotated ? ANNOTATED_DIR : ORIGINALS_DIR;
        const filePath = `${dir}/${fileId}${ext}`;
        return await exists(filePath, { baseDir: BaseDirectory.AppData });
    } catch (error) {
        console.error('[FileStorage] Failed to check file existence:', error);
        return false;
    }
}

/**
 * Create a blob URL from file data for use in viewers
 * @param data - File data
 * @param mimeType - MIME type (e.g., 'application/pdf')
 * @returns Blob URL
 */
export function createBlobUrl(data: Uint8Array, mimeType: string): string {
    const blob = new Blob([data as any], { type: mimeType });
    return URL.createObjectURL(blob);
}

/**
 * Revoke a blob URL to free memory
 * @param url - Blob URL to revoke
 */
export function revokeBlobUrl(url: string): void {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

/**
 * Get MIME type from file extension
 * @param filename - Filename with extension
 * @returns MIME type
 */
export function getMimeType(filename: string): string {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.md': 'text/markdown'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Get file extension from filename
 * @param filename - Filename
 * @returns Extension including dot (e.g., '.pdf')
 */
export function getFileExtension(filename: string): string {
    return filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
}

/**
 * Helper to convert File object to Uint8Array
 * @param file - File object
 * @returns Uint8Array
 */
export async function fileToUint8Array(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}
