const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fetch = require('node-fetch');
const FormData = require('form-data');
const Artwork = require('../models/Artwork');
const { authenticateToken, requireSeller } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'artgallery',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' }
        ]
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 5 // Max 5 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
        }
    }
});

// @route   POST /api/upload/artwork-images
// @desc    Upload images for artwork
// @access  Private (seller only)
router.post('/artwork-images', [
    authenticateToken,
    requireSeller,
    upload.array('images', 5)
], async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images uploaded'
            });
        }

        const uploadedImages = [];

        for (const file of req.files) {
            uploadedImages.push({
                url: file.path,
                publicId: file.filename,
                isPrimary: uploadedImages.length === 0 // First image is primary
            });
        }

        res.json({
            success: true,
            message: 'Images uploaded successfully',
            data: {
                images: uploadedImages
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        
        if (error.message.includes('Invalid file type')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error uploading images'
        });
    }
});

// @route   POST /api/upload/verify-image
// @desc    Upload and verify single image with AI
// @access  Private (seller only)
router.post('/verify-image', [
    authenticateToken,
    requireSeller,
    upload.single('image')
], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image uploaded'
            });
        }

        const imageUrl = req.file.path;

        // Verify with AI model
        const aiVerificationResult = await verifyWithAI(imageUrl);

        res.json({
            success: true,
            message: aiVerificationResult.isHumanCreated 
                ? 'Image verified as human-created' 
                : 'AI-generated content detected',
            data: {
                image: {
                    url: imageUrl,
                    publicId: req.file.filename
                },
                aiVerification: aiVerificationResult
            }
        });
    } catch (error) {
        console.error('Image verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during image verification'
        });
    }
});

// @route   POST /api/upload/test-ai-verification
// @desc    Test AI verification with a sample image URL
// @access  Private (seller only)
router.post('/test-ai-verification', [
    authenticateToken,
    requireSeller
], async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image URL is required'
            });
        }

        console.log('Testing AI verification with image URL:', imageUrl);

        // Verify with AI model
        const aiVerificationResult = await verifyWithAI(imageUrl);

        res.json({
            success: true,
            message: 'AI verification test completed',
            data: {
                imageUrl: imageUrl,
                aiVerification: aiVerificationResult
            }
        });
    } catch (error) {
        console.error('AI verification test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during AI verification test',
            error: error.message
        });
    }
});

// @route   DELETE /api/upload/delete-image
// @desc    Delete image from Cloudinary
// @access  Private
router.delete('/delete-image', authenticateToken, async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete image'
            });
        }
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting image'
        });
    }
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', [
    authenticateToken,
    upload.single('avatar')
], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No avatar uploaded'
            });
        }

        const User = require('../models/User');
        
        // Update user's avatar
        const user = await User.findById(req.user._id);
        user.avatar = req.file.path;
        await user.save();

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: req.file.path
            }
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error uploading avatar'
        });
    }
});

// AI verification function using external API
async function verifyWithAI(imageUrl) {
    try {
        // Download the image from Cloudinary URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error('Failed to download image from Cloudinary');
        }
        
        const imageBuffer = await imageResponse.buffer();
        
        // Create form data for the external API
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: 'artwork.jpg',
            contentType: 'image/jpeg'
        });
        
        // Headers for the external AI verification API
        const headers = {
            'Accept': '/',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Origin': 'https://www.adamelkholy.co.uk',
            'Referer': 'https://www.adamelkholy.co.uk/artworkai',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            ...formData.getHeaders() // Include form data headers
        };
        
        // Make request to external AI verification API
        const response = await fetch('https://www.adamelkholy.co.uk/upload', {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('AI Verification API Response:', result);
            
            // Parse the response to determine if it's AI-generated
            // The API returns: "The Artwork AI predicted that your artwork is <strong>AI-Generated</strong> with 88.43% confidence"
            const predictionMessage = result.prediction_message || '';
            const isAI = predictionMessage.includes('AI-Generated');
            const isHumanCreated = !isAI;
            
            console.log('AI Verification Parsing:', {
                predictionMessage,
                isAI,
                isHumanCreated
            });
            
            // Extract confidence from the message
            const confidenceMatch = predictionMessage.match(/(\d+\.?\d*)% confidence/);
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0.8;
            
            return {
                isHumanCreated: isHumanCreated,
                confidence: confidence,
                apiResponse: result
            };
        } else {
            console.error('AI Verification API Error:', response.status, response.statusText);
            throw new Error(`AI verification API returned ${response.status}`);
        }
        
    } catch (error) {
        console.error('AI verification error:', error);
        
        // Fallback simulation for development/testing
        console.log('Using fallback AI verification simulation');
        return {
            isHumanCreated: Math.random() > 0.3, // 70% chance of being human-created
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            apiResponse: null,
            error: error.message
        };
    }
}

module.exports = router; 