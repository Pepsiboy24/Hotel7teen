-- Hotel7teen Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rooms table
CREATE TABLE rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('Standard', 'Deluxe', 'Suite', 'Presidential')),
    price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Reserved', 'Dirty')),
    floor_number INTEGER NOT NULL CHECK (floor_number > 0),
    description TEXT,
    amenities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(100),
    guest_phone VARCHAR(20),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Checked-in', 'Checked-out', 'Cancelled')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure check_out_date is after check_in_date
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Create staff table
CREATE TABLE staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(50) NOT NULL CHECK (position IN ('Housekeeping', 'Front Desk', 'Manager', 'Maintenance')),
    is_active BOOLEAN DEFAULT true,
    hire_date DATE NOT NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_tasks table for housekeeping management
CREATE TABLE staff_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('Cleaning', 'Maintenance', 'Inspection', 'Restock', 'Deep Clean')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guests table for better guest management
CREATE TABLE guests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    id_document_type VARCHAR(20) CHECK (id_document_type IN ('Passport', 'Driver License', 'National ID')),
    id_document_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update bookings table to reference guests
ALTER TABLE bookings 
ADD COLUMN guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;

-- Create indexes for performance optimization
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_staff_tasks_room_id ON staff_tasks(room_id);
CREATE INDEX idx_staff_tasks_assigned_to ON staff_tasks(assigned_to);
CREATE INDEX idx_staff_tasks_status ON staff_tasks(status);
CREATE INDEX idx_staff_tasks_due_date ON staff_tasks(due_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_tasks_updated_at BEFORE UPDATE ON staff_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust according to your authentication needs)
-- Allow public read access to rooms
CREATE POLICY "Rooms are viewable by everyone" ON rooms
    FOR SELECT USING (true);

-- Allow authenticated users to manage bookings
CREATE POLICY "Users can manage their bookings" ON bookings
    FOR ALL USING (auth.uid()::text = guest_id::text);

-- Allow staff to manage tasks
CREATE POLICY "Staff can manage assigned tasks" ON staff_tasks
    FOR ALL USING (assigned_to IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- Allow authenticated staff to view staff information
CREATE POLICY "Staff can view staff information" ON staff
    FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM staff WHERE is_active = true));

-- Allow managers to update staff information
CREATE POLICY "Managers can update staff" ON staff
    FOR UPDATE USING (
        auth.uid() IN (SELECT auth_user_id FROM staff WHERE position = 'Manager' AND is_active = true)
    );

-- Insert sample data for testing
INSERT INTO rooms (room_number, room_type, price_per_night, capacity, floor_number, description, amenities) VALUES
('101', 'Standard', 99.99, 2, 1, 'Comfortable standard room with city view', '["WiFi", "TV", "Air Conditioning", "Mini Bar"]'),
('102', 'Standard', 99.99, 2, 1, 'Comfortable standard room with garden view', '["WiFi", "TV", "Air Conditioning", "Mini Bar"]'),
('201', 'Deluxe', 149.99, 2, 2, 'Spacious deluxe room with balcony', '["WiFi", "TV", "Air Conditioning", "Mini Bar", "Balcony", "Coffee Machine"]'),
('301', 'Suite', 249.99, 4, 3, 'Luxury suite with separate living area', '["WiFi", "TV", "Air Conditioning", "Mini Bar", "Balcony", "Coffee Machine", "Living Room", "Jacuzzi"]'),
('401', 'Presidential', 499.99, 6, 4, 'Ultimate luxury presidential suite', '["WiFi", "TV", "Air Conditioning", "Mini Bar", "Balcony", "Coffee Machine", "Living Room", "Jacuzzi", "Kitchen", "Butler Service"]');

INSERT INTO staff (first_name, last_name, email, phone, position, hire_date) VALUES
('John', 'Smith', 'john.smith@hotel7teen.com', '+1234567890', 'Housekeeping', '2023-01-15'),
('Sarah', 'Johnson', 'sarah.johnson@hotel7teen.com', '+1234567891', 'Front Desk', '2023-02-20'),
('Mike', 'Wilson', 'mike.wilson@hotel7teen.com', '+1234567892', 'Manager', '2022-11-10'),
('Emily', 'Brown', 'emily.brown@hotel7teen.com', '+1234567893', 'Maintenance', '2023-03-05');

-- Create a view for room availability
CREATE VIEW room_availability AS
SELECT 
    r.id,
    r.room_number,
    r.room_type,
    r.price_per_night,
    r.capacity,
    r.status,
    CASE 
        WHEN b.id IS NOT NULL THEN 'Occupied'
        ELSE r.status
    END as current_status,
    CASE 
        WHEN b.id IS NOT NULL THEN b.check_out_date
        ELSE NULL
    END as available_from
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id 
    AND b.status IN ('Confirmed', 'Checked-in')
    AND CURRENT_DATE BETWEEN b.check_in_date AND b.check_out_date;

-- Create a function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
    p_room_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    booking_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM bookings 
        WHERE room_id = p_room_id 
        AND status IN ('Confirmed', 'Checked-in')
        AND (
            (p_check_in BETWEEN check_in_date AND check_out_date) OR
            (p_check_out BETWEEN check_in_date AND check_out_date) OR
            (check_in_date BETWEEN p_check_in AND p_check_out)
        )
    ) INTO booking_exists;
    
    RETURN NOT booking_exists;
END;
$$ LANGUAGE plpgsql;
