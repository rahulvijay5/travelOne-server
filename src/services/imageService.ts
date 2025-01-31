import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';

interface ImageData {
    base64?: string;
    uri?: string;
    type?: string;
}

class ImageService {
    private s3Client: S3Client;
    private BUCKET_NAME: string;

    constructor() {
        // Ensure endpoint starts with https://
        const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || '';
        const formattedEndpoint = endpoint.startsWith('https://') ? endpoint : `https://${endpoint}`;

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: formattedEndpoint,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true, // Required for Cloudflare R2
            maxAttempts: 3, // Retry failed requests
            requestHandler: undefined, // Use the default Node.js HTTP handler
        });
        
        this.BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
        
        // Validate configuration
        if (!this.BUCKET_NAME) {
            throw new Error('CLOUDFLARE_R2_BUCKET_NAME is required');
        }
        if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
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
        if (image.base64) {
            return Buffer.from(image.base64, 'base64');
        } else if (image.uri) {
            // Handle file URI (local file system)
            const filePath = decodeURIComponent(image.uri.replace('file://', ''));
            return fs.readFile(filePath);
        }
        throw new Error('Either base64 or uri must be provided');
    }

    async uploadImages(images: ImageData[], folderName: string): Promise<string[]> {
        const uploadPromises = images.map(async (image) => {
            try {
                const imageBuffer = await this.getImageBuffer(image);
                const compressedImageBuffer = await this.compressImage(imageBuffer);
                const fileName = `${folderName}/${randomUUID()}.jpg`;

                const uploadParams = {
                    Bucket: this.BUCKET_NAME,
                    Key: fileName,
                    Body: compressedImageBuffer,
                    ContentType: 'image/jpeg',
                };

                await this.s3Client.send(new PutObjectCommand(uploadParams));
                return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileName}`;
            } catch (error) {
                console.error('Error processing image:', error);
                throw error;
            }
        });

        return Promise.all(uploadPromises);
    }

    async deleteImage(imageUrl: string): Promise<void> {
        try {
            const key = imageUrl.replace(`${process.env.CLOUDFLARE_R2_PUBLIC_URL}/`, '');
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