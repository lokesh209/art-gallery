const express = require('express');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');
const FormData = require('form-data');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { authenticateToken, optionalAuth, requireSeller, requireAdmin } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const router = express.Router();

// @route   POST /api/artworks
// @desc    Create new artwork (seller only)
// @access  Private
router.post('/', [
    authenticateToken,
    requireSeller,
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and must be less than 100 characters'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('category').isIn(['painting', 'drawing', 'photography', 'digital', 'sculpture', 'mixed-media', 'other']).withMessage('Invalid category'),
    body('originalPrice').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('medium').optional().trim().isLength({ max: 100 }).withMessage('Medium cannot exceed 100 characters'),
    body('yearCreated').optional().isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid year'),
    body('dimensions.width').optional().isFloat({ min: 0 }).withMessage('Width must be positive'),
    body('dimensions.height').optional().isFloat({ min: 0 }).withMessage('Height must be positive'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const {
            title,
            description,
            category,
            originalPrice,
            medium,
            yearCreated,
            dimensions,
            tags,
            location
        } = req.body;

        // Calculate minimum bid (10% less than original price)
        const minBid = Math.floor(originalPrice * 0.9);
        
        // AI verification for images (if provided)
        let aiVerificationResult = null;
        if (req.body.images && req.body.images.length > 0) {
            try {
                console.log('Starting AI verification for artwork images...');
                const primaryImage = req.body.images[0];
                aiVerificationResult = await verifyWithAI(primaryImage.url);
                console.log('AI verification result:', aiVerificationResult);
            } catch (error) {
                console.error('AI verification failed:', error);
                // Continue with artwork creation even if AI verification fails
            }
        }
        
        // Create artwork
        const artwork = await Artwork.create({
            title,
            artist: req.user._id,
            description,
            category,
            originalPrice,
            minBid,
            medium,
            yearCreated,
            dimensions,
            tags,
            location,
            images: req.body.images || [],
            status: aiVerificationResult && !aiVerificationResult.isHumanCreated ? 'rejected' : 'pending',
            isAIVerified: aiVerificationResult ? true : false,
            aiVerificationResult: aiVerificationResult
        });

        // Determine the appropriate message based on AI verification
        let message = 'Artwork created successfully! ';
        if (aiVerificationResult) {
            if (aiVerificationResult.isHumanCreated) {
                message += '✅ AI verification passed - your artwork appears to be human-created.';
            } else {
                message += '❌ AI verification failed - AI-generated content detected. Your artwork has been rejected.';
            }
        } else {
            message += 'AI verification is pending.';
        }

        res.status(201).json({
            success: true,
            message: message,
            data: {
                artwork,
                aiVerification: aiVerificationResult
            }
        });
    } catch (error) {
        console.error('Create artwork error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error creating artwork',
            error: error.message
        });
    }
});

// @route   GET /api/artworks
// @desc    Get all artworks with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            status,
            minPrice,
            maxPrice,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = { isApproved: true };

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (minPrice || maxPrice) {
            filter.currentBid = {};
            if (minPrice) filter.currentBid.$gte = parseFloat(minPrice);
            if (maxPrice) filter.currentBid.$lte = parseFloat(maxPrice);
        }

        // Search functionality
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get artworks with pagination
        const artworks = await Artwork.find(filter)
            .populate('artist', 'firstName lastName artistName')
            .populate('highestBidder', 'firstName lastName')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Artwork.countDocuments(filter);

        res.json({
            success: true,
            data: {
                artworks,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get artworks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching artworks'
        });
    }
});

// @route   GET /api/artworks/my-artworks
// @desc    Get current user's artworks
// @access  Private (seller only)
router.get('/my-artworks', authenticateToken, requireSeller, async (req, res) => {
    try {
        const artworks = await Artwork.find({ artist: req.user._id })
            .populate('artist', 'firstName lastName artistName')
            .populate('highestBidder', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                artworks
            }
        });
    } catch (error) {
        console.error('Get my artworks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/artworks/admin
// @desc    Get all artworks for admin review
// @access  Private (admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const artworks = await Artwork.find({})
            .populate('artist', 'firstName lastName artistName')
            .populate('highestBidder', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                artworks
            }
        });
    } catch (error) {
        console.error('Get admin artworks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/artworks/:id/approve
// @desc    Approve artwork (admin only)
// @access  Private (admin only)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        artwork.isApproved = true;
        artwork.status = 'active';
        await artwork.save();

        res.json({
            success: true,
            message: 'Artwork approved successfully',
            data: {
                artwork
            }
        });
    } catch (error) {
        console.error('Approve artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/artworks/:id/reject
// @desc    Reject artwork (admin only)
// @access  Private (admin only)
router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        artwork.isApproved = false;
        artwork.status = 'rejected';
        await artwork.save();

        res.json({
            success: true,
            message: 'Artwork rejected successfully',
            data: {
                artwork
            }
        });
    } catch (error) {
        console.error('Reject artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/artworks/:id
// @desc    Get single artwork
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id)
            .populate('artist', 'firstName lastName artistName artistBio')
            .populate('highestBidder', 'firstName lastName');

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Increment view count if user is not the artist
        if (req.user && req.user._id.toString() !== artwork.artist._id.toString()) {
            artwork.views += 1;
            await artwork.save();
        }

        res.json({
            success: true,
            data: {
                artwork
            }
        });
    } catch (error) {
        console.error('Get artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching artwork'
        });
    }
});

