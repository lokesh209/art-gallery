// Login page JavaScript
let currentUserType = 'seller';
let currentForm = 'login';

// Add event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, attaching event listeners...');
    
    // Check if user is already logged in as admin
    checkAdminStatus();
    
    // Attach form event listeners
    const sellerLoginForm = document.querySelector('form[onsubmit="handleSellerLogin(event)"]');
    if (sellerLoginForm) {
        sellerLoginForm.removeAttribute('onsubmit');
        sellerLoginForm.addEventListener('submit', handleSellerLogin);
        console.log('Seller login form listener attached');
    }
    
    const sellerRegisterForm = document.querySelector('form[onsubmit="handleSellerRegister(event)"]');
    if (sellerRegisterForm) {
        sellerRegisterForm.removeAttribute('onsubmit');
        sellerRegisterForm.addEventListener('submit', handleSellerRegister);
        console.log('Seller register form listener attached');
    }
    
    const buyerLoginForm = document.querySelector('form[onsubmit="handleBuyerLogin(event)"]');
    if (buyerLoginForm) {
        buyerLoginForm.removeAttribute('onsubmit');
        buyerLoginForm.addEventListener('submit', handleBuyerLogin);
        console.log('Buyer login form listener attached');
    }
    
    const buyerRegisterForm = document.querySelector('form[onsubmit="handleBuyerRegister(event)"]');
    if (buyerRegisterForm) {
        buyerRegisterForm.removeAttribute('onsubmit');
        buyerRegisterForm.addEventListener('submit', handleBuyerRegister);
        console.log('Buyer register form listener attached');
    }
    
    // Also attach click handlers for buttons
    const userTypeButtons = document.querySelectorAll('.user-type-btn');
    userTypeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove onclick attribute to avoid CSP issues
            this.removeAttribute('onclick');
            const type = this.textContent.includes('Sell') ? 'seller' : 'buyer';
            selectUserType(type);
        });
    });
    
    // Add secret admin access (Ctrl+Shift+A)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            showSecretAdminAccess();
        }
    });
    
    const toggleButtons = document.querySelectorAll('.toggle-form');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove onclick attribute to avoid CSP issues
            this.removeAttribute('onclick');
            const userType = this.closest('.form-container').id.includes('seller') ? 'seller' : 'buyer';
            toggleForm(userType);
        });
    });
});

function selectUserType(type) {
    currentUserType = type;
    
    // Update button states
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show appropriate form
    showForm(type, currentForm);
}

function toggleForm(userType) {
    currentForm = currentForm === 'login' ? 'register' : 'login';
    showForm(userType, currentForm);
}

function showForm(userType, formType) {
    // Hide all forms
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show the appropriate form
    const formId = userType + (formType === 'login' ? 'LoginForm' : 'RegisterForm');
    document.getElementById(formId).classList.add('active');
}

function showMessage(elementId, message, type) {
    console.log('Showing message:', elementId, message, type);
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = type === 'success' ? 'success-message' : 'error-message';
        element.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    } else {
        console.error('Element not found:', elementId);
    }
}

function showLoading(elementId) {
    document.getElementById(elementId).style.display = 'block';
}

function hideLoading(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Check if current user is admin and show/hide admin link
function checkAdminStatus() {
    const token = localStorage.getItem('artGalleryToken');
    const userData = localStorage.getItem('artGalleryUser');
    
    // Always hide admin link by default
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.style.display = 'none';
    }
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            if (user.userType === 'admin') {
                if (adminLink) {
                    adminLink.style.display = 'block';
                }
            }
        } catch (error) {
            console.log('Error parsing user data:', error);
        }
    }
}

// Logout function to clear admin access
function logout() {
    localStorage.removeItem('artGalleryToken');
    localStorage.removeItem('artGalleryUser');
    document.getElementById('adminLink').style.display = 'none';
    window.location.reload();
}

// Secret admin access function
function showSecretAdminAccess() {
    const adminEmail = prompt('Enter admin email:');
    const adminPassword = prompt('Enter admin password:');
    
    if (adminEmail && adminPassword) {
        // Try to login with admin credentials
        fetch(API_CONFIG.getApiUrl('/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: adminEmail,
                password: adminPassword
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data.user.userType === 'admin') {
                localStorage.setItem('artGalleryToken', result.data.token);
                localStorage.setItem('artGalleryUser', JSON.stringify(result.data.user));
                document.getElementById('adminLink').style.display = 'block';
                alert('Admin access granted! Admin panel is now visible.');
            } else {
                alert('Invalid admin credentials.');
            }
        })
        .catch(error => {
            alert('Error accessing admin panel.');
        });
    }
}

