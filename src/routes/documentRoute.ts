import express from 'express';
import { uploadDocument, deleteDocument } from '../controllers/documentController';

const router = express.Router();

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a document
 *     description: Upload a document (PDF or image) with optional compression for images. Document will be stored in the specified folder.
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - folderName
 *               - document
 *             properties:
 *               document:
 *                 type: object
 *                 oneOf:
 *                   - required: ['base64']
 *                   - required: ['uri']
 *                 properties:
 *                   base64:
 *                     type: string
 *                     description: Base64 encoded document data
 *                   uri:
 *                     type: string
 *                     description: File URI path to the document
 *                   type:
 *                     type: string
 *                     description: Document MIME type (optional, defaults to application/pdf)
 *                     enum: [application/pdf, image/jpeg, image/png, image/heic, image/heif]
 *                   name:
 *                     type: string
 *                     description: Original document name (optional)
 *               folderName:
 *                 type: string
 *                 description: Folder name to store document (e.g., CustomerDocuments)
 *             example:
 *               document:
 *                 base64: "base64_encoded_string"
 *                 type: "application/pdf"
 *                 name: "document.pdf"
 *               folderName: "CustomerDocuments"
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documentUrl:
 *                   type: string
 *                   description: URL of the uploaded document
 *       400:
 *         description: Bad request (invalid document data, type, or size)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 example:
 *                   type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
router.post('/upload', uploadDocument);

/**
 * @swagger
 * /api/documents/delete:
 *   delete:
 *     summary: Delete a document
 *     description: Delete a document from storage. Only accepts URLs from our storage system.
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentUrl
 *             properties:
 *               documentUrl:
 *                 type: string
 *                 description: URL of the document to delete
 *             example:
 *               documentUrl: "https://your-cloudflare-r2-url/CustomerDocuments/document.pdf"
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 documentUrl:
 *                   type: string
 *       400:
 *         description: Invalid document URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 example:
 *                   type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
router.delete('/delete', deleteDocument);

export default router; 