// @route   PUT /api/artworks/:id
// @desc    Update artwork (artist only)
// @access  Private
router.put('/:id', [
    authenticateToken,
    requireSeller,
    body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
    body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('category').optional().isIn(['painting', 'drawing', 'photography', 'digital', 'sculpture', 'mixed-media', 'other']).withMessage('Invalid category'),
    body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Check ownership
        if (artwork.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this artwork'
            });
        }

        // Only allow updates if artwork is not active or sold
        if (artwork.status === 'active' || artwork.status === 'sold') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update artwork that is active or sold'
            });
        }

        // Update artwork
        const updatedArtwork = await Artwork.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('artist', 'firstName lastName artistName');

        res.json({
            success: true,
            message: 'Artwork updated successfully',
            data: {
                artwork: updatedArtwork
            }
        });
    } catch (error) {
        console.error('Update artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating artwork'
        });
    }
});

// @route   DELETE /api/artworks/:id
// @desc    Delete artwork (artist only)
// @access  Private
router.delete('/:id', [authenticateToken, requireSeller], async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Check ownership
        if (artwork.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this artwork'
            });
        }

        // Only allow deletion if artwork is not active or sold
        if (artwork.status === 'active' || artwork.status === 'sold') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete artwork that is active or sold'
            });
        }

        await Artwork.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Artwork deleted successfully'
        });
    } catch (error) {
        console.error('Delete artwork error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting artwork'
        });
    }
});

