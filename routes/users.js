const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Bid = require('../models/Bid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password');

        res.json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    authenticateToken,
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('artistName').optional().trim().isLength({ max: 100 }).withMessage('Artist name cannot exceed 100 characters'),
    body('artistBio').optional().trim().isLength({ max: 500 }).withMessage('Artist bio cannot exceed 500 characters'),
    body('phoneNumber').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
    body('shippingAddress.street').optional().trim(),
    body('shippingAddress.city').optional().trim(),
    body('shippingAddress.state').optional().trim(),
    body('shippingAddress.zipCode').optional().trim(),
    body('shippingAddress.country').optional().trim()
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

        const user = await User.findByIdAndUpdate(
            req.user._id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
});

// @route   GET /api/users/statistics
// @desc    Get user statistics
// @access  Private
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user's artworks (if seller)
        const artworks = req.user.userType === 'seller' 
            ? await Artwork.find({ artist: userId })
            : [];

        // Get user's bids (if buyer)
        const bids = req.user.userType === 'buyer'
            ? await Bid.find({ bidder: userId })
            : [];

        // Get winning bids
        const winningBids = req.user.userType === 'buyer'
            ? await Bid.find({ bidder: userId, isWinning: true, status: 'active' })
            : [];

        // Calculate statistics
        const statistics = {
            totalArtworks: artworks.length,
            activeArtworks: artworks.filter(a => a.status === 'active').length,
            soldArtworks: artworks.filter(a => a.status === 'sold').length,
            totalBids: bids.length,
            winningBids: winningBids.length,
            totalSpent: bids.reduce((sum, bid) => sum + bid.amount, 0),
            totalEarned: artworks
                .filter(a => a.status === 'sold')
                .reduce((sum, artwork) => sum + artwork.currentBid, 0)
        };

        res.json({
            success: true,
            data: {
                statistics
            }
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics'
        });
    }
});

// @route   GET /api/users/my-artworks
// @desc    Get current user's artworks (seller only)
// @access  Private
router.get('/my-artworks', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'seller') {
            return res.status(403).json({
                success: false,
                message: 'Only sellers can access this endpoint'
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const filter = { artist: req.user._id };
        if (status) filter.status = status;

        // Get artworks
        const artworks = await Artwork.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('highestBidder', 'firstName lastName');

        // Get total count
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
        console.error('Get my artworks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching artworks'
        });
    }
});

// @route   GET /api/users/my-bids
// @desc    Get current user's bids (buyer only)
// @access  Private
router.get('/my-bids', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'buyer') {
            return res.status(403).json({
                success: false,
                message: 'Only buyers can access this endpoint'
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const filter = { bidder: req.user._id };
        if (status) filter.status = status;

        // Get bids
        const bids = await Bid.find(filter)
            .sort({ placedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('artwork', 'title images currentBid status')
            .populate('artwork.artist', 'firstName lastName artistName');

        // Get total count
        const total = await Bid.countDocuments(filter);

        res.json({
            success: true,
            data: {
                bids,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get my bids error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bids'
        });
    }
});

// @route   GET /api/users/favorites
// @desc    Get user's favorite artworks
// @access  Private
router.get('/favorites', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get artworks where user is in favorites
        const artworks = await Artwork.find({
            favorites: req.user._id,
            isApproved: true
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('artist', 'firstName lastName artistName')
        .populate('highestBidder', 'firstName lastName');

        // Get total count
        const total = await Artwork.countDocuments({
            favorites: req.user._id,
            isApproved: true
        });

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
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching favorites'
        });
    }
});

// @route   POST /api/users/favorites/:artworkId
// @desc    Add artwork to favorites
// @access  Private
router.post('/favorites/:artworkId', authenticateToken, async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.artworkId);

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Check if already in favorites
        if (artwork.favorites.includes(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'Artwork already in favorites'
            });
        }

        // Add to favorites
        artwork.favorites.push(req.user._id);
        await artwork.save();

        res.json({
            success: true,
            message: 'Artwork added to favorites'
        });
    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding to favorites'
        });
    }
});

// @route   DELETE /api/users/favorites/:artworkId
// @desc    Remove artwork from favorites
// @access  Private
router.delete('/favorites/:artworkId', authenticateToken, async (req, res) => {
    try {
        const artwork = await Artwork.findById(req.params.artworkId);

        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Remove from favorites
        artwork.favorites = artwork.favorites.filter(
            id => id.toString() !== req.user._id.toString()
        );
        await artwork.save();

        res.json({
            success: true,
            message: 'Artwork removed from favorites'
        });
    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing from favorites'
        });
    }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        // Check if user has active artworks or bids
        const activeArtworks = await Artwork.countDocuments({
            artist: req.user._id,
            status: { $in: ['active', 'pending'] }
        });

        const activeBids = await Bid.countDocuments({
            bidder: req.user._id,
            status: 'active'
        });

        if (activeArtworks > 0 || activeBids > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete account with active artworks or bids'
            });
        }

        // Delete user
        await User.findByIdAndDelete(req.user._id);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting account'
        });
    }
});

module.exports = router; 