# Hotel7teen API

A Node.js API for managing hotel room bookings with Supabase backend.

## Features

- ✅ Room availability checking
- ✅ Booking creation with validation
- ✅ Guest management
- ✅ Real-time availability checks
- ✅ Input validation and error handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3000
```

3. Set up your Supabase database by running the SQL in `supabase_schema.sql`

4. Start the server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Bookings
- `POST /api/bookings/check-availability` - Check room availability
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get booking details

## Check Availability Request
```json
{
  "room_id": "uuid-of-room",
  "check_in_date": "2024-12-25",
  "check_out_date": "2024-12-28"
}
```

## Create Booking Request
```json
{
  "room_id": "uuid-of-room",
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "guest_phone": "+1234567890",
  "check_in_date": "2024-12-25",
  "check_out_date": "2024-12-28",
  "number_of_guests": 2,
  "special_requests": "Late check-in requested"
}
```

## Database Schema

The API uses the following main tables:
- `rooms` - Room information and pricing
- `bookings` - Booking records
- `guests` - Guest profiles
- `staff` - Staff management
- `staff_tasks` - Housekeeping tasks

## Availability Logic

The system checks room availability using the `check_room_availability` function which prevents double bookings by:
- Checking for existing confirmed/checked-in bookings
- Validating date overlaps
- Ensuring room capacity is not exceeded
- Preventing bookings in the past

## Error Handling

The API includes comprehensive error handling for:
- Missing required fields
- Invalid date ranges
- Room capacity limits
- Database connection issues
- Room availability conflicts
