// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Smooth scrolling for navigation links
    const allNavLinks = document.querySelectorAll('.nav-links a, .footer-section a');
    
    allNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const headerHeight = document.querySelector('.luxury-header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Enhanced header scroll effect
    const header = document.querySelector('.luxury-header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'linear-gradient(135deg, rgba(26,26,26,0.98) 0%, rgba(44,44,44,0.98) 100%)';
            header.style.backdropFilter = 'blur(15px)';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
        } else {
            header.style.background = 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(44,44,44,0.95) 100%)';
            header.style.backdropFilter = 'blur(10px)';
            header.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    });

    // CTA Button functionality
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('primary')) {
                // Scroll to contact section for booking
                const contactSection = document.querySelector('#contact');
                if (contactSection) {
                    const headerHeight = document.querySelector('.luxury-header').offsetHeight;
                    const targetPosition = contactSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            } else if (this.classList.contains('secondary')) {
                // Virtual tour placeholder
                showNotification('Virtual tour coming soon!', 'info');
            }
        });
    });

    // Contact form handling
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            const validation = validateForm(data);
            if (!validation.valid) {
                showNotification(validation.message, 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                showNotification('Reservation request sent successfully! We will contact you soon.', 'success');
                this.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }

    // Scroll reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animateElements = document.querySelectorAll('.room-card, .dining-item, .wellness-feature, .gallery-item, .contact-item');
    animateElements.forEach(element => {
        element.classList.add('scroll-reveal');
        observer.observe(element);
    });

    // Gallery lightbox functionality
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const placeholder = this.querySelector('.image-placeholder').textContent;
            showNotification(`Viewing: ${placeholder}`, 'info');
        });
    });

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        const heroOverlay = document.querySelector('.hero-overlay');
        
        if (heroContent && heroOverlay) {
            const speed = 0.5;
            heroContent.style.transform = `translateY(${scrolled * speed}px)`;
            heroOverlay.style.transform = `translateY(${scrolled * speed * 0.3}px)`;
        }
    });

    // Room card hover effects
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Initialize tooltips for features
    initializeTooltips();

    // Guest Services form functionality
    initializeGuestServices();
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    // Set background color based on type
    const colors = {
        success: 'linear-gradient(135deg, #28a745, #20c997)',
        error: 'linear-gradient(135deg, #dc3545, #c82333)',
        info: 'linear-gradient(135deg, #17a2b8, #138496)',
        warning: 'linear-gradient(135deg, #ffc107, #e0a800)'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Enhanced form validation
function validateForm(formData) {
    // Required fields validation
    const requiredFields = ['Full Name', 'Email Address', 'Phone Number'];
    for (const field of requiredFields) {
        const input = document.querySelector(`input[placeholder="${field}"]`);
        if (input && !input.value.trim()) {
            return { valid: false, message: `${field} is required` };
        }
    }
    
    // Email validation
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
    }
    
    // Phone validation
    const phoneInput = document.querySelector('input[type="tel"]');
    if (phoneInput) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phoneInput.value)) {
            return { valid: false, message: 'Please enter a valid phone number' };
        }
    }
    
    // Date validation
    const checkinDate = document.querySelector('input[type="date"]:nth-of-type(1)');
    const checkoutDate = document.querySelector('input[type="date"]:nth-of-type(2)');
    
    if (checkinDate && checkoutDate) {
        const checkin = new Date(checkinDate.value);
        const checkout = new Date(checkoutDate.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkin < today) {
            return { valid: false, message: 'Check-in date cannot be in the past' };
        }
        
        if (checkout <= checkin) {
            return { valid: false, message: 'Check-out date must be after check-in date' };
        }
    }
    
    return { valid: true };
}

// Tooltip initialization
function initializeTooltips() {
    const featureItems = document.querySelectorAll('.feature-item, .room-features span, .dining-info span');
    
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.cursor = 'help';
            this.style.position = 'relative';
        });
    });
}

// Utility functions
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Enhanced API service
const apiService = {
    async bookRoom(bookingData) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Booking data:', bookingData);
            return { success: true, message: 'Booking successful!' };
        } catch (error) {
            return { success: false, message: 'Booking failed. Please try again.' };
        }
    },
    
    async submitContactForm(formData) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Contact form data:', formData);
            return { success: true, message: 'Message sent successfully!' };
        } catch (error) {
            return { success: false, message: 'Failed to send message. Please try again.' };
        }
    }
};

// Performance optimization - debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll events
window.addEventListener('scroll', debounce(function() {
    // Scroll-based animations can be added here
}, 16)); // ~60fps

