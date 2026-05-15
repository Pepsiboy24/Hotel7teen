// ============================================================
//  Hotel7teen — script.js
//  Single, conflict-free script for all shared page behaviour.
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {

    // --------------------------------------------------------
    // 1. Hamburger menu
    // --------------------------------------------------------
    const hamburger = document.querySelector('.hamburger');
    const navLinks  = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // --------------------------------------------------------
    // 2. Smooth-scroll for in-page anchor links ONLY
    //    Non-anchor hrefs (rooms.html, booking.html etc.) are
    //    left completely untouched so navigation still works.
    // --------------------------------------------------------
    document.querySelectorAll('.nav-links a, .footer-section a').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = document.querySelector('.luxury-header')?.offsetHeight || 0;
                    window.scrollTo({ top: target.offsetTop - headerHeight, behavior: 'smooth' });
                }
            }
        });
    });

    // --------------------------------------------------------
    // 3. Single merged scroll handler (header + parallax)
    //    One debounced listener instead of three separate ones.
    // --------------------------------------------------------
    const header = document.querySelector('.luxury-header');

    window.addEventListener('scroll', debounce(function () {
        const scrollY = window.scrollY;

        // Header background
        if (header) {
            if (scrollY > 100) {
                header.style.background     = 'linear-gradient(135deg, rgba(26,26,26,0.98) 0%, rgba(44,44,44,0.98) 100%)';
                header.style.backdropFilter = 'blur(15px)';
                header.style.boxShadow      = '0 5px 20px rgba(0,0,0,0.3)';
            } else {
                header.style.background     = 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(44,44,44,0.95) 100%)';
                header.style.backdropFilter = 'blur(10px)';
                header.style.boxShadow      = 'none';
            }
        }

        // Hero parallax
        const heroContent = document.querySelector('.hero-content');
        const heroOverlay = document.querySelector('.hero-overlay');
        if (heroContent && heroOverlay) {
            heroContent.style.transform = `translateY(${scrollY * 0.5}px)`;
            heroOverlay.style.transform = `translateY(${scrollY * 0.15}px)`;
        }
    }, 16), { passive: true });

    // --------------------------------------------------------
    // 4. Scroll-reveal — single IntersectionObserver, fires once
    // --------------------------------------------------------
    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll(
        '.room-card, .dining-item, .wellness-feature, .gallery-item, .contact-item, .teaser-card, .featured-item'
    ).forEach(el => {
        el.classList.add('scroll-reveal');
        revealObserver.observe(el);
    });

    // --------------------------------------------------------
    // 5. Gallery lightbox placeholder
    // --------------------------------------------------------
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', function () {
            const label = this.querySelector('.image-placeholder')?.textContent;
            if (label) showNotification(`Viewing: ${label}`, 'info');
        });
    });

    // --------------------------------------------------------
    // 6. Contact / reservation form
    // --------------------------------------------------------
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const data       = Object.fromEntries(new FormData(this));
            const validation = validateContactForm(data);
            if (!validation.valid) {
                showNotification(validation.message, 'error');
                return;
            }

            const submitBtn = this.querySelector('.submit-btn');
            const origText  = submitBtn.textContent;
            submitBtn.textContent = 'Sending\u2026';
            submitBtn.disabled    = true;

            setTimeout(() => {
                showNotification('Reservation request sent! We will contact you soon.', 'success');
                this.reset();
                submitBtn.textContent = origText;
                submitBtn.disabled    = false;
            }, 2000);
        });
    }

    // --------------------------------------------------------
    // 7. Guest Services form
    // --------------------------------------------------------
    initializeGuestServices();

    // --------------------------------------------------------
    // 8. Rooms page — load cards dynamically
    // --------------------------------------------------------
    if (window.location.pathname.includes('rooms.html') || document.querySelector('.rooms-grid')) {
        loadRooms();
    }

    // --------------------------------------------------------
    // 9. Admin login form handling
    // --------------------------------------------------------
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            const submitBtn = this.querySelector('.submit-btn');
            const origText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('staffToken', data.session.access_token);
                    localStorage.setItem('staffRefreshToken', data.session.refresh_token);
                    localStorage.setItem('staffUser', JSON.stringify(data.user));
                    showNotification('Login successful!', 'success');
                    document.getElementById('auth-section').style.display = 'none';
                    document.getElementById('dashboard-section').style.display = 'block';
                    document.getElementById('welcome-message').textContent = `Welcome, ${data.user.first_name}`;
                } else {
                    showNotification(data.message || 'Login failed', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showNotification('Failed to connect to server', 'error');
            } finally {
                submitBtn.textContent = origText;
                submitBtn.disabled = false;
            }
        });
    }

    // --------------------------------------------------------
    // 10. Check for existing admin session on page load
    // --------------------------------------------------------
    const staffToken = localStorage.getItem('staffToken');
    const staffUser = localStorage.getItem('staffUser');
    if (staffToken && staffUser && document.getElementById('auth-section')) {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${staffToken}`
                }
            });

            if (response.ok) {
                const user = JSON.parse(staffUser);
                document.getElementById('auth-section').style.display = 'none';
                document.getElementById('dashboard-section').style.display = 'block';
                document.getElementById('welcome-message').textContent = `Welcome, ${user.first_name}`;
            } else {
                localStorage.removeItem('staffToken');
                localStorage.removeItem('staffRefreshToken');
                localStorage.removeItem('staffUser');
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }
});


// ============================================================
//  Utility — debounce
// ============================================================
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ============================================================
//  Utility — scroll to top (exposed globally)
// ============================================================
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ============================================================
//  Notification toast
// ============================================================
function showNotification(message, type = 'info') {
    const colors = {
        success: 'linear-gradient(135deg, #28a745, #20c997)',
        error:   'linear-gradient(135deg, #dc3545, #c82333)',
        info:    'linear-gradient(135deg, #17a2b8, #138496)',
        warning: 'linear-gradient(135deg, #ffc107, #e0a800)'
    };

    const el = document.createElement('div');
    el.className   = `notification ${type}`;
    el.textContent = message;
    Object.assign(el.style, {
        position:     'fixed',
        top:          '20px',
        right:        '20px',
        padding:      '1rem 1.5rem',
        borderRadius: '0',
        color:        'white',
        fontWeight:   '500',
        fontFamily:   "'Montserrat', sans-serif",
        fontSize:     '0.9rem',
        zIndex:       '10000',
        transform:    'translateX(120%)',
        transition:   'transform 0.3s ease',
        maxWidth:     '320px',
        boxShadow:    '0 5px 20px rgba(0,0,0,0.25)',
        background:   colors[type] || colors.info
    });

    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translateX(0)'; });

    setTimeout(() => {
        el.style.transform = 'translateX(120%)';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}


// ============================================================
//  Form validation
// ============================================================

/**
 * validateContactForm
 * Used by the contact / reservation form on the homepage.
 */
function validateContactForm(data) {
    const nameInput  = document.querySelector('input[placeholder="Full Name"]');
    const emailInput = document.querySelector('input[type="email"]');
    const phoneInput = document.querySelector('input[type="tel"]');

    if (nameInput && !nameInput.value.trim()) {
        return { valid: false, message: 'Full name is required' };
    }
    if (emailInput) {
        if (!emailInput.value.trim()) {
            return { valid: false, message: 'Email address is required' };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
    }
    if (phoneInput && phoneInput.value.trim()) {
        if (!/^[\d\s\-\+\(\)]+$/.test(phoneInput.value)) {
            return { valid: false, message: 'Please enter a valid phone number' };
        }
    }

    const checkinInput  = document.querySelector('#checkIn');
    const checkoutInput = document.querySelector('#checkOut');
    if (checkinInput && checkoutInput && checkinInput.value && checkoutInput.value) {
        const checkin  = new Date(checkinInput.value);
        const checkout = new Date(checkoutInput.value);
        const today    = new Date(); today.setHours(0, 0, 0, 0);

        if (checkin < today) {
            return { valid: false, message: 'Check-in date cannot be in the past' };
        }
        if (checkout <= checkin) {
            return { valid: false, message: 'Check-out date must be after check-in date' };
        }
    }

    return { valid: true };
}

/**
 * validateGuestServiceForm
 * Used by the Guest Services form on the homepage.
 */
function validateGuestServiceForm(data) {
    if (!data.roomNumber || !data.roomNumber.trim()) {
        return { valid: false, message: 'Room number is required' };
    }
    if (!/^\d+$/.test(data.roomNumber.trim())) {
        return { valid: false, message: 'Please enter a valid room number (digits only)' };
    }
    if (!data.serviceType) {
        return { valid: false, message: 'Please select a service type' };
    }
    return { valid: true };
}


// ============================================================
//  Guest Services
// ============================================================
function initializeGuestServices() {
    const serviceForm        = document.getElementById('guestServiceForm');
    const serviceTypeSelect  = document.getElementById('serviceType');
    const laundryOptions     = document.getElementById('laundryOptions');
    const roomServiceOptions = document.getElementById('roomServiceOptions');

    if (serviceTypeSelect && laundryOptions && roomServiceOptions) {
        serviceTypeSelect.addEventListener('change', function () {
            laundryOptions.style.display     = this.value === 'laundry'      ? 'block' : 'none';
            roomServiceOptions.style.display = this.value === 'room-service' ? 'block' : 'none';
        });
    }

    if (!serviceForm) return;

    serviceForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const data       = Object.fromEntries(new FormData(this));
        const validation = validateGuestServiceForm(data);
        if (!validation.valid) {
            showNotification(validation.message, 'error');
            return;
        }

        const optionKey = data.serviceType === 'laundry' ? 'laundryOptions' : 'roomServiceOptions';
        const selectedOptions = [
            ...document.querySelectorAll(`input[name="${optionKey}"]:checked`)
        ].map(cb => cb.value);

        if (selectedOptions.length === 0) {
            showNotification('Please select at least one service option', 'error');
            return;
        }

        const submitBtn = this.querySelector('.submit-btn');
        const origText  = submitBtn.textContent;
        submitBtn.textContent = 'Submitting\u2026';
        submitBtn.disabled    = true;

        const requestData = {
            roomNumber:      data.roomNumber,
            serviceType:     data.serviceType,
            options:         selectedOptions,
            specialRequests: data.specialRequests || '',
            timestamp:       new Date().toISOString()
        };

        submitGuestServiceRequest(requestData)
            .then(res => {
                if (res.success) {
                    showNotification(res.message, 'success');
                    showServiceConfirmation(requestData);
                    this.reset();
                    if (laundryOptions)     laundryOptions.style.display     = 'none';
                    if (roomServiceOptions) roomServiceOptions.style.display = 'none';
                } else {
                    showNotification(res.message, 'error');
                }
            })
            .catch(() => showNotification('Failed to submit request. Please try again.', 'error'))
            .finally(() => {
                submitBtn.textContent = origText;
                submitBtn.disabled    = false;
            });
    });
}

async function submitGuestServiceRequest(requestData) {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Guest service request:', requestData);

        const existing = JSON.parse(localStorage.getItem('guestServiceRequests') || '[]');
        existing.push(requestData);
        localStorage.setItem('guestServiceRequests', JSON.stringify(existing));

        return {
            success: true,
            message: `Service request submitted for Room ${requestData.roomNumber}! We'll process it shortly.`
        };
    } catch {
        return { success: false, message: 'Failed to submit request. Please try again.' };
    }
}