// Seller Login
async function handleSellerLogin(event) {
    console.log('handleSellerLogin called');
    event.preventDefault();
    console.log('Seller login form submitted');
    
            const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);
        console.log('Form data:', data);
        console.log('Form fields:', Array.from(formData.entries()));
    
    showLoading('sellerLoginLoading');
    hideMessage('sellerLoginSuccess');
    hideMessage('sellerLoginError');
    
    try {
        console.log('Making API call to login...');
        const response = await fetch(API_CONFIG.getApiUrl('/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response received:', response.status);
        
        if (response.status === 429) {
            hideLoading('sellerLoginLoading');
            showMessage('sellerLoginError', 'Too many login attempts. Please wait a few minutes before trying again.', 'error');
            return;
        }
        
        const result = await response.json();
        console.log('Result:', result);
        hideLoading('sellerLoginLoading');
        
        if (result.success) {
            // Store token and user data
            localStorage.setItem('artGalleryToken', result.data.token);
            localStorage.setItem('artGalleryUser', JSON.stringify(result.data.user));
            
            // Check if user is admin and show admin link
            if (result.data.user.userType === 'admin') {
                document.getElementById('adminLink').style.display = 'block';
                showMessage('sellerLoginSuccess', 'Admin login successful! You can access the admin panel.', 'success');
            } else {
                showMessage('sellerLoginSuccess', 'Login successful! Redirecting to artist dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'homepage.html';
                }, 2000);
            }
        } else {
            showMessage('sellerLoginError', result.message || 'Invalid email or password. Please try again.', 'error');
        }
    } catch (error) {
        hideLoading('sellerLoginLoading');
        showMessage('sellerLoginError', 'Network error. Please try again.', 'error');
    }
}

// Seller Register
async function handleSellerRegister(event) {
    event.preventDefault();
    console.log('Seller register form submitted');
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    console.log('Registration form data:', data);
    console.log('Registration form fields:', Array.from(formData.entries()));
    
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
        showMessage('sellerRegisterError', 'Passwords do not match.', 'error');
        return;
    }
    
    showLoading('sellerRegisterLoading');
    hideMessage('sellerRegisterSuccess');
    hideMessage('sellerRegisterError');
    
    try {
        console.log('Making registration API call...');
        const requestBody = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            userType: 'seller',
            artistName: data.artistName
        };
        console.log('Registration request body:', requestBody);
        
        const response = await fetch(API_CONFIG.getApiUrl('/auth/register'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Registration response status:', response.status);
        const result = await response.json();
        console.log('Registration result:', result);
        hideLoading('sellerRegisterLoading');
        
        if (result.success) {
            showMessage('sellerRegisterSuccess', 'Account created successfully! You can now log in.', 'success');
            event.target.reset();
            setTimeout(() => {
                toggleForm('seller');
            }, 2000);
        } else {
            showMessage('sellerRegisterError', result.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        hideLoading('sellerRegisterLoading');
        showMessage('sellerRegisterError', 'Network error. Please try again.', 'error');
    }
}

// Buyer Login
async function handleBuyerLogin(event) {
    event.preventDefault();
    console.log('Buyer login form submitted');
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    showLoading('buyerLoginLoading');
    hideMessage('buyerLoginSuccess');
    hideMessage('buyerLoginError');
    
    try {
        const response = await fetch(API_CONFIG.getApiUrl('/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.status === 429) {
            hideLoading('buyerLoginLoading');
            showMessage('buyerLoginError', 'Too many login attempts. Please wait a few minutes before trying again.', 'error');
            return;
        }
        
        const result = await response.json();
        hideLoading('buyerLoginLoading');
        
        if (result.success) {
            // Store token and user data
            localStorage.setItem('artGalleryToken', result.data.token);
            localStorage.setItem('artGalleryUser', JSON.stringify(result.data.user));
            
            // Check if user is admin and show admin link
            if (result.data.user.userType === 'admin') {
                document.getElementById('adminLink').style.display = 'block';
                showMessage('buyerLoginSuccess', 'Admin login successful! You can access the admin panel.', 'success');
            } else {
                showMessage('buyerLoginSuccess', 'Login successful! Redirecting to gallery...', 'success');
                setTimeout(() => {
                    window.location.href = 'gallery.html';
                }, 2000);
            }
        } else {
            showMessage('buyerLoginError', result.message || 'Invalid email or password. Please try again.', 'error');
        }
    } catch (error) {
        hideLoading('buyerLoginLoading');
        showMessage('buyerLoginError', 'Network error. Please try again.', 'error');
    }
}

// Buyer Register
async function handleBuyerRegister(event) {
    event.preventDefault();
    console.log('Buyer register form submitted');
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
        showMessage('buyerRegisterError', 'Passwords do not match.', 'error');
        return;
    }
    
    showLoading('buyerRegisterLoading');
    hideMessage('buyerRegisterSuccess');
    hideMessage('buyerRegisterError');
    
    try {
        const response = await fetch(API_CONFIG.getApiUrl('/auth/register'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                userType: 'buyer',
                shippingAddress: {
                    street: data.street || '',
                    city: data.city || '',
                    state: data.state || '',
                    zipCode: data.zipCode || '',
                    country: data.country || ''
                }
            })
        });
        
        const result = await response.json();
        hideLoading('buyerRegisterLoading');
        
        if (result.success) {
            showMessage('buyerRegisterSuccess', 'Account created successfully! You can now log in.', 'success');
            event.target.reset();
            setTimeout(() => {
                toggleForm('buyer');
            }, 2000);
        } else {
            showMessage('buyerRegisterError', result.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        hideLoading('buyerRegisterLoading');
        showMessage('buyerRegisterError', 'Network error. Please try again.', 'error');
    }
} 