# 🗄️ MongoDB Atlas Setup Guide

## Step-by-Step Instructions

### 1. Create Cluster
1. Go to: https://cloud.mongodb.com/
2. Click "Build a Database"
3. Choose "FREE" tier (M0)
4. Select any cloud provider
5. Choose a region close to you
6. Click "Create"

### 2. Set Up Database User
1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Username: `artgallery-user`
4. Password: Create a strong password (save it!)
5. Privileges: "Read and write to any database"
6. Click "Add User"

### 3. Set Up Network Access
1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. Click "Confirm"

### 4. Get Connection String
1. Go back to "Database"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string

### 5. Update Your Connection String
Replace the placeholder in `config.prod.env`:

```bash
# Replace this line:
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/artgallery?retryWrites=true&w=majority

# With your actual connection string:
MONGODB_URI=mongodb+srv://artgallery-user:YOUR_PASSWORD@your-cluster-name.mongodb.net/artgallery?retryWrites=true&w=majority
```

### 6. Test Connection
Run this command to test your connection:
```bash
curl -X GET "http://localhost:3000/api/health"
```

## Your Connection String Format
```
mongodb+srv://artgallery-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/artgallery?retryWrites=true&w=majority
```

## Next Steps
Once MongoDB is set up:
1. Deploy on Render
2. Set environment variables
3. Your app will be live!

## Need Help?
- Check MongoDB Atlas documentation
- Verify your IP is whitelisted
- Make sure username/password are correct
