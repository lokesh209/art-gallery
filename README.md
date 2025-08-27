# 🎨 Art Gallery Platform

A modern art marketplace where artists can showcase their work and art lovers can discover, bid on, and purchase unique pieces. Features AI-powered artwork verification and real-time chat between buyers and sellers.

## ✨ Features

### For Artists (Sellers)
- **Artwork Upload**: Upload high-quality images with detailed descriptions
- **AI Verification**: Automatic verification to ensure original artwork
- **Bid Management**: Accept or reject bids from potential buyers
- **Real-time Chat**: Communicate directly with buyers after bid acceptance
- **Profile Management**: Professional artist profiles and portfolios

### For Art Lovers (Buyers)
- **Artwork Discovery**: Browse curated collections by category and price
- **Bidding System**: Place bids on artwork you love
- **Real-time Updates**: Get notified of new bids and auction status
- **Direct Communication**: Chat with artists after successful bids
- **Secure Transactions**: Safe and transparent buying process

### Platform Features
- **AI-Powered Verification**: Ensures authenticity of uploaded artwork
- **Real-time Bidding**: Live updates and notifications
- **Secure Authentication**: JWT-based user authentication
- **Image Storage**: Cloud-based image hosting with Cloudinary
- **Responsive Design**: Works perfectly on desktop and mobile
- **Rate Limiting**: Protection against abuse and spam

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd art-gallery

# Install dependencies
npm install

# Set up environment variables
cp config.env.example config.env
# Edit config.env with your credentials

# Start the development server
npm run dev
```

### Production Deployment
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

**Quick Deploy (10 minutes):**
1. Push code to GitHub
2. Set up MongoDB Atlas
3. Set up Cloudinary
4. Deploy on Render

## 📁 Project Structure

```
art-gallery/
├── models/              # Database models
│   ├── User.js         # User authentication
│   ├── Artwork.js      # Artwork management
│   ├── Bid.js          # Bidding system
│   ├── Chat.js         # Real-time messaging
│   ├── Transaction.js  # Transaction records
│   └── Notification.js # User notifications
├── routes/             # API endpoints
│   ├── auth.js         # Authentication routes
│   ├── artworks.js     # Artwork management
│   ├── bids.js         # Bidding system
│   ├── chats.js        # Chat functionality
│   ├── upload.js       # File upload handling
│   └── notifications.js # Notification system
├── middleware/         # Custom middleware
│   ├── auth.js         # JWT authentication
│   └── errorHandler.js # Error handling
├── public/            # Static files
│   ├── homepage.html  # Seller dashboard
│   ├── gallery.html   # Buyer gallery
│   ├── chat.html      # Chat interface
│   └── login.html     # Authentication
└── server.js          # Main server file
```

## 🔧 Configuration

### Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/artgallery

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRE=7d

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Model
AI_MODEL_URL=http://localhost:8000/verify
AI_MODEL_API_KEY=your-ai-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Artworks
- `GET /api/artworks` - Get all artworks
- `POST /api/artworks` - Upload new artwork
- `GET /api/artworks/:id` - Get specific artwork
- `PUT /api/artworks/:id/accept-bid` - Accept a bid

### Bidding
- `POST /api/bids` - Place a bid
- `GET /api/bids/artwork/:artworkId` - Get bids for artwork

### Chat
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:id` - Get specific chat
- `POST /api/chats/:id/messages` - Send message

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🎯 Deployment Options

### Free Tier (Recommended)
- **Render**: Free hosting with automatic deployments
- **MongoDB Atlas**: Free database (512MB)
- **Cloudinary**: Free image storage (25GB)

### Paid Options
- **Railway**: $20/month for better performance
- **Heroku**: $7/month for reliable hosting
- **Vercel**: Free frontend + paid backend

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **Rate Limiting**: Protection against abuse
- **Input Validation**: XSS and injection prevention
- **File Upload Security**: Image validation and sanitization
- **CORS Protection**: Cross-origin request security
- **Helmet.js**: Security headers

## 📱 User Experience

### Responsive Design
- Mobile-first approach
- Works on all devices
- Touch-friendly interface

### Real-time Features
- Live bidding updates
- Instant chat messaging
- Real-time notifications

### Performance
- Optimized image loading
- Efficient database queries
- CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues**: Report bugs on GitHub
- **Questions**: Open a discussion

## 🎉 Getting Started

Ready to deploy your art gallery? Follow the [Quick Deploy Guide](./QUICK_DEPLOY.md) to get online in 10 minutes!

---

**Built with ❤️ for the art community** 