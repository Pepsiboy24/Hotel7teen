const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

/**
 * Staff login endpoint
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Check if user is staff and active
    const { data: staffMember, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (staffError || !staffMember) {
      // Sign out the user if they're not staff
      await supabase.auth.signOut();
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only active hotel staff can access the management system'
      });
    }

    // Update staff record with auth user ID if not already set
    if (!staffMember.auth_user_id) {
      await supabase
        .from('staff')
        .update({ auth_user_id: authData.user.id })
        .eq('id', staffMember.id);
    }

    res.json({
      message: 'Login successful',
      user: {
        id: staffMember.id,
        email: staffMember.email,
        first_name: staffMember.first_name,
        last_name: staffMember.last_name,
        position: staffMember.position,
        is_active: staffMember.is_active
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
});

/**
 * Staff logout endpoint
 * POST /api/auth/logout
 * Requires Bearer token
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7);

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        error: 'Logout failed',
        message: 'Failed to sign out from authentication service'
      });
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Internal server error during logout'
    });
  }
});

/**
 * Get current user info
 * GET /api/auth/me
 * Requires Bearer token
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please authenticate to access this resource'
      });
    }

    // Get staff information
    const { data: staffMember, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();

    if (staffError || !staffMember) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Staff information not found or inactive'
      });
    }

    res.json({
      user: {
        id: staffMember.id,
        email: staffMember.email,
        first_name: staffMember.first_name,
        last_name: staffMember.last_name,
        position: staffMember.position,
        is_active: staffMember.is_active,
        hire_date: staffMember.hire_date
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
      message: 'Internal server error'
    });
  }
});

/**
 * Register new staff member
 * POST /api/auth/register
 * Body: { email, password, first_name, last_name, position }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, position } = req.body;

    // Validate input
    if (!email || !password || !first_name || !last_name || !position) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All fields are required'
      });
    }

    // Check if staff member already exists
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('email')
      .eq('email', email)
      .single();

    if (existingStaff) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A staff member with this email already exists'
      });
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({
        error: 'Authentication failed',
        message: authError.message || 'Failed to create auth user'
      });
    }

    // Create staff record
    const { data: staffData, error: staffError } = await supabase
  .from('staff')
  .insert([{
    auth_user_id: authData.user.id,
    first_name,
    last_name,
    email,
    position: 'Front Desk', // Or whatever default you want
    hire_date: new Date().toISOString().split('T')[0] // Adds current date (YYYY-MM-DD)
  }])
      .select()
      .single();

    if (staffError) {
      // Rollback: delete the auth user if staff creation fails
      // await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: 'Staff creation failed',
        message: 'Failed to create staff record'
      });
    }

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: staffData.id,
        email: staffData.email,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        position: staffData.position
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 * Body: { refresh_token }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'Invalid or expired refresh token'
      });
    }

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error during token refresh'
    });
  }
});

module.exports = router;
