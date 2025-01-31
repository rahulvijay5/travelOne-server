import express from 'express';
import { deleteImage, deleteImages, uploadImages } from '../controllers/imageController';

const router = express.Router();

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Upload multiple images
 *     description: Upload multiple images with compression. Images will be stored in the specified folder. Accepts either base64 encoded images or file URIs.
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     base64:
 *                       type: string
 *                       description: Base64 encoded image data
 *                     type:
 *                       type: string
 *                       description: Image MIME type (optional)
 *                 description: Array of base64 encoded images to upload
 *               imageUris:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file URIs to upload (alternative to images array)
 *               folderName:
 *                 type: string
 *                 description: Folder name to store images (e.g., CustomerDocuments, HotelImages, RoomImages)
 *             required:
 *               - folderName
 *             oneOf:
 *               - required: ['images']
 *               - required: ['imageUris']
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: URLs of the uploaded images
 *       400:
 *         description: Bad request (no images provided or missing folder name)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/upload', uploadImages);

/**
 * @swagger
 * /api/images/delete:
 *   delete:
 *     summary: Delete a single image
 *     description: Delete a single image from storage.
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image to delete
 *             required:
 *               - imageUrl
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       400:
 *         description: Invalid image URL
 *       500:
 *         description: Server error
 */
router.delete('/delete', deleteImage);

/**
 * @swagger
 * /api/images/bulk-delete:
 *   delete:
 *     summary: Delete multiple images
 *     description: Delete multiple images from storage.
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs of the images to delete
 *             required:
 *               - imageUrls
 *     responses:
 *       200:
 *         description: Images deleted successfully
 *       400:
 *         description: Invalid image URLs
 *       500:
 *         description: Server error
 */
router.delete('/bulk-delete', deleteImages);

export default router; 