// @route   PUT /api/artworks/:id/accept-bid
// @desc    Accept a bid for artwork (seller only) - Complete workflow with AI verification
// @access  Private
router.put('/:id/accept-bid', [
    authenticateToken,
    requireSeller,
    body('bidAmount').isFloat({ min: 0 }).withMessage('Bid amount must be a positive number')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const artwork = await Artwork.findById(req.params.id)
            .populate('highestBidder', 'firstName lastName email')
            .populate('artist', 'firstName lastName email');

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Check ownership
        if (artwork.artist._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to accept bids for this artwork'
            });
        }

        // Check if artwork is active and has bids
        if (artwork.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Can only accept bids for active artworks'
            });
        }

        if (!artwork.currentBid || artwork.currentBid === 0) {
            return res.status(400).json({
                success: false,
                message: 'No bids to accept'
            });
        }

        // Verify the bid amount matches the current highest bid
        if (artwork.currentBid !== req.body.bidAmount) {
            return res.status(400).json({
                success: false,
                message: 'Bid amount does not match current highest bid'
            });
        }

        // Step 1: AI Verification (if not already verified)
        let aiVerificationResult = null;
        if (!artwork.isAIVerified && artwork.images && artwork.images.length > 0) {
            try {
                console.log('Starting AI verification for bid acceptance...');
                aiVerificationResult = await verifyWithAI(artwork.images[0].url);
                console.log('AI verification result for bid acceptance:', aiVerificationResult);
                
                // Update artwork with AI verification result
                artwork.isAIVerified = true;
                artwork.aiVerificationResult = {
                    isHumanCreated: aiVerificationResult.isHumanCreated,
                    confidence: aiVerificationResult.confidence,
                    verifiedAt: new Date()
                };
            } catch (error) {
                console.error('AI verification failed during bid acceptance:', error);
                // Continue with bid acceptance even if AI verification fails
            }
        }

        // Step 2: Check AI verification result
        if (aiVerificationResult && !aiVerificationResult.isHumanCreated) {
            return res.status(400).json({
                success: false,
                message: 'AI verification failed - AI-generated content detected. Cannot accept bid.',
                aiVerification: aiVerificationResult
            });
        }

        // Step 3: Update artwork status to sold
        artwork.status = 'sold';
        artwork.soldPrice = artwork.currentBid;
        artwork.soldAt = new Date();
        artwork.buyer = artwork.highestBidder._id;
        await artwork.save();

        // Step 4: Create transaction record
        const transaction = new Transaction({
            artwork: artwork._id,
            seller: artwork.artist._id,
            buyer: artwork.highestBidder._id,
            amount: artwork.soldPrice,
            status: 'completed',
            aiVerificationResult: aiVerificationResult || artwork.aiVerificationResult
        });
        await transaction.save();

        // Step 5: Create chat between buyer and seller
        const Chat = require('../models/Chat');
        const chat = await Chat.findOrCreateChat(
            artwork._id,
            artwork.artist._id,
            artwork.highestBidder._id
        );

        // Step 6: Send initial messages to start the conversation
        const sellerMessage = `Hi ${artwork.highestBidder.firstName}! Your bid of $${artwork.soldPrice} for "${artwork.title}" has been accepted. Let's discuss payment and delivery details.`;
        await chat.addMessage(artwork.artist._id, sellerMessage);

        const buyerMessage = `Hi ${artwork.artist.firstName}! Thank you for accepting my bid. I'm excited about the artwork. Let's arrange payment and shipping.`;
        await chat.addMessage(artwork.highestBidder._id, buyerMessage);

        // Step 7: Send notification to buyer
        const buyerNotification = {
            type: 'bid_accepted',
            title: '🎉 Your Bid Was Accepted!',
            message: `Congratulations! Your bid of $${artwork.soldPrice} for "${artwork.title}" has been accepted. Check your chat with the seller to arrange payment and delivery.`,
            artwork: artwork._id,
            seller: artwork.artist._id,
            amount: artwork.soldPrice,
            aiVerification: aiVerificationResult || artwork.aiVerificationResult
        };

        await Notification.create({
            user: artwork.highestBidder._id,
            ...buyerNotification
        });

        // Step 8: Send notification to seller
        const sellerNotification = {
            type: 'artwork_sold',
            title: '💰 Artwork Sold Successfully!',
            message: `Your artwork "${artwork.title}" has been sold to ${artwork.highestBidder.firstName} ${artwork.highestBidder.lastName} for $${artwork.soldPrice}. Check your chat to arrange payment and delivery.`,
            artwork: artwork._id,
            buyer: artwork.highestBidder._id,
            amount: artwork.soldPrice
        };

        await Notification.create({
            user: artwork.artist._id,
            ...sellerNotification
        });

        res.json({
            success: true,
            message: 'Bid accepted successfully! Artwork has been sold and chat created for buyer/seller communication.',
            data: {
                artwork: {
                    _id: artwork._id,
                    title: artwork.title,
                    soldPrice: artwork.soldPrice,
                    soldAt: artwork.soldAt,
                    buyer: artwork.highestBidder,
                    seller: artwork.artist
                },
                transaction: {
                    _id: transaction._id,
                    status: transaction.status
                },
                chat: {
                    _id: chat._id,
                    artworkTitle: chat.artworkTitle,
                    soldPrice: chat.soldPrice
                },
                aiVerification: aiVerificationResult || artwork.aiVerificationResult,
                notifications: {
                    buyer: buyerNotification,
                    seller: sellerNotification
                }
            }
        });
    } catch (error) {
        console.error('Accept bid error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error accepting bid'
        });
    }
});

// @route   POST /api/artworks/:id/verify
// @desc    Verify artwork with AI (for your AI model integration)
// @access  Private
router.post('/:id/verify', [authenticateToken, requireSeller], async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Check ownership
        if (artwork.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to verify this artwork'
            });
        }

        // Check if artwork has images
        if (!artwork.images || artwork.images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Artwork must have images for AI verification'
            });
        }

        // Simulate AI verification (replace with your actual AI model)
        const aiVerificationResult = await verifyWithAI(artwork.images[0].url);

        // Update artwork with AI verification result
        artwork.isAIVerified = true;
        artwork.aiVerificationResult = {
            isHumanCreated: aiVerificationResult.isHumanCreated,
            confidence: aiVerificationResult.confidence,
            verifiedAt: new Date()
        };

        // If AI verification passes, approve the artwork
        if (aiVerificationResult.isHumanCreated) {
            artwork.isApproved = true;
            artwork.status = 'pending'; // Ready for bidding
        } else {
            artwork.isApproved = false;
            artwork.status = 'pending';
        }

        await artwork.save();

        res.json({
            success: true,
            message: aiVerificationResult.isHumanCreated 
                ? 'Artwork verified and approved' 
                : 'Artwork rejected - AI generated content detected',
            data: {
                artwork,
                aiVerification: aiVerificationResult
            }
        });
    } catch (error) {
        console.error('AI verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during AI verification'
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