function showServiceConfirmation() {
    const confirmation = document.getElementById('serviceConfirmation');
    if (!confirmation) return;
    confirmation.style.display = 'block';
    confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { confirmation.style.display = 'none'; }, 5000);
}


// ============================================================
//  Rooms page — dynamic card loader
// ============================================================
async function loadRooms() {
    const roomsGrid = document.querySelector('.rooms-grid');
    if (!roomsGrid) return;

    roomsGrid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading rooms\u2026</p></div>';

    try {
        const response = await fetch('/api/rooms/types');
        if (!response.ok) throw new Error('Network response was not ok');

        const roomTypes = await response.json();
        roomsGrid.innerHTML = '';
        roomTypes.forEach((room, i) => roomsGrid.appendChild(createRoomCard(room, i)));

        // Observe newly injected cards for scroll-reveal
        const cardObserver = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        roomsGrid.querySelectorAll('.room-card').forEach(card => {
            card.classList.add('scroll-reveal');
            cardObserver.observe(card);
        });

    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsGrid.innerHTML = '<div class="error-message">Failed to load rooms. Please try again later.</div>';
    }
}

/**
 * createRoomCard
 * Fixed: isPremium now correctly references the array length via a separate
 * parameter instead of the single room object (the original bug).
 */
function createRoomCard(room, index) {
    const amenities = Array.isArray(room.amenities) ? room.amenities : [];
    const isPremium = index === 0; // First item is the featured/premium room

    const card = document.createElement('div');
    card.className = `room-card${isPremium ? ' premium' : ''}`;
    card.innerHTML = `
        <div class="room-image">
            ${isPremium ? '<div class="room-badge">Premium</div>' : ''}
            <img src="${room.image_url}" alt="${room.name}" class="room-img" loading="lazy">
        </div>
        <div class="room-content">
            <h3>${room.name}</h3>
            <p>${room.description}</p>
            <div class="room-features">
                ${amenities.slice(0, 3).map(a => `<span>${a}</span>`).join('')}
            </div>
            <div class="room-price">
                <span class="price">\u20A6${Number(room.price_per_night).toLocaleString()}</span>
                <span class="price-unit">per night</span>
            </div>
            <div class="room-card-action">
                <a href="booking.html?type=${room.id}" class="cta-button primary">Book Now</a>
            </div>
        </div>
    `;
    return card;
}


// ============================================================
//  Admin logout function
// ============================================================
function handleLogout() {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffRefreshToken');
    localStorage.removeItem('staffUser');
    showNotification('Logged out successfully', 'info');
    
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    if (authSection) authSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
}

// ============================================================
//  Shared API service (available to booking.js and other modules)
// ============================================================
const apiService = {
    async bookRoom(bookingData) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Booking data:', bookingData);
            return { success: true, message: 'Booking successful!' };
        } catch {
            return { success: false, message: 'Booking failed. Please try again.' };
        }
    },

    async submitContactForm(formData) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Contact form data:', formData);
            return { success: true, message: 'Message sent successfully!' };
        } catch {
            return { success: false, message: 'Failed to send message. Please try again.' };
        }
    }
};