import { Request, Response } from 'express';
import { documentService } from '../services/documentService';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const { document, folderName } = req.body;

        if (!folderName) {
            res.status(400).json({ error: 'Folder name is required' });
            console.log("Folder name is required");
            return;
        }

        if (!document || (!document.base64 && !document.uri)) {
            res.status(400).json({ 
                error: 'Document data is required. Provide either base64 data or file URI',
                example: {
                    document: {
                        base64: "base64_encoded_string",
                        // OR
                        uri: "file:///path/to/file",
                        type: "application/pdf", // optional, defaults to pdf
                        name: "document.pdf" // optional
                    },
                    folderName: "CustomerDocuments"
                }
            });
            console.log("Document data is required. Provide either base64 data or file URI");
            return;
        }
        console.log("about to upload document", document);
        const documentUrl = await documentService.uploadDocument(document, folderName);
        res.status(200).json({ documentUrl });
    } catch (error) {
        console.error('Error uploading document:', error);
        if (error instanceof Error) {
            if (error.message.includes('Invalid file type') || 
                error.message.includes('File size exceeds') ||
                error.message.includes('Either base64 or uri must be provided')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to upload document',
                    details: error.message 
                });
            }
        } else {
            res.status(500).json({ error: 'Failed to upload document' });
        }
    }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const { documentUrl } = req.body;
        
        if (!documentUrl || typeof documentUrl !== 'string') {
            res.status(400).json({ 
                error: 'Valid document URL is required',
                example: {
                    documentUrl: "https://your-cloudflare-r2-url/path/to/document.pdf"
                }
            });
            return;
        }

        // Validate if the URL is from our Cloudflare R2 bucket
        const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
        if (!r2PublicUrl || !documentUrl.startsWith(r2PublicUrl)) {
            res.status(400).json({ 
                error: 'Invalid document URL. URL must be from our storage system.' 
            });
            return;
        }

        await documentService.deleteDocument(documentUrl);
        res.status(200).json({ 
            message: 'Document deleted successfully',
            documentUrl 
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        if (error instanceof Error) {
            res.status(500).json({ 
                error: 'Failed to delete document',
                details: error.message 
            });
        } else {
            res.status(500).json({ error: 'Failed to delete document' });
        }
    }
};