// Utility functions
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Form validation (placeholder for future contact form)
function validateForm(formData) {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (formData.email && !emailRegex.test(formData.email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }
    
    return { valid: true };
}

// API service placeholder
const apiService = {
    // Placeholder for future API calls
    async bookRoom(bookingData) {
        try {
            // This would make an actual API call
            console.log('Booking data:', bookingData);
            return { success: true, message: 'Booking successful!' };
        } catch (error) {
            return { success: false, message: 'Booking failed. Please try again.' };
        }
    }
};

// Guest Services functionality
function initializeGuestServices() {
    const serviceForm = document.getElementById('guestServiceForm');
    const serviceTypeSelect = document.getElementById('serviceType');
    const laundryOptions = document.getElementById('laundryOptions');
    const roomServiceOptions = document.getElementById('roomServiceOptions');
    
    // Handle service type change
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', function() {
            const selectedService = this.value;
            
            // Hide all option sections
            laundryOptions.style.display = 'none';
            roomServiceOptions.style.display = 'none';
            
            // Show relevant options based on selection
            if (selectedService === 'laundry') {
                laundryOptions.style.display = 'block';
            } else if (selectedService === 'room-service') {
                roomServiceOptions.style.display = 'block';
            }
        });
    }
    
    // Handle form submission
    if (serviceForm) {
        serviceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate form
            const validation = validateGuestServiceForm(data);
            if (!validation.valid) {
                showNotification(validation.message, 'error');
                return;
            }
            
            // Collect selected options
            const selectedOptions = [];
            const serviceType = data.serviceType;
            
            if (serviceType === 'laundry') {
                const laundryCheckboxes = document.querySelectorAll('input[name="laundryOptions"]:checked');
                laundryCheckboxes.forEach(checkbox => {
                    selectedOptions.push(checkbox.value);
                });
            } else if (serviceType === 'room-service') {
                const roomServiceCheckboxes = document.querySelectorAll('input[name="roomServiceOptions"]:checked');
                roomServiceCheckboxes.forEach(checkbox => {
                    selectedOptions.push(checkbox.value);
                });
            }
            
            if (selectedOptions.length === 0) {
                showNotification('Please select at least one service option', 'error');
                return;
            }
            
            // Prepare service request data
            const serviceRequest = {
                roomNumber: data.roomNumber,
                serviceType: serviceType,
                options: selectedOptions,
                specialRequests: data.specialRequests || '',
                timestamp: new Date().toISOString()
            };
            
            // Show loading state
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                submitGuestServiceRequest(serviceRequest)
                    .then(response => {
                        if (response.success) {
                            showNotification(response.message, 'success');
                            showServiceConfirmation(serviceRequest);
                            this.reset();
                            
                            // Hide option sections
                            laundryOptions.style.display = 'none';
                            roomServiceOptions.style.display = 'none';
                        } else {
                            showNotification(response.message, 'error');
                        }
                    })
                    .catch(error => {
                        showNotification('Failed to submit request. Please try again.', 'error');
                    })
                    .finally(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    });
            }, 1500);
        });
    }
}

// Validate guest service form
function validateGuestServiceForm(data) {
    if (!data.roomNumber || data.roomNumber.trim() === '') {
        return { valid: false, message: 'Room number is required' };
    }
    
    // Validate room number format (should be numeric)
    const roomNumberRegex = /^\d+$/;
    if (!roomNumberRegex.test(data.roomNumber.trim())) {
        return { valid: false, message: 'Please enter a valid room number' };
    }
    
    if (!data.serviceType) {
        return { valid: false, message: 'Please select a service type' };
    }
    
    return { valid: true };
}

// Submit guest service request
async function submitGuestServiceRequest(requestData) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Guest service request:', requestData);
        
        // Store request in localStorage for demo purposes
        const existingRequests = JSON.parse(localStorage.getItem('guestServiceRequests') || '[]');
        existingRequests.push(requestData);
        localStorage.setItem('guestServiceRequests', JSON.stringify(existingRequests));
        
        return { 
            success: true, 
            message: `Service request submitted for Room ${requestData.roomNumber}! We'll process it shortly.` 
        };
    } catch (error) {
        return { success: false, message: 'Failed to submit request. Please try again.' };
    }
}

// Show service confirmation
function showServiceConfirmation(requestData) {
    const confirmation = document.getElementById('serviceConfirmation');
    if (confirmation) {
        confirmation.style.display = 'block';
        
        // Scroll to confirmation
        confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Hide confirmation after 5 seconds
        setTimeout(() => {
            confirmation.style.display = 'none';
        }, 5000);
    }
}
