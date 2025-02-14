import { Request, Response } from 'express';
import { imageService } from '../services/imageService';

export const uploadImages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { images, imageUris, folderName } = req.body;

        if (!folderName) {
            res.status(400).json({ error: 'Folder name is required' });
            return;
        }

        let imagesToUpload = [];

        if (images && Array.isArray(images)) {
            // Handle both new format (data property) and old format (base64 property)
            imagesToUpload = images.map(img => {
                if (img.data) {
                    return { data: img.data, type: img.type || 'image/jpeg' };
                } else if (img.base64) {
                    return { base64: img.base64, type: img.type || 'image/jpeg' };
                } else {
                    throw new Error('Invalid image format');
                }
            });
        } else if (imageUris && Array.isArray(imageUris)) {
            // Handle image URIs
            imagesToUpload = imageUris.map(uri => ({ uri }));
        } else {
            res.status(400).json({ error: 'No valid images provided' });
            return;
        }

        if (imagesToUpload.length === 0) {
            res.status(400).json({ error: 'No images to upload' });
            return;
        }

        const imageUrls = await imageService.uploadImages(imagesToUpload, folderName);
        res.status(200).json({ imageUrls });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
};

export const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl || typeof imageUrl !== 'string') {
            res.status(400).json({ error: 'Invalid image URL' });
            return;
        }
        await imageService.deleteImage(imageUrl);
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
};

export const deleteImages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { imageUrls } = req.body;
        if (!imageUrls || !Array.isArray(imageUrls)) {
            res.status(400).json({ error: 'Invalid image URLs' });
            return;
        }
        await imageService.deleteImages(imageUrls);
        res.status(200).json({ message: 'Images deleted successfully' });
    } catch (error) {
        console.error('Error deleting images:', error);
        res.status(500).json({ error: 'Failed to delete images' });
    }
};