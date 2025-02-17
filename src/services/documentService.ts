import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { R2AccessKeyID, R2BucketName, R2Endpoint, R2PublicUrl, R2SecretAccessKey } from '@/config';

interface DocumentData {
    base64?: string;
    uri?: string;
    type?: string;
    name?: string;
}

class DocumentService {
    private s3Client: S3Client;
    private BUCKET_NAME: string;
    private ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/heic',
        'image/heif'
    ];
    private MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
            forcePathStyle: true,
            maxAttempts: 3,
            requestHandler: undefined,
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

    private async processImage(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
        try {
            const processedBuffer = await sharp(buffer)
                .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();
            return { buffer: processedBuffer, contentType: 'image/jpeg' };
        } catch (error) {
            console.error('Error processing image:', error);
            // If image processing fails, return original buffer
            return { buffer, contentType: 'image/jpeg' };
        }
    }

    private async getDocumentBuffer(document: DocumentData): Promise<Buffer> {
        if (document.base64) {
            return Buffer.from(document.base64, 'base64');
        } else if (document.uri) {
            const filePath = decodeURIComponent(document.uri.replace('file://', ''));
            return fs.readFile(filePath);
        }
        throw new Error('Either base64 or uri must be provided');
    }

    private getFileExtension(mimeType: string): string {
        const extensions: { [key: string]: string } = {
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/heic': 'heic',
            'image/heif': 'heif'
        };
        return extensions[mimeType] || 'pdf';
    }

    private async validateDocument(buffer: Buffer, mimeType: string): Promise<void> {
        if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
            throw new Error('Invalid file type. Only PDF and images are allowed.');
        }

        if (buffer.length > this.MAX_FILE_SIZE) {
            throw new Error('File size exceeds maximum limit of 10MB.');
        }
    }

    async uploadDocument(document: DocumentData, folderName: string): Promise<string> {
        try {
            console.log("Uploading document:", document);
            const documentBuffer = await this.getDocumentBuffer(document);
            const mimeType = document.type || 'application/pdf';

            // Validate document
            await this.validateDocument(documentBuffer, mimeType);
            console.log("Document validated");
            let uploadBuffer: Buffer;
            let contentType: string;

            // Process if it's an image
            if (mimeType.startsWith('image/')) {
                const processed = await this.processImage(documentBuffer);
                uploadBuffer = processed.buffer;
                contentType = processed.contentType;
            } else {
                uploadBuffer = documentBuffer;
                contentType = mimeType;
            }
            console.log("Document processed");
            const extension = this.getFileExtension(contentType);
            const fileName = `${folderName}/${randomUUID()}.${extension}`;
            console.log("File name:", fileName);
            const uploadParams = {
                Bucket: this.BUCKET_NAME,
                Key: fileName,
                Body: uploadBuffer,
                ContentType: contentType,
            };
            console.log("Upload params:", uploadParams);
            await this.s3Client.send(new PutObjectCommand(uploadParams));
            console.log("Document uploaded successfully");
            return `${R2PublicUrl}/${fileName}`;
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    }

    async deleteDocument(documentUrl: string): Promise<void> {
        try {
            const key = documentUrl.replace(`${R2PublicUrl}/`, '');
            await this.s3Client.send(new DeleteObjectCommand({
                Bucket: this.BUCKET_NAME,
                Key: key
            }));
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
}

export const documentService = new DocumentService();