const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Get all available room types with pricing
router.get('/types', async (req, res) => {
  try {
    const { data: roomTypes, error } = await supabase
      .from('room_types')
      .select(`
        id,
        name,
        description,
        price_per_night,
        image_url,
        capacity,
        amenities
      `)
      .order('price_per_night', { ascending: true });

    if (error) {
      console.error('Room types fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch room types'
      });
    }

    res.json(roomTypes);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get available rooms for specific dates
router.get('/available', async (req, res) => {
  try {
    const { check_in, check_out, room_type } = req.query;

    // Validate required parameters
    if (!check_in || !check_out) {
      return res.status(400).json({
        error: 'Missing required parameters: check_in, check_out'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(check_in) || !dateRegex.test(check_out)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        error: 'Check-out date must be after check-in date'
      });
    }

    if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        error: 'Check-in date cannot be in the past'
      });
    }

    // Build query
    let query = supabase
      .from('rooms')
      .select(`
        id,
        room_number,
        room_type,
        price_per_night,
        capacity,
        floor_number,
        description,
        amenities,
        status
      `)
      .eq('status', 'Available');

    if (room_type) {
      query = query.eq('room_type', room_type);
    }

    const { data: rooms, error: roomsError } = await query;

    if (roomsError) {
      console.error('Available rooms fetch error:', roomsError);
      return res.status(500).json({
        error: 'Failed to fetch available rooms'
      });
    }

    // Check availability for each room
    const availableRooms = [];
    for (const room of rooms) {
      const { data: isAvailable, error: availabilityError } = await supabase
        .rpc('check_room_availability', {
          p_room_id: room.id,
          p_check_in: check_in,
          p_check_out: check_out
        });

      if (!availabilityError && isAvailable) {
        availableRooms.push(room);
      }
    }

    res.json({
      check_in,
      check_out,
      room_type: room_type || 'all',
      available_rooms: availableRooms,
      total_available: availableRooms.length
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get specific room details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: room, error } = await supabase
      .from('rooms')
      .select(`
        *,
        bookings (
          id,
          check_in_date,
          check_out_date,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error || !room) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    res.json(room);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
