class BookingForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.selectedRoom = null;
        this.bookingData = {
            checkIn: '',
            checkOut: '',
            roomType: '',
            room: null,
            guestInfo: {}
        };
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadRoomTypes();
        this.setMinDates();
    }

    initializeElements() {
        // Progress elements
        this.progressSteps = document.querySelectorAll('.progress-step');
        
        // Form steps
        this.formSteps = document.querySelectorAll('.form-step');
        
        // Navigation buttons
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        
        // Step 1 elements
        this.checkInInput = document.getElementById('checkIn');
        this.checkOutInput = document.getElementById('checkOut');
        this.roomTypeSelect = document.getElementById('roomType');
        
        // Step 2 elements
        this.roomsContainer = document.getElementById('roomsContainer');
        this.roomsLoading = document.getElementById('roomsLoading');
        this.noRooms = document.getElementById('noRooms');
        
        // Step 3 elements
        this.bookingSummary = document.getElementById('bookingSummary');
        this.firstNameInput = document.getElementById('firstName');
        this.lastNameInput = document.getElementById('lastName');
        this.emailInput = document.getElementById('email');
        this.phoneInput = document.getElementById('phone');
        this.guestsSelect = document.getElementById('guests');
        this.specialRequestsInput = document.getElementById('specialRequests');
    }

    attachEventListeners() {
        this.prevBtn.addEventListener('click', () => this.previousStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        
        // Date change listeners
        this.checkInInput.addEventListener('change', () => this.validateDates());
        this.checkOutInput.addEventListener('change', () => this.validateDates());
        
        // Room type change listener
        this.roomTypeSelect.addEventListener('change', () => this.validateStep1());
    }

    setMinDates() {
        const today = new Date().toISOString().split('T')[0];
        this.checkInInput.min = today;
        this.checkOutInput.min = today;
        
        this.checkInInput.addEventListener('change', () => {
            const checkInDate = new Date(this.checkInInput.value);
            const minCheckOut = new Date(checkInDate);
            minCheckOut.setDate(minCheckOut.getDate() + 1);
            this.checkOutInput.min = minCheckOut.toISOString().split('T')[0];
            
            if (this.checkOutInput.value && this.checkOutInput.value <= this.checkInInput.value) {
                this.checkOutInput.value = minCheckOut.toISOString().split('T')[0];
            }
        });
    }

    async loadRoomTypes() {
        try {
            const response = await fetch('http://localhost:3000/api/rooms/types');
            const data = await response.json();
            
            if (response.ok) {
                this.roomTypeSelect.innerHTML = '<option value="">All Room Types</option>';
                data.room_types.forEach(roomType => {
                    const option = document.createElement('option');
                    option.value = roomType.type;
                    option.textContent = `${roomType.type} - $${roomType.price_per_night}/night`;
                    this.roomTypeSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading room types:', error);
        }
    }

    validateDates() {
        const checkIn = this.checkInInput.value;
        const checkOut = this.checkOutInput.value;
        
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            
            if (checkInDate >= checkOutDate) {
                this.showError('Check-out date must be after check-in date');
                return false;
            }
            
            if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
                this.showError('Check-in date cannot be in the past');
                return false;
            }
        }
        
        return this.validateStep1();
    }

    validateStep1() {
        const checkIn = this.checkInInput.value;
        const checkOut = this.checkOutInput.value;
        
        if (!checkIn || !checkOut) {
            this.nextBtn.disabled = true;
            return false;
        }
        
        this.nextBtn.disabled = false;
        return true;
    }

    async loadAvailableRooms() {
        this.roomsLoading.style.display = 'block';
        this.roomsContainer.innerHTML = '';
        this.noRooms.style.display = 'none';
        
        try {
            const params = new URLSearchParams({
                check_in: this.bookingData.checkIn,
                check_out: this.bookingData.checkOut
            });
            
            if (this.bookingData.roomType) {
                params.append('room_type', this.bookingData.roomType);
            }
            
            const response = await fetch(`http://localhost:3000/api/rooms/available?${params}`);
            const data = await response.json();
            
            this.roomsLoading.style.display = 'none';
            
            if (response.ok && data.available_rooms.length > 0) {
                this.displayRooms(data.available_rooms);
                this.nextBtn.disabled = true; // Disable until room is selected
            } else {
                this.noRooms.style.display = 'block';
                this.nextBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error loading available rooms:', error);
            this.roomsLoading.style.display = 'none';
            this.showError('Failed to load available rooms. Please try again.');
        }
    }

    displayRooms(rooms) {
        this.roomsContainer.innerHTML = '';
        
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.dataset.roomId = room.id;
            
            const amenities = Array.isArray(room.amenities) 
                ? room.amenities 
                : (room.amenities ? JSON.parse(room.amenities) : []);
            
            roomCard.innerHTML = `
                <div class="room-card-header">
                    <div>
                        <div class="room-type">${room.room_type}</div>
                        <div style="color: #6c757d; font-size: 0.9rem;">Room ${room.room_number} • Floor ${room.floor_number}</div>
                    </div>
                    <div class="room-price">$${room.price_per_night}/night</div>
                </div>
                <div class="room-details">
                    <span>🛏️ ${room.capacity} Guests</span>
                    <span>📍 Floor ${room.floor_number}</span>
                </div>
                ${room.description ? `<p style="color: #6c757d; margin-bottom: 1rem;">${room.description}</p>` : ''}
                <div class="room-amenities">
                    ${amenities.slice(0, 5).map(amenity => 
                        `<span class="amenity-tag">${amenity}</span>`
                    ).join('')}
                    ${amenities.length > 5 ? `<span class="amenity-tag">+${amenities.length - 5} more</span>` : ''}
                </div>
            `;
            
            roomCard.addEventListener('click', () => this.selectRoom(room, roomCard));
            this.roomsContainer.appendChild(roomCard);
        });
    }

    selectRoom(room, cardElement) {
        // Remove previous selection
        document.querySelectorAll('.room-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        cardElement.classList.add('selected');
        
        // Store selected room
        this.selectedRoom = room;
        this.bookingData.room = room;
        
        // Enable next button
        this.nextBtn.disabled = false;
    }

    updateBookingSummary() {
        if (!this.selectedRoom) return;
        
        const nights = this.calculateNights(this.bookingData.checkIn, this.bookingData.checkOut);
        const totalAmount = this.selectedRoom.price_per_night * nights;
        
        this.bookingSummary.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: #212529;">Booking Summary</h3>
            <div class="summary-row">
                <span>Room:</span>
                <span><strong>${this.selectedRoom.room_type} - Room ${this.selectedRoom.room_number}</strong></span>
            </div>
            <div class="summary-row">
                <span>Check-in:</span>
                <span>${this.formatDate(this.bookingData.checkIn)}</span>
            </div>
            <div class="summary-row">
                <span>Check-out:</span>
                <span>${this.formatDate(this.bookingData.checkOut)}</span>
            </div>
            <div class="summary-row">
                <span>Nights:</span>
                <span>${nights}</span>
            </div>
            <div class="summary-row">
                <span>Rate:</span>
                <span>$${this.selectedRoom.price_per_night}/night</span>
            </div>
            <div class="summary-row total">
                <span>Total Amount:</span>
                <span style="color: #d4af37;">$${totalAmount.toFixed(2)}</span>
            </div>
        `;
    }

    calculateNights(checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    validateStep3() {
        const firstName = this.firstNameInput.value.trim();
        const lastName = this.lastNameInput.value.trim();
        const email = this.emailInput.value.trim();
        const phone = this.phoneInput.value.trim();
        const guests = this.guestsSelect.value;
        
        if (!firstName || !lastName || !email || !phone || !guests) {
            this.showError('Please fill in all required fields');
            return false;
        }
        
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }
        
        if (this.selectedRoom && parseInt(guests) > this.selectedRoom.capacity) {
            this.showError(`Number of guests cannot exceed room capacity of ${this.selectedRoom.capacity}`);
            return false;
        }
        
        return true;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    async submitBooking() {
        if (!this.validateStep3()) return;
        
        const bookingData = {
            room_id: this.selectedRoom.id,
            guest_name: `${this.firstNameInput.value.trim()} ${this.lastNameInput.value.trim()}`,
            guest_email: this.emailInput.value.trim(),
            guest_phone: this.phoneInput.value.trim(),
            check_in_date: this.bookingData.checkIn,
            check_out_date: this.bookingData.checkOut,
            number_of_guests: parseInt(this.guestsSelect.value),
            special_requests: this.specialRequestsInput.value.trim() || null
        };
        
        try {
            this.nextBtn.disabled = true;
            this.nextBtn.textContent = 'Processing...';
            
            const response = await fetch('http://localhost:3000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('Booking confirmed! Your reservation has been successfully created.');
                setTimeout(() => {
                    window.location.href = '/index.html#booking-success';
                }, 3000);
            } else {
                this.showError(data.error || 'Failed to create booking. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            this.showError('An error occurred while processing your booking. Please try again.');
        } finally {
            this.nextBtn.disabled = false;
            this.nextBtn.textContent = 'Confirm Booking';
        }
    }

    updateProgressBar() {
        this.progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    showStep(stepNumber) {
        this.formSteps.forEach(step => {
            step.classList.remove('active');
        });
        
        document.getElementById(`step${stepNumber}`).classList.add('active');
        
        // Update navigation buttons
        this.prevBtn.style.display = stepNumber === 1 ? 'none' : 'block';
        
        if (stepNumber === this.totalSteps) {
            this.nextBtn.textContent = 'Confirm Booking';
            this.updateBookingSummary();
        } else {
            this.nextBtn.textContent = 'Next';
        }
        
        this.updateProgressBar();
    }

    async nextStep() {
        if (this.currentStep === 1) {
            if (!this.validateDates()) return;
            
            this.bookingData.checkIn = this.checkInInput.value;
            this.bookingData.checkOut = this.checkOutInput.value;
            this.bookingData.roomType = this.roomTypeSelect.value;
            
            await this.loadAvailableRooms();
        } else if (this.currentStep === 2) {
            if (!this.selectedRoom) {
                this.showError('Please select a room');
                return;
            }
        } else if (this.currentStep === 3) {
            await this.submitBooking();
            return;
        }
        
        this.currentStep++;
        this.showStep(this.currentStep);
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    showError(message) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const activeStep = document.querySelector('.form-step.active');
        activeStep.insertBefore(errorDiv, activeStep.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const activeStep = document.querySelector('.form-step.active');
        activeStep.insertBefore(successDiv, activeStep.firstChild);
    }
}

// Initialize the booking form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookingForm();
});
