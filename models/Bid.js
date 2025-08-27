const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: [true, 'Artwork is required']
    },
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Bidder is required']
    },
    amount: {
        type: Number,
        required: [true, 'Bid amount is required'],
        min: [0, 'Bid amount cannot be negative']
    },
    isWinning: {
        type: Boolean,
        default: false
    },
    isOutbid: {
        type: Boolean,
        default: false
    },
    // Bid status
    status: {
        type: String,
        enum: ['active', 'outbid', 'won', 'lost'],
        default: 'active'
    },
    // Timestamp when bid was placed
    placedAt: {
        type: Date,
        default: Date.now
    },
    // IP address for security
    ipAddress: {
        type: String
    },
    // User agent for tracking
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
bidSchema.index({ artwork: 1, amount: -1 });
bidSchema.index({ bidder: 1 });
bidSchema.index({ placedAt: -1 });
bidSchema.index({ status: 1 });

// Virtual for time since bid was placed
bidSchema.virtual('timeSincePlaced').get(function() {
    const now = new Date();
    const timeDiff = now.getTime() - this.placedAt.getTime();
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
});

// Method to mark bid as outbid
bidSchema.methods.markAsOutbid = function() {
    this.isOutbid = true;
    this.status = 'outbid';
    return this.save();
};

// Method to mark bid as winning
bidSchema.methods.markAsWinning = function() {
    this.isWinning = true;
    this.status = 'active';
    return this.save();
};

// Method to mark bid as won
bidSchema.methods.markAsWon = function() {
    this.status = 'won';
    return this.save();
};

// Method to mark bid as lost
bidSchema.methods.markAsLost = function() {
    this.status = 'lost';
    return this.save();
};

// Static method to get highest bid for an artwork
bidSchema.statics.getHighestBid = function(artworkId) {
    return this.findOne({ artwork: artworkId })
        .sort({ amount: -1 })
        .populate('bidder', 'firstName lastName email');
};

// Static method to get bid history for an artwork
bidSchema.statics.getBidHistory = function(artworkId, limit = 10) {
    return this.find({ artwork: artworkId })
        .sort({ amount: -1 })
        .limit(limit)
        .populate('bidder', 'firstName lastName email')
        .select('-ipAddress -userAgent');
};

// Static method to get user's bid history
bidSchema.statics.getUserBidHistory = function(userId) {
    return this.find({ bidder: userId })
        .sort({ placedAt: -1 })
        .populate('artwork', 'title images currentBid status')
        .select('-ipAddress -userAgent');
};

// Ensure virtual fields are serialized
bidSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.ipAddress;
        delete ret.userAgent;
        return ret;
    }
});

module.exports = mongoose.model('Bid', bidSchema); 