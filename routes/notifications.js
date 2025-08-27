const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        
        const query = { user: req.user._id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('artwork', 'title images')
            .populate('seller', 'firstName lastName')
            .populate('buyer', 'firstName lastName');

        const total = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting notifications'
        });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting unread count'
        });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: { notification }
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking notification as read'
        });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all user notifications as read
// @access  Private
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: `Marked ${result.modifiedCount} notifications as read`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking notifications as read'
        });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting notification'
        });
    }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all user notifications
// @access  Private
router.delete('/clear-all', authenticateToken, async (req, res) => {
    try {
        const result = await Notification.deleteMany({
            user: req.user._id
        });

        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} notifications`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        console.error('Clear all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error clearing notifications'
        });
    }
});

module.exports = router;
