const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { authenticateToken, requireStaffRole, requirePosition } = require('../middleware/auth');

// Update room status
router.put('/rooms/:roomId/status', authenticateToken, requireStaffRole, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Available', 'Occupied', 'Maintenance', 'Reserved', 'Dirty'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    // Update room status
    const { data: updatedRoom, error: updateError } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single();

    if (updateError) {
      console.error('Room status update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update room status'
      });
    }

    res.json({
      message: 'Room status updated successfully',
      room: updatedRoom
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get daily arrival list
router.get('/arrivals', authenticateToken, requireStaffRole, async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get bookings for the specified date
    const { data: arrivals, error: arrivalsError } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          room_number,
          room_type,
          floor_number
        )
      `)
      .eq('check_in_date', targetDate)
      .in('status', ['Confirmed', 'Checked-in'])
      .order('check_in_date', { ascending: true });

    if (arrivalsError) {
      console.error('Arrivals fetch error:', arrivalsError);
      return res.status(500).json({
        error: 'Failed to fetch arrival list'
      });
    }

    // Format the response
    const formattedArrivals = arrivals.map(booking => ({
      booking_id: booking.id,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      guest_phone: booking.guest_phone,
      room: {
        id: booking.room_id,
        number: booking.rooms.room_number,
        type: booking.rooms.room_type,
        floor: booking.rooms.floor_number
      },
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      number_of_guests: booking.number_of_guests,
      total_amount: booking.total_amount,
      status: booking.status,
      special_requests: booking.special_requests,
      created_at: booking.created_at
    }));

    res.json({
      date: targetDate,
      total_arrivals: formattedArrivals.length,
      arrivals: formattedArrivals
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all rooms with current status
router.get('/rooms', authenticateToken, requireStaffRole, async (req, res) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select(`
        *,
        bookings (
          id,
          guest_name,
          check_in_date,
          check_out_date,
          status
        )
      `)
      .order('floor_number', { ascending: true })
      .order('room_number', { ascending: true });

    if (error) {
      console.error('Rooms fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch rooms'
      });
    }

    // Format rooms with current booking info
    const formattedRooms = rooms.map(room => ({
      id: room.id,
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: room.price_per_night,
      capacity: room.capacity,
      status: room.status,
      floor_number: room.floor_number,
      description: room.description,
      amenities: room.amenities,
      current_booking: room.bookings.find(booking => 
        booking.status === 'Checked-in' || 
        (booking.status === 'Confirmed' && 
         new Date() >= new Date(booking.check_in_date) && 
         new Date() <= new Date(booking.check_out_date))
      ) || null,
      updated_at: room.updated_at
    }));

    res.json({
      total_rooms: formattedRooms.length,
      rooms: formattedRooms
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
