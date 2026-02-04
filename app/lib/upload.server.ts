import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export interface UploadResult {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
}

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
}

/**
 * Validate file type
 */
function isValidImageType(mimeType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  return allowedTypes.includes(mimeType);
}

/**
 * Upload a file from FormData
 */
export async function uploadFile(
  file: File,
  subfolder: string = ""
): Promise<UploadResult> {
  try {
    await ensureUploadDir();

    // Validate file type
    if (!isValidImageType(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only images are allowed.",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File too large. Maximum size is 5MB.",
      };
    }

    // Generate unique filename
    const extension = getExtension(file.name);
    const uniqueFilename = `${uuidv4()}${extension}`;
    
    // Create subfolder if specified
    let uploadPath = UPLOAD_DIR;
    let urlPath = "/uploads";
    
    if (subfolder) {
      uploadPath = join(UPLOAD_DIR, subfolder);
      urlPath = `/uploads/${subfolder}`;
      await mkdir(uploadPath, { recursive: true });
    }

    // Write file
    const filePath = join(uploadPath, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return {
      success: true,
      filename: uniqueFilename,
      url: `${urlPath}/${uniqueFilename}`,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: "Failed to upload file.",
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  subfolder: string = ""
): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadFile(file, subfolder)));
}
