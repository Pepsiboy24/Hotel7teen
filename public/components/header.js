export function createHeader() {
    return `
    <div class="contact-header">
        <div class="container">
            <div class="contact-info-bar">
                <div class="contact-left">
                    <span>📞 08064492295 | 08097002925</span>
                </div>
                <div class="contact-right">
                    <span>✉️ info@hotel17teen.com</span>
                </div>
            </div>
        </div>
    </div>
    <header class="luxury-header">
        <nav class="luxury-nav">
            <div class="logo">
                <h1>Hotel7teen</h1>
                <span class="tagline">Luxury Redefined</span>
            </div>
            <ul class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="rooms.html">Rooms</a></li>
                <li><a href="dining.html">Dining</a></li>
                <li><a href="index.html#wellness">Wellness</a></li>
                <li><a href="gallery.html">Gallery</a></li>
                <li><a href="index.html#guest-services">Guest Services</a></li>
                <li><a href="index.html#contact">Contact</a></li>
            </ul>
            <a href="booking.html" class="book-now-btn">Book Now</a>
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
    </header>`;
}

export function initializeHeader() {
    // Mobile menu toggle functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when any nav link is tapped on mobile
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
    
    // Active page indicator
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinksElements = document.querySelectorAll('.nav-links a');
    
    navLinksElements.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
    
    // Scroll effects
    let lastScroll = 0;
    const header = document.querySelector('.luxury-header');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (header) {
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        lastScroll = currentScroll;
    });
}