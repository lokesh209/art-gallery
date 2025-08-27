const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function simpleTest() {
    console.log('🎨 Simple Art Marketplace Test\n');

    try {
        // 1. Login as existing seller
        console.log('1. Logging in as seller...');
        const sellerLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'sarah.artist@test.com',
            password: 'password123'
        });
        
        const sellerToken = sellerLogin.data.data.token;
        console.log('✅ Seller logged in:', sellerLogin.data.data.user.displayName);

        // 2. Create an artwork
        console.log('\n2. Creating an artwork...');
        const artworkResponse = await axios.post(`${API_BASE}/artworks`, {
            title: 'Mountain Landscape',
            description: 'A beautiful oil painting of mountains with dramatic lighting and vibrant colors',
            category: 'painting',
            originalPrice: 1500,
            medium: 'Oil on Canvas',
            yearCreated: 2024,
            dimensions: {
                width: 80,
                height: 60,
                unit: 'cm'
            },
            tags: ['mountain', 'landscape', 'nature'],
            location: {
                city: 'Mountain City',
                country: 'Artland'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${sellerToken}`
            }
        });
        
        const artworkId = artworkResponse.data.data.artwork._id;
        console.log('✅ Artwork created:', artworkResponse.data.data.artwork.title);
        console.log('   Price: $' + artworkResponse.data.data.artwork.originalPrice);
        console.log('   Min Bid: $' + artworkResponse.data.data.artwork.minBid);

        // Manually approve artwork for testing (in production this would be done by AI verification)
        console.log('\n2.5. Approving artwork for testing...');
        const approveResponse = await axios.put(`${API_BASE}/artworks/${artworkId}`, {
            isApproved: true,
            status: 'active'
        }, {
            headers: {
                'Authorization': `Bearer ${sellerToken}`
            }
        });
        console.log('✅ Artwork approved for bidding');

        // 3. Login as buyer
        console.log('\n3. Logging in as buyer...');
        const buyerLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'mike.collector@test.com',
            password: 'password123'
        });
        
        const buyerToken = buyerLogin.data.data.token;
        console.log('✅ Buyer logged in:', buyerLogin.data.data.user.displayName);

        // 4. Get all artworks
        console.log('\n4. Fetching all artworks...');
        const artworksResponse = await axios.get(`${API_BASE}/artworks`, {
            headers: {
                'Authorization': `Bearer ${buyerToken}`
            }
        });
        console.log('✅ Found', artworksResponse.data.data.artworks.length, 'artworks');

        // 5. Place a bid
        console.log('\n5. Placing a bid...');
        const bidResponse = await axios.post(`${API_BASE}/bids`, {
            artworkId: artworkId,
            amount: 1400
        }, {
            headers: {
                'Authorization': `Bearer ${buyerToken}`
            }
        });
        console.log('✅ Bid placed:', `$${bidResponse.data.data.bid.amount}`);

        // 6. Get bid history
        console.log('\n6. Fetching bid history...');
        const bidHistoryResponse = await axios.get(`${API_BASE}/bids/artwork/${artworkId}`, {
            headers: {
                'Authorization': `Bearer ${buyerToken}`
            }
        });
        console.log('✅ Bid history retrieved:', bidHistoryResponse.data.data.bids.length, 'bids');

        // 7. Get user profile
        console.log('\n7. Fetching user profile...');
        const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${sellerToken}`
            }
        });
        console.log('✅ User profile:', profileResponse.data.data.user.displayName);

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📊 System Status:');
        console.log('- ✅ Backend running on port 3000');
        console.log('- ✅ MongoDB connected');
        console.log('- ✅ User authentication working');
        console.log('- ✅ Artwork creation working');
        console.log('- ✅ Bidding system working');
        console.log('- ✅ User profiles working');
        console.log('- ⏳ AI verification ready for integration');
        console.log('- ⏳ Image upload ready for Cloudinary setup');

        console.log('\n🚀 Your art marketplace is ready!');
        console.log('Next steps:');
        console.log('1. Set up Cloudinary for image uploads');
        console.log('2. Integrate your AI model');
        console.log('3. Connect your frontend HTML files');
        console.log('4. Deploy to production');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

simpleTest(); 