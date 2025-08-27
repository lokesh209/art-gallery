# ArtGallery - Art Marketplace Backend

A complete backend system for an art marketplace with AI verification, real-time bidding, and image management.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image storage)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up MongoDB:**
   - **Local:** `brew services start mongodb/brew/mongodb-community`
   - **Atlas:** Create account at [mongodb.com/atlas](https://mongodb.com/atlas)

3. **Set up Cloudinary:**
   - Create account at [cloudinary.com](https://cloudinary.com)
   - Get your cloud name, API key, and API secret

4. **Configure environment variables:**
   - Copy `config.env` and update with your credentials
   - Update MongoDB URI, Cloudinary credentials, and JWT secret

5. **Start the server:**
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## 📊 Data Storage Architecture

### **🗄️ MongoDB Database (All Text Data)**

**Database Name:** `artgallery`

#### **Collections:**

1. **users** - User profiles and authentication
   - User information (name, email, password hash)
   - User type (buyer/seller)
   - Artist profiles (for sellers)
   - Shipping addresses (for buyers)
   - Statistics and ratings

2. **artworks** - Artwork listings and auction data
   - Artwork details (title, description, category)
   - Pricing and bidding information
   - Auction timers and status
   - AI verification results
   - View counts and favorites

3. **bids** - Complete bidding history
   - All bids placed by users
   - Bid amounts and timestamps
   - Bid status (active, outbid, won, lost)
   - IP addresses for security

### **☁️ Cloudinary (All Images)**

**Storage Location:** Cloudinary cloud storage

#### **Image Types Stored:**

1. **Artwork Images** (`/artgallery/` folder)
   - High-resolution artwork photos
   - Multiple images per artwork
   - Optimized versions for different screen sizes
   - Primary image designation

2. **User Avatars** (`/artgallery/avatars/` folder)
   - Profile pictures
   - Optimized and cropped automatically

3. **AI Verification Images**
   - Temporary storage during AI analysis
   - Processed images for verification

### **🔐 JWT Tokens (Authentication)**

**Storage:** Client-side (localStorage/sessionStorage)
- User authentication tokens
- Token refresh mechanism
- Session management

## 🌐 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### **Artworks**
- `POST /api/artworks` - Create artwork
- `GET /api/artworks` - Get all artworks (with filters)
- `GET /api/artworks/:id` - Get single artwork
- `PUT /api/artworks/:id` - Update artwork
- `DELETE /api/artworks/:id` - Delete artwork
- `POST /api/artworks/:id/verify` - AI verification

### **Bidding**
- `POST /api/bids` - Place bid
- `GET /api/bids/artwork/:id` - Get bid history
- `GET /api/bids/my-bids` - User's bid history
- `GET /api/bids/winning` - Winning bids

### **Upload**
- `POST /api/upload/artwork-images` - Upload artwork images
- `POST /api/upload/verify-image` - AI image verification
- `POST /api/upload/avatar` - Upload user avatar

### **Users**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/statistics` - User statistics
- `GET /api/users/my-artworks` - User's artworks
- `GET /api/users/favorites` - User's favorites

## 🔗 Frontend Integration

### **Update Frontend URLs:**

1. **Update login.html:**
```javascript
// Change redirect URLs
window.location.href = 'http://localhost:3000/api/auth/login';
```

2. **Update gallery.html:**
```javascript
// Update API base URL
const API_BASE = 'http://localhost:3000/api';
```

3. **Update homepage.html:**
```javascript
// Update form submission to backend
fetch('http://localhost:3000/api/artworks', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(artworkData)
});
```

### **CORS Configuration:**
The backend is configured to accept requests from any origin in development. For production, update the CORS settings in `server.js`.

## 🤖 AI Integration

### **Current Setup:**
- AI verification endpoints are ready
- Simulated AI responses for development
- Easy integration with your AI model

### **To Integrate Your AI Model:**

1. **Update AI Model URL in `config.env`:**
```
AI_MODEL_URL=http://your-ai-server:port/verify
AI_MODEL_API_KEY=your-ai-api-key
```

2. **The AI verification function is in:**
- `routes/artworks.js` - `verifyWithAI()`
- `routes/upload.js` - `verifyWithAI()`

3. **Expected AI Response Format:**
```json
{
    "is_human_created": true,
    "confidence": 0.95
}
```

## 🔧 Environment Variables

### **Required Variables:**
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/artgallery

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Image Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Model
AI_MODEL_URL=http://your-ai-server/verify
AI_MODEL_API_KEY=your-ai-key
```

## 📱 Real-time Features

### **Socket.IO Integration:**
- Real-time bidding updates
- Live auction status changes
- Instant notifications

### **Usage:**
```javascript
// Connect to Socket.IO
const socket = io('http://localhost:3000');

// Join artwork room
socket.emit('join-artwork-room', artworkId);

// Listen for bid updates
socket.on('bid-placed', (data) => {
    // Update UI with new bid
});
```

## 🚀 Production Deployment

### **Recommended Setup:**
1. **Database:** MongoDB Atlas
2. **Image Storage:** Cloudinary
3. **Server:** Heroku, Vercel, or AWS
4. **Domain:** Custom domain with SSL

### **Environment Variables for Production:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-atlas-uri
JWT_SECRET=very-long-secure-secret
```

## 🔒 Security Features

- **JWT Authentication** with token refresh
- **Password hashing** with bcrypt
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse
- **CORS configuration** for frontend security
- **File upload validation** and size limits

## 📈 Performance Features

- **Database indexing** for fast queries
- **Image optimization** with Cloudinary
- **Pagination** for large datasets
- **Caching** ready for implementation
- **Compression** for API responses

## 🐛 Troubleshooting

### **Common Issues:**

1. **Port 5000 in use:**
   - Change PORT in config.env to 3000

2. **MongoDB connection failed:**
   - Ensure MongoDB is running: `brew services start mongodb/brew/mongodb-community`

3. **Cloudinary upload failed:**
   - Check your Cloudinary credentials in config.env

4. **CORS errors:**
   - Backend is configured to accept all origins in development

## 📞 Support

For issues or questions:
1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB and Cloudinary are properly configured

---

**🎨 ArtGallery Backend** - Complete art marketplace backend with AI verification, real-time bidding, and secure image management. 