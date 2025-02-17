import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import { R2AccessKeyID, R2BucketName, R2Endpoint, R2PublicUrl, R2SecretAccessKey } from '@/config';

interface ImageData {
    base64?: string;
    uri?: string;
    type?: string;
    data?: string;  // For direct base64 data
}

class ImageService {
    private s3Client: S3Client;
    private BUCKET_NAME: string;

    constructor() {
        // Ensure endpoint starts with https://
        const endpoint = R2Endpoint || '';
        const formattedEndpoint = endpoint.startsWith('https://') ? endpoint : `https://${endpoint}`;

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: formattedEndpoint,
            credentials: {
                accessKeyId: R2AccessKeyID!,
                secretAccessKey: R2SecretAccessKey!,
            },
            forcePathStyle: true, // Required for Cloudflare R2
            maxAttempts: 3, // Retry failed requests
            requestHandler: undefined, // Use the default Node.js HTTP handler
        });
        
        this.BUCKET_NAME = R2BucketName || '';
        
        // Validate configuration
        if (!this.BUCKET_NAME) {
            throw new Error('CLOUDFLARE_R2_BUCKET_NAME is required');
        }
        if (!R2AccessKeyID || !R2SecretAccessKey) {
            throw new Error('Cloudflare R2 credentials are required');
        }
        if (!formattedEndpoint) {
            throw new Error('CLOUDFLARE_R2_ENDPOINT is required');
        }
    }

    private async compressImage(buffer: Buffer): Promise<Buffer> {
        return sharp(buffer)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
    }

    private async getImageBuffer(image: ImageData): Promise<Buffer> {
        if (image.data) {
            // Handle direct base64 data
            return Buffer.from(image.data, 'base64');
        } else if (image.base64) {
            // Handle base64 with potential header
            const base64Data = image.base64.includes('base64,') 
                ? image.base64.split('base64,')[1] 
                : image.base64;
            return Buffer.from(base64Data, 'base64');
        } else if (image.uri) {
            try {
                // Handle file URI (local file system)
                const filePath = decodeURIComponent(image.uri.replace('file://', ''));
                return fs.readFile(filePath);
            } catch (error) {
                console.error('Error reading file:', error);
                throw new Error('Failed to read image file');
            }
        }
        throw new Error('Either base64, data, or uri must be provided');
    }

    async uploadImages(images: ImageData[], folderName: string): Promise<string[]> {
        // Sanitize folder name
        const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9-_]/g, '');
        
        const uploadPromises = images.map(async (image, index) => {
            try {
                const imageBuffer = await this.getImageBuffer(image);
                const compressedImageBuffer = await this.compressImage(imageBuffer);
                const fileName = `${sanitizedFolderName}/${randomUUID()}.jpg`;

                const uploadParams = {
                    Bucket: this.BUCKET_NAME,
                    Key: fileName,
                    Body: compressedImageBuffer,
                    ContentType: image.type || 'image/jpeg',
                };

                await this.s3Client.send(new PutObjectCommand(uploadParams));
                return `${R2PublicUrl}/${fileName}`;
            } catch (error) {
                console.error(`Error processing image ${index}:`, error);
                throw error;
            }
        });

        return Promise.all(uploadPromises);
    }

    async deleteImage(imageUrl: string): Promise<void> {
        try {
            const key = imageUrl.replace(`${R2PublicUrl}/`, '');
            await this.s3Client.send(new DeleteObjectCommand({
                Bucket: this.BUCKET_NAME,
                Key: key
            }));
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    async deleteImages(imageUrls: string[]): Promise<void> {
        const deletePromises = imageUrls.map(url => this.deleteImage(url));
        await Promise.all(deletePromises);
    }
}

export const imageService = new ImageService(); 