# 🎨 **How to Test Your Art Marketplace Application**

## ✅ **Your Application is Now Connected to the Backend!**

### **🚀 Quick Start:**

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and go to:**
   ```
   http://localhost:3000/login.html
   ```

### **🧪 Step-by-Step Testing:**

#### **Step 1: Register a Seller**
1. Open `login.html` in your browser
2. Click "Sell Art" button
3. Click "Register" tab
4. Fill in the form:
   - First Name: John
   - Last Name: Artist
   - Email: john@example.com
   - Password: password123
   - Artist Name: John Artist
5. Click "Create Account"
6. You should see "Account created successfully!"

#### **Step 2: Login as Seller**
1. Click "Login" tab
2. Enter:
   - Email: john@example.com
   - Password: password123
3. Click "Sign In"
4. You should be redirected to `homepage.html`

#### **Step 3: Upload Artwork**
1. On the homepage, fill in the artwork form:
   - Title: Beautiful Sunset
   - Description: A stunning oil painting of a sunset over the ocean
   - Price: 1000
   - Category: Painting
2. Click "Submit Artwork"
3. You should see "Artwork submitted successfully!"

#### **Step 4: Register a Buyer**
1. Open a new browser tab
2. Go to `login.html` again
3. Click "Buy Art" button
4. Click "Register" tab
5. Fill in the form:
   - First Name: Jane
   - Last Name: Collector
   - Email: jane@example.com
   - Password: password123
6. Click "Create Account"

#### **Step 5: Login as Buyer**
1. Click "Login" tab
2. Enter:
   - Email: jane@example.com
   - Password: password123
3. Click "Sign In"
4. You should be redirected to `gallery.html`

#### **Step 6: Browse and Bid**
1. In the gallery, you should see the artwork you uploaded
2. Enter a bid amount (must be at least $900)
3. Click "Place Bid"
4. You should see "Bid placed successfully!"

### **🎯 What You're Testing:**

✅ **User Registration** - Creating accounts for buyers and sellers  
✅ **User Login** - Authenticating users with JWT tokens  
✅ **Artwork Upload** - Sellers can create artwork listings  
✅ **Gallery Display** - Buyers can see all available artwork  
✅ **Bidding System** - Real-time bidding with validation  
✅ **Database Storage** - All data is stored in MongoDB  
✅ **API Integration** - Frontend connected to backend  

### **📊 Data Flow:**

1. **Registration** → Creates user in MongoDB
2. **Login** → Returns JWT token
3. **Artwork Upload** → Stores artwork in database
4. **Gallery Load** → Fetches artworks from API
5. **Bidding** → Updates artwork and creates bid record

### **🔧 Troubleshooting:**

- **If login fails:** Check that the server is running on port 3000
- **If artwork doesn't appear:** Make sure you're logged in as a buyer
- **If bidding fails:** Check that you're logged in and the bid amount is valid

### **🎉 Success Indicators:**

- ✅ Users can register and login
- ✅ Sellers can upload artwork
- ✅ Buyers can see artwork in gallery
- ✅ Buyers can place bids
- ✅ All data persists in database
- ✅ Real-time updates work

**Your art marketplace is now fully functional!** 🎨 