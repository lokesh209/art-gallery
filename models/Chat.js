const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
        trim: true,
        // Sanitize content to prevent XSS
        set: function(content) {
            return content.replace(/[<>]/g, function(match) {
                return match === '<' ? '&lt;' : '&gt;';
            });
        }
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    // Message metadata for security
    messageHash: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const chatSchema = new mongoose.Schema({
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: true,
        index: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Chat metadata
    artworkTitle: {
        type: String,
        trim: true,
        maxlength: [100, 'Artwork title cannot exceed 100 characters']
    },
    soldPrice: {
        type: Number,
        min: [0, 'Sold price cannot be negative']
    },
    // Status tracking
    paymentStatus: {
        type: String,
        enum: ['pending', 'discussed', 'completed'],
        default: 'pending'
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'arranged', 'shipped', 'delivered'],
        default: 'pending'
    },
    // Security and audit fields
    chatHash: {
        type: String,
        required: true,
        unique: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date
    },
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Rate limiting for messages
    messageCount: {
        type: Number,
        default: 0
    },
    lastMessageRateLimit: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better query performance
chatSchema.index({ seller: 1, buyer: 1 });
chatSchema.index({ artwork: 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ 'messages.createdAt': -1 });

// Virtual for unread message count
chatSchema.virtual('unreadCount').get(function() {
    return this.messages.filter(msg => !msg.isRead).length;
});

// Method to add a message with security checks
chatSchema.methods.addMessage = function(senderId, content, messageType = 'text') {
    // Rate limiting check (max 30 messages per minute per user)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentMessages = this.messages.filter(msg => 
        msg.sender.toString() === senderId.toString() && 
        msg.createdAt > oneMinuteAgo
    );
    
    if (recentMessages.length >= 30) {
        throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }

    // Validate sender is part of this chat
    if (this.seller.toString() !== senderId.toString() && 
        this.buyer.toString() !== senderId.toString()) {
        throw new Error('Unauthorized to send message in this chat');
    }

    // Create message hash for integrity
    const crypto = require('crypto');
    const messageHash = crypto.createHash('sha256')
        .update(content + senderId.toString() + now.getTime().toString())
        .digest('hex');

    const message = {
        sender: senderId,
        content: content,
        messageType: messageType,
        isRead: false,
        messageHash: messageHash
    };
    
    this.messages.push(message);
    this.lastMessageAt = now;
    this.messageCount += 1;
    this.lastMessageRateLimit = now;
    
    return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
    this.messages.forEach(message => {
        if (message.sender.toString() !== userId.toString() && !message.isRead) {
            message.isRead = true;
            message.readAt = new Date();
        }
    });
    
    return this.save();
};

// Static method to find or create chat with security
chatSchema.statics.findOrCreateChat = async function(artworkId, sellerId, buyerId) {
    let chat = await this.findOne({
        artwork: artworkId,
        seller: sellerId,
        buyer: buyerId
    });

    if (!chat) {
        // Get artwork details for chat metadata
        const Artwork = require('./Artwork');
        const artwork = await Artwork.findById(artworkId);
        
        // Generate unique chat hash
        const crypto = require('crypto');
        const chatHash = crypto.createHash('sha256')
            .update(artworkId + sellerId + buyerId + Date.now())
            .digest('hex');
        
        chat = new this({
            artwork: artworkId,
            seller: sellerId,
            buyer: buyerId,
            artworkTitle: artwork?.title || 'Unknown Artwork',
            soldPrice: artwork?.soldPrice || 0,
            chatHash: chatHash
        });
        
        await chat.save();
    }

    return chat;
};

// Method to soft delete a message (for user privacy)
chatSchema.methods.deleteMessage = function(messageId, userId) {
    const message = this.messages.id(messageId);
    if (!message) {
        throw new Error('Message not found');
    }
    
    // Only sender can delete their own message
    if (message.sender.toString() !== userId.toString()) {
        throw new Error('Unauthorized to delete this message');
    }
    
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    
    return this.save();
};

// Method to archive chat
chatSchema.methods.archiveChat = function(userId) {
    // Only participants can archive the chat
    if (this.seller.toString() !== userId.toString() && 
        this.buyer.toString() !== userId.toString()) {
        throw new Error('Unauthorized to archive this chat');
    }
    
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = userId;
    
    return this.save();
};

// Method to verify message integrity
chatSchema.methods.verifyMessageIntegrity = function(messageId) {
    const message = this.messages.id(messageId);
    if (!message) {
        return false;
    }
    
    const crypto = require('crypto');
    const expectedHash = crypto.createHash('sha256')
        .update(message.content + message.sender.toString() + message.createdAt.getTime().toString())
        .digest('hex');
    
    return message.messageHash === expectedHash;
};

// Pre-save middleware to ensure data integrity
chatSchema.pre('save', function(next) {
    // Ensure seller and buyer are different
    if (this.seller.toString() === this.buyer.toString()) {
        return next(new Error('Seller and buyer cannot be the same person'));
    }
    
    // Validate message count
    if (this.messageCount < 0) {
        this.messageCount = 0;
    }
    
    next();
});

module.exports = mongoose.model('Chat', chatSchema);
