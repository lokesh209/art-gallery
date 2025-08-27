const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chats
// @desc    Get user's chats
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const chats = await Chat.find({
            $or: [
                { seller: req.user._id },
                { buyer: req.user._id }
            ]
        })
        .sort({ lastMessageAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('artwork', 'title images')
        .populate('seller', 'firstName lastName')
        .populate('buyer', 'firstName lastName')
        .populate('messages.sender', 'firstName lastName');

        const total = await Chat.countDocuments({
            $or: [
                { seller: req.user._id },
                { buyer: req.user._id }
            ]
        });

        res.json({
            success: true,
            data: {
                chats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting chats'
        });
    }
});

// @route   GET /api/chats/:chatId
// @desc    Get specific chat with messages
// @access  Private
router.get('/:chatId', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('artwork', 'title images soldPrice')
            .populate('seller', 'firstName lastName email')
            .populate('buyer', 'firstName lastName email')
            .populate('messages.sender', 'firstName lastName');

        // Filter out deleted messages
        if (chat) {
            chat.messages = chat.messages.filter(msg => !msg.isDeleted);
        }

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is part of this chat
        if (chat.seller._id.toString() !== req.user._id.toString() && 
            chat.buyer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this chat'
            });
        }

        // Mark messages as read
        await chat.markAsRead(req.user._id);

        res.json({
            success: true,
            data: { chat }
        });
    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting chat'
        });
    }
});

// @route   POST /api/chats/:chatId/messages
// @desc    Send a message in a chat
// @access  Private
router.post('/:chatId/messages', [
    authenticateToken,
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters')
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

        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if chat is archived
        if (chat.isArchived) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send messages in archived chat'
            });
        }

        // Check if user is part of this chat
        if (chat.seller.toString() !== req.user._id.toString() && 
            chat.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send messages in this chat'
            });
        }

        // Add message to chat with security checks
        await chat.addMessage(req.user._id, req.body.content, req.body.messageType || 'text');

        // Populate the new message for response
        const updatedChat = await Chat.findById(req.params.chatId)
            .populate('messages.sender', 'firstName lastName');

        const newMessage = updatedChat.messages[updatedChat.messages.length - 1];

        // Verify message integrity (optional check)
        try {
            if (!chat.verifyMessageIntegrity(newMessage._id)) {
                console.warn('Message integrity check failed for message:', newMessage._id);
                // Don't fail the request, just log the warning
            }
        } catch (error) {
            console.warn('Message integrity verification error:', error.message);
            // Continue with the response even if verification fails
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: { message: newMessage }
        });
    } catch (error) {
        console.error('Send message error:', error);
        
        // Handle specific error types
        if (error.message.includes('Rate limit exceeded')) {
            return res.status(429).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error sending message'
        });
    }
});

// @route   POST /api/chats/create
// @desc    Create a new chat for an artwork
// @access  Private
router.post('/create', [
    authenticateToken,
    body('artworkId').isMongoId().withMessage('Valid artwork ID is required'),
    body('sellerId').isMongoId().withMessage('Valid seller ID is required'),
    body('buyerId').isMongoId().withMessage('Valid buyer ID is required')
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

        // Check if user is either the seller or buyer
        if (req.user._id.toString() !== req.body.sellerId && 
            req.user._id.toString() !== req.body.buyerId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create this chat'
            });
        }

        // Find or create chat
        const chat = await Chat.findOrCreateChat(
            req.body.artworkId,
            req.body.sellerId,
            req.body.buyerId
        );

        // Populate chat data
        await chat.populate('artwork', 'title images soldPrice');
        await chat.populate('seller', 'firstName lastName');
        await chat.populate('buyer', 'firstName lastName');

        res.json({
            success: true,
            message: 'Chat created successfully',
            data: { chat }
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating chat'
        });
    }
});

// @route   PUT /api/chats/:chatId/read
// @desc    Mark chat messages as read
// @access  Private
router.put('/:chatId/read', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is part of this chat
        if (chat.seller.toString() !== req.user._id.toString() && 
            chat.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this chat'
            });
        }

        await chat.markAsRead(req.user._id);

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark messages read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking messages as read'
        });
    }
});

// @route   DELETE /api/chats/:chatId/messages/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/:chatId/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is part of this chat
        if (chat.seller.toString() !== req.user._id.toString() && 
            chat.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this chat'
            });
        }

        await chat.deleteMessage(req.params.messageId, req.user._id);

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error deleting message'
        });
    }
});

// @route   PUT /api/chats/:chatId/archive
// @desc    Archive a chat
// @access  Private
router.put('/:chatId/archive', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is part of this chat
        if (chat.seller.toString() !== req.user._id.toString() && 
            chat.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to archive this chat'
            });
        }

        await chat.archiveChat(req.user._id);

        res.json({
            success: true,
            message: 'Chat archived successfully'
        });
    } catch (error) {
        console.error('Archive chat error:', error);
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error archiving chat'
        });
    }
});

module.exports = router;
