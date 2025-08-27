const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Artwork title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Artist is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        enum: ['painting', 'drawing', 'photography', 'digital', 'sculpture', 'mixed-media', 'other'],
        required: [true, 'Category is required']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    originalPrice: {
        type: Number,
        required: [true, 'Original price is required'],
        min: [0, 'Price cannot be negative']
    },
    currentBid: {
        type: Number,
        default: 0
    },
    minBid: {
        type: Number,
        required: true
    },
    highestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    bidCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'ending', 'sold', 'expired', 'rejected'],
        default: 'pending'
    },
    // AI verification
    isAIVerified: {
        type: Boolean,
        default: false
    },
    aiVerificationResult: {
        isHumanCreated: Boolean,
        confidence: Number,
        verifiedAt: Date
    },
    // Auction timing
    auctionStartTime: {
        type: Date,
        default: null
    },
    auctionEndTime: {
        type: Date,
        default: null
    },
    // Dimensions and details
    dimensions: {
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'inches'],
            default: 'cm'
        }
    },
    medium: {
        type: String,
        maxlength: [100, 'Medium cannot exceed 100 characters']
    },
    yearCreated: {
        type: Number,
        min: [1900, 'Year must be 1900 or later'],
        max: [new Date().getFullYear(), 'Year cannot be in the future']
    },
    // Sold artwork information
    soldPrice: {
        type: Number,
        min: [0, 'Sold price cannot be negative']
    },
    soldAt: {
        type: Date
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Tags for search
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    // Location
    location: {
        city: String,
        country: String
    },
    // Shipping information
    shippingInfo: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        shippingCost: Number,
        estimatedDelivery: Number // in days
    },
    // View statistics
    views: {
        type: Number,
        default: 0
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Approval status
    isApproved: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    // Rejection reason if not approved
    rejectionReason: {
        type: String,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Indexes for better query performance
artworkSchema.index({ artist: 1 });
artworkSchema.index({ status: 1 });
artworkSchema.index({ category: 1 });
artworkSchema.index({ 'auctionEndTime': 1 });
artworkSchema.index({ isApproved: 1 });
artworkSchema.index({ tags: 1 });
artworkSchema.index({ title: 'text', description: 'text' });

// Calculate minimum bid (10% less than original price)
artworkSchema.pre('save', function(next) {
    if (this.isModified('originalPrice')) {
        this.minBid = Math.floor(this.originalPrice * 0.9); // 10% less
    }
    next();
});

// Virtual for time left in auction
artworkSchema.virtual('timeLeft').get(function() {
    if (!this.auctionEndTime) return null;
    
    const now = new Date();
    const timeLeft = this.auctionEndTime.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 0;
    return timeLeft;
});

// Virtual for auction status
artworkSchema.virtual('auctionStatus').get(function() {
    if (!this.auctionEndTime) return 'not_started';
    
    const timeLeft = this.timeLeft;
    if (timeLeft <= 0) return 'ended';
    if (timeLeft <= 3600000) return 'ending_soon'; // 1 hour
    return 'active';
});

// Method to start auction
artworkSchema.methods.startAuction = function() {
    this.auctionStartTime = new Date();
    this.auctionEndTime = new Date(Date.now() + (12 * 60 * 60 * 1000)); // 12 hours
    this.status = 'active';
    return this.save();
};

// Method to extend auction
artworkSchema.methods.extendAuction = function() {
    this.auctionEndTime = new Date(Date.now() + (12 * 60 * 60 * 1000)); // 12 hours
    return this.save();
};

// Method to end auction
artworkSchema.methods.endAuction = function() {
    this.status = 'sold';
    this.auctionEndTime = new Date();
    return this.save();
};

// Method to place bid
artworkSchema.methods.placeBid = function(bidderId, bidAmount) {
    if (bidAmount < this.minBid) {
        throw new Error(`Bid must be at least $${this.minBid}`);
    }
    
    if (bidAmount <= this.currentBid) {
        throw new Error(`Bid must be higher than current bid of $${this.currentBid}`);
    }
    
    this.currentBid = bidAmount;
    this.highestBidder = bidderId;
    this.bidCount += 1;
    
    // Start auction if this is the first bid
    if (!this.auctionStartTime) {
        this.startAuction();
    } else {
        // Extend auction for 12 hours
        this.extendAuction();
    }
    
    return this.save();
};

// Ensure virtual fields are serialized
artworkSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Artwork', artworkSchema); 