const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Authentication middleware to verify JWT token from Supabase
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please authenticate to access this resource'
      });
    }

    // Attach user information to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to check if user is hotel staff
 */
const requireStaffRole = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    // Check if user exists in staff table
    const { data: staffMember, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', req.user.email)
      .eq('is_active', true)
      .single();

    if (error || !staffMember) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only hotel staff can access management features'
      });
    }

    // Attach staff information to request object
    req.staff = staffMember;
    next();
  } catch (error) {
    console.error('Staff role verification error:', error);
    return res.status(500).json({
      error: 'Role verification failed',
      message: 'Internal server error during role verification'
    });
  }
};

/**
 * Middleware to check if user has specific position/role
 */
const requirePosition = (allowedPositions) => {
  return async (req, res, next) => {
    try {
      if (!req.staff) {
        return res.status(403).json({
          error: 'Staff information required',
          message: 'Please authenticate as staff first'
        });
      }

      if (!allowedPositions.includes(req.staff.position)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This feature requires one of the following positions: ${allowedPositions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Position verification error:', error);
      return res.status(500).json({
        error: 'Position verification failed',
        message: 'Internal server error during position verification'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireStaffRole,
  requirePosition
};
