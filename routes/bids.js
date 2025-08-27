const express = require('express');
const { body, validationResult } = require('express-validator');
const Bid = require('../models/Bid');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { authenticateToken, requireBuyer } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bids
// @desc    Place a bid on artwork
// @access  Private (buyer only)
router.post('/', [
    authenticateToken,
    requireBuyer,
    body('artworkId').isMongoId().withMessage('Valid artwork ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Bid amount must be a positive number')
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

        const { artworkId, amount } = req.body;

        // Find artwork
        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Check if artwork is available for bidding
        if (!artwork.isApproved) {
            return res.status(400).json({
                success: false,
                message: 'Artwork is not approved for bidding'
            });
        }

        if (artwork.status === 'sold') {
            return res.status(400).json({
                success: false,
                message: 'Artwork has already been sold'
            });
        }

        // Check if user is bidding on their own artwork
        if (artwork.artist.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot bid on your own artwork'
            });
        }

        // Validate bid amount
        if (amount < artwork.minBid) {
            return res.status(400).json({
                success: false,
                message: `Bid must be at least $${artwork.minBid}`
            });
        }

        if (amount <= artwork.currentBid) {
            return res.status(400).json({
                success: false,
                message: `Bid must be higher than current bid of $${artwork.currentBid}`
            });
        }

        // Create bid
        const bid = await Bid.create({
            artwork: artworkId,
            bidder: req.user._id,
            amount,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Update artwork with new bid
        const previousHighestBidder = artwork.highestBidder;
        artwork.currentBid = amount;
        artwork.highestBidder = req.user._id;
        artwork.bidCount += 1;

        // Start auction if this is the first bid
        if (!artwork.auctionStartTime) {
            await artwork.startAuction();
        } else {
            // Extend auction for 12 hours
            await artwork.extendAuction();
        }

        await artwork.save();

        // Mark previous bids as outbid
        if (previousHighestBidder && previousHighestBidder.toString() !== req.user._id.toString()) {
            await Bid.updateMany(
                { 
                    artwork: artworkId, 
                    bidder: previousHighestBidder,
                    status: 'active'
                },
                { status: 'outbid' }
            );
        }

        // Mark this bid as winning
        bid.isWinning = true;
        await bid.save();

        // Populate bid with user info
        await bid.populate('bidder', 'firstName lastName email');
        await bid.populate('artwork', 'title images currentBid status');

        // Emit real-time update via Socket.IO
        const io = req.app.get('io');
        io.to(`artwork-${artworkId}`).emit('bid-placed', {
            artworkId,
            newBid: {
                id: bid._id,
                amount: bid.amount,
                bidder: {
                    id: bid.bidder._id,
                    name: `${bid.bidder.firstName} ${bid.bidder.lastName}`
                },
                placedAt: bid.placedAt
            },
            artwork: {
                currentBid: artwork.currentBid,
                bidCount: artwork.bidCount,
                auctionEndTime: artwork.auctionEndTime
            }
        });

        res.status(201).json({
            success: true,
            message: 'Bid placed successfully',
            data: {
                bid,
                artwork: {
                    currentBid: artwork.currentBid,
                    bidCount: artwork.bidCount,
                    auctionEndTime: artwork.auctionEndTime
                }
            }
        });
    } catch (error) {
        console.error('Place bid error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error placing bid'
        });
    }
});

// @route   GET /api/bids/artwork/:artworkId
// @desc    Get bid history for an artwork
// @access  Public
router.get('/artwork/:artworkId', async (req, res) => {
    try {
        const { artworkId } = req.params;
        const { limit = 10 } = req.query;

        // Check if artwork exists
        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            return res.status(404).json({
                success: false,
                message: 'Artwork not found'
            });
        }

        // Get bid history
        const bids = await Bid.getBidHistory(artworkId, parseInt(limit));

        res.json({
            success: true,
            data: {
                bids,
                artwork: {
                    currentBid: artwork.currentBid,
                    bidCount: artwork.bidCount,
                    auctionEndTime: artwork.auctionEndTime
                }
            }
        });
    } catch (error) {
        console.error('Get bid history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bid history'
        });
    }
});

// @route   GET /api/bids/my-bids
// @desc    Get current user's bid history
// @access  Private
router.get('/my-bids', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get user's bid history
        const bids = await Bid.find({ bidder: req.user._id })
            .sort({ placedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('artwork', 'title images currentBid status artist')
            .populate('artwork.artist', 'firstName lastName artistName');

        // Get total count
        const total = await Bid.countDocuments({ bidder: req.user._id });

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
            message: 'Server error fetching bid history'
        });
    }
});

// @route   GET /api/bids/winning
// @desc    Get current user's winning bids
// @access  Private
router.get('/winning', authenticateToken, async (req, res) => {
    try {
        const winningBids = await Bid.find({
            bidder: req.user._id,
            isWinning: true,
            status: 'active'
        })
        .populate('artwork', 'title images currentBid status auctionEndTime')
        .populate('artwork.artist', 'firstName lastName artistName');

        res.json({
            success: true,
            data: {
                winningBids
            }
        });
    } catch (error) {
        console.error('Get winning bids error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching winning bids'
        });
    }
});

// @route   DELETE /api/bids/:bidId
// @desc    Cancel a bid (if auction hasn't started)
// @access  Private
router.delete('/:bidId', authenticateToken, async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);

        if (!bid) {
            return res.status(404).json({
                success: false,
                message: 'Bid not found'
            });
        }

        // Check ownership
        if (bid.bidder.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this bid'
            });
        }

        // Check if auction has started
        const artwork = await Artwork.findById(bid.artwork);
        if (artwork.auctionStartTime) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel bid after auction has started'
            });
        }

        // Delete bid
        await Bid.findByIdAndDelete(req.params.bidId);

        res.json({
            success: true,
            message: 'Bid cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel bid error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling bid'
        });
    }
});

// @route   GET /api/bids/artwork/:artworkId/highest
// @desc    Get highest bid for an artwork
// @access  Public
router.get('/artwork/:artworkId/highest', async (req, res) => {
    try {
        const { artworkId } = req.params;

        const highestBid = await Bid.getHighestBid(artworkId);

        res.json({
            success: true,
            data: {
                highestBid
            }
        });
    } catch (error) {
        console.error('Get highest bid error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching highest bid'
        });
    }
});

module.exports = router; 