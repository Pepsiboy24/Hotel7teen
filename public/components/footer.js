export function createFooter() {
    return `
    <footer class="luxury-footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Hotel7teen</h3>
                    <p>Luxury Redefined</p>
                    <div class="social-links">
                        <a href="#" aria-label="Facebook">📘</a>
                        <a href="#" aria-label="Instagram">📷</a>
                        <a href="#" aria-label="Twitter">🐦</a>
                        <a href="#" aria-label="LinkedIn">💼</a>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="about.html">About Us</a></li>
                        <li><a href="rooms.html">Rooms</a></li>
                        <li><a href="dining.html">Dining</a></li>
                        <li><a href="index.html#wellness">Wellness</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Services</h4>
                    <ul>
                        <li><a href="#">Concierge</a></li>
                        <li><a href="#">Room Service</a></li>
                        <li><a href="#">Spa Booking</a></li>
                        <li><a href="#">Event Planning</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <p>+1 (555) 123-4567<br>reservations@hotel7teen.com</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Hotel7teen. All rights reserved. | Privacy Policy | Terms of Service</p>
            </div>
        </div>
    </footer>`;
}

export function initializeFooter() {
    // Add any footer-specific JavaScript functionality here
    // For example: newsletter signup, social media links, etc.
    
    const socialLinks = document.querySelectorAll('.social-links a');
    socialLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Add social media tracking or custom behavior if needed
            console.log('Social link clicked:', link.getAttribute('aria-label'));
        });
    });
}
