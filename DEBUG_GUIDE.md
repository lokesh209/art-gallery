# 🔧 Debug Guide for Art Marketplace

## 🚨 **Issue: Login page not responding**

### **Step 1: Test the Simple Login Page**
1. Go to: `http://localhost:3000/test.html`
2. Try logging in with:
   - Email: `test2@example.com`
   - Password: `password123`
3. Check browser console (F12) for any errors

### **Step 2: Test the Main Login Page**
1. Go to: `http://localhost:3000`
2. Open browser console (F12)
3. Try registering a new user
4. Check console for any error messages

### **Step 3: Check Backend Status**
```bash
# Test if backend is working
curl http://localhost:3000/api/health

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test3@example.com","password":"password123","userType":"seller"}'
```

### **Step 4: Common Issues & Solutions**

#### **Issue 1: CORS Errors**
- **Symptom:** Network errors in console
- **Solution:** Backend CORS is configured correctly

#### **Issue 2: JavaScript Errors**
- **Symptom:** Console shows JavaScript errors
- **Solution:** Check browser console for specific errors

#### **Issue 3: Form Not Submitting**
- **Symptom:** Clicking submit does nothing
- **Solution:** Check if event listeners are attached correctly

### **Step 5: Manual Testing**

#### **Test Registration:**
1. Open `http://localhost:3000`
2. Click "Sell Art" → "Register as Artist"
3. Fill in the form:
   - First Name: John
   - Last Name: Artist
   - Email: john@test.com
   - Password: password123
   - Confirm Password: password123
4. Click "Create Artist Account"
5. Check for success message

#### **Test Login:**
1. After successful registration, click "Sign In"
2. Enter:
   - Email: john@test.com
   - Password: password123
3. Click "Sign In"
4. Should redirect to homepage.html

### **Step 6: Browser Console Debugging**

Open browser console (F12) and look for:
- ✅ Console.log messages showing form submission
- ✅ Network requests to `/api/auth/login` or `/api/auth/register`
- ❌ JavaScript errors
- ❌ CORS errors

### **Step 7: Expected Behavior**

#### **Registration:**
- Form submits without page reload
- Success message appears
- Form resets after 2 seconds

#### **Login:**
- Form submits without page reload
- Success message appears
- Redirects to appropriate page after 2 seconds

### **Step 8: If Still Not Working**

1. **Try the simple test page:** `http://localhost:3000/test.html`
2. **Check if backend is running:** `curl http://localhost:3000/api/health`
3. **Restart the server:** `npm run dev`
4. **Clear browser cache:** Hard refresh (Ctrl+F5)

### **🎯 Success Indicators:**

✅ **Backend responds:** `{"status":"OK"}`  
✅ **Registration works:** Success message appears  
✅ **Login works:** Redirects to appropriate page  
✅ **No console errors:** Clean browser console  
✅ **Network requests:** API calls visible in Network tab  

**If the simple test page works but the main login doesn't, the issue is in the main login page JavaScript.** 