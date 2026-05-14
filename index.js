require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./src/routes/bookings');
const managementRoutes = require('./src/routes/management');
const authRoutes = require('./src/routes/auth');
const roomsRoutes = require('./src/routes/rooms');

const app = express();
const PORT = process.env.PORT || 3000 || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets from public folder
app.use(express.static('public'));

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

// Page routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/rooms', (req, res) => {
  res.sendFile(__dirname + '/public/rooms.html');
});

app.get('/booking', (req, res) => {
  res.sendFile(__dirname + '/public/booking.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
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
