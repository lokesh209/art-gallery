const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    // AI verification result at time of sale
    aiVerificationResult: {
        isHumanCreated: Boolean,
        confidence: Number,
        verifiedAt: Date
    },
    // Payment information (for future payment integration)
    paymentMethod: {
        type: String,
        enum: ['stripe', 'paypal', 'manual'],
        default: 'manual'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    // Shipping information
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    shippingStatus: {
        type: String,
        enum: ['pending', 'shipped', 'delivered'],
        default: 'pending'
    },
    trackingNumber: String,
    // Dispute resolution
    disputeStatus: {
        type: String,
        enum: ['none', 'opened', 'resolved'],
        default: 'none'
    },
    disputeReason: String,
    // Timestamps
    completedAt: Date,
    shippedAt: Date,
    deliveredAt: Date
}, {
    timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ seller: 1 });
transactionSchema.index({ buyer: 1 });
transactionSchema.index({ artwork: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function() {
    return {
        id: this._id,
        artworkTitle: this.artwork?.title || 'Unknown Artwork',
        sellerName: this.seller?.firstName + ' ' + this.seller?.lastName || 'Unknown Seller',
        buyerName: this.buyer?.firstName + ' ' + this.buyer?.lastName || 'Unknown Buyer',
        amount: this.amount,
        status: this.status,
        aiVerified: this.aiVerificationResult?.isHumanCreated || false
    };
});

module.exports = mongoose.model('Transaction', transactionSchema);
