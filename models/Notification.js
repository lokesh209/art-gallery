const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'bid_accepted',
            'artwork_sold',
            'new_bid',
            'bid_outbid',
            'artwork_approved',
            'artwork_rejected',
            'payment_received',
            'shipping_update',
            'delivery_confirmed'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: true,
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    // Related data
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork'
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        min: [0, 'Amount cannot be negative']
    },
    // AI verification data
    aiVerification: {
        isHumanCreated: Boolean,
        confidence: Number,
        verifiedAt: Date
    },
    // Status
    isRead: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    // Priority levels
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // Action buttons (for future UI enhancements)
    actions: [{
        label: String,
        action: String,
        url: String
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });

// Virtual for notification summary
notificationSchema.virtual('summary').get(function() {
    return {
        id: this._id,
        type: this.type,
        title: this.title,
        message: this.message,
        isRead: this.isRead,
        createdAt: this.createdAt,
        priority: this.priority
    };
});

// Static method to create bid accepted notification
notificationSchema.statics.createBidAcceptedNotification = function(buyerId, artwork, seller, amount, aiVerification) {
    return this.create({
        user: buyerId,
        type: 'bid_accepted',
        title: '🎉 Your Bid Was Accepted!',
        message: `Congratulations! Your bid of $${amount} for "${artwork.title}" has been accepted by ${seller.firstName} ${seller.lastName}.`,
        artwork: artwork._id,
        seller: seller._id,
        amount: amount,
        aiVerification: aiVerification,
        priority: 'high',
        actions: [
            {
                label: 'View Artwork',
                action: 'view_artwork',
                url: `/artwork/${artwork._id}`
            },
            {
                label: 'Contact Seller',
                action: 'contact_seller',
                url: `/messages/${seller._id}`
            }
        ]
    });
};

// Static method to create artwork sold notification
notificationSchema.statics.createArtworkSoldNotification = function(sellerId, artwork, buyer, amount) {
    return this.create({
        user: sellerId,
        type: 'artwork_sold',
        title: '💰 Artwork Sold Successfully!',
        message: `Your artwork "${artwork.title}" has been sold to ${buyer.firstName} ${buyer.lastName} for $${amount}.`,
        artwork: artwork._id,
        buyer: buyer._id,
        amount: amount,
        priority: 'high',
        actions: [
            {
                label: 'View Transaction',
                action: 'view_transaction',
                url: `/transactions/${artwork._id}`
            },
            {
                label: 'Contact Buyer',
                action: 'contact_buyer',
                url: `/messages/${buyer._id}`
            }
        ]
    });
};

module.exports = mongoose.model('Notification', notificationSchema);
