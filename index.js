require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./src/routes/bookings');
const managementRoutes = require('./src/routes/management');
const authRoutes = require('./src/routes/auth');
const roomsRoutes = require('./src/routes/rooms');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/rooms', roomsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Hotel7teen API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hotel7teen API',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        getCurrentUser: 'GET /api/auth/me',
        refreshToken: 'POST /api/auth/refresh'
      },
      bookings: {
        checkAvailability: 'POST /api/bookings/check-availability',
        createBooking: 'POST /api/bookings',
        getBooking: 'GET /api/bookings/:id'
      },
      rooms: {
        getRoomTypes: 'GET /api/rooms/types',
        getAvailableRooms: 'GET /api/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&room_type=Standard',
        getRoomDetails: 'GET /api/rooms/:id'
      },
      management: {
        updateRoomStatus: 'PUT /api/management/rooms/:roomId/status',
        getDailyArrivals: 'GET /api/management/arrivals?date=YYYY-MM-DD',
        getAllRooms: 'GET /api/management/rooms'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🏨 Hotel7teen API server running on port ${PORT}`);
  console.log(`📖 API documentation available at http://localhost:${PORT}`);
});
