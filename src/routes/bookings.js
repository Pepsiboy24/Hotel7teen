const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Check room availability before booking
router.post('/check-availability', async (req, res) => {
  try {
    const { room_id, check_in_date, check_out_date } = req.body;

    // Validate input
    if (!room_id || !check_in_date || !check_out_date) {
      return res.status(400).json({
        error: 'Missing required fields: room_id, check_in_date, check_out_date'
      });
    }

    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    
    if (checkIn >= checkOut) {
      return res.status(400).json({
        error: 'Check-out date must be after check-in date'
      });
    }

    if (checkIn < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        error: 'Check-in date cannot be in the past'
      });
    }

    // Check room availability using the database function
    const { data: availability, error: availabilityError } = await supabase
      .rpc('check_room_availability', {
        p_room_id: room_id,
        p_check_in: check_in_date,
        p_check_out: check_out_date
      });

    if (availabilityError) {
      console.error('Availability check error:', availabilityError);
      return res.status(500).json({
        error: 'Failed to check room availability'
      });
    }

    // Get room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    // Calculate total amount
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const total_amount = parseFloat(room.price_per_night) * nights;

    res.json({
      available: availability,
      room: {
        id: room.id,
        room_number: room.room_number,
        room_type: room.room_type,
        price_per_night: room.price_per_night,
        capacity: room.capacity
      },
      booking_details: {
        check_in_date,
        check_out_date,
        nights,
        total_amount
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      room_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
      number_of_guests,
      special_requests
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'room_id', 'guest_name', 'check_in_date', 
      'check_out_date', 'number_of_guests'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    
    if (checkIn >= checkOut) {
      return res.status(400).json({
        error: 'Check-out date must be after check-in date'
      });
    }

    if (checkIn < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        error: 'Check-in date cannot be in the past'
      });
    }

    // Validate number of guests
    if (number_of_guests <= 0) {
      return res.status(400).json({
        error: 'Number of guests must be greater than 0'
      });
    }

    // Check room availability first
    const { data: isAvailable, error: availabilityError } = await supabase
      .rpc('check_room_availability', {
        p_room_id: room_id,
        p_check_in: check_in_date,
        p_check_out: check_out_date
      });

    if (availabilityError) {
      console.error('Availability check error:', availabilityError);
      return res.status(500).json({
        error: 'Failed to check room availability'
      });
    }

    if (!isAvailable) {
      return res.status(409).json({
        error: 'Room is not available for the selected dates'
      });
    }

    // Get room details for pricing
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('capacity, price_per_night')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    // Check if number of guests exceeds room capacity
    if (number_of_guests > room.capacity) {
      return res.status(400).json({
        error: `Number of guests exceeds room capacity of ${room.capacity}`
      });
    }

    // Calculate total amount
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const total_amount = parseFloat(room.price_per_night) * nights;

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        room_id,
        guest_name,
        guest_email: guest_email || null,
        guest_phone: guest_phone || null,
        check_in_date,
        check_out_date,
        number_of_guests,
        total_amount,
        special_requests: special_requests || null
      }])
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return res.status(500).json({
        error: 'Failed to create booking'
      });
    }

    // Update room status to 'Reserved'
    await supabase
      .from('rooms')
      .update({ status: 'Reserved' })
      .eq('id', room_id);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        room_id: booking.room_id,
        guest_name: booking.guest_name,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        number_of_guests: booking.number_of_guests,
        total_amount: booking.total_amount,
        status: booking.status,
        created_at: booking.created_at
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get booking details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          room_number,
          room_type,
          price_per_night
        )
      `)
      .eq('id', id)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    res.json(booking);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
