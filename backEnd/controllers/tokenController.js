const jwt = require('jsonwebtoken');
const pool = require('../db/database');

// Refresh token controller
exports.refreshToken = async (req, res) => {
  try {
    // Get token from request
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }
    
    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // If token is expired, we'll still try to refresh it if it's not too old
      if (error.name === 'TokenExpiredError') {
        try {
          // Decode without verification to get user ID
          decoded = jwt.decode(token);
          
          // Check when token expired
          const expiredAt = new Date(decoded.exp * 1000);
          const now = new Date();
          const hoursSinceExpiry = (now - expiredAt) / (1000 * 60 * 60);
          
          // If token expired more than 24 hours ago, reject refresh
          if (hoursSinceExpiry > 24) {
            return res.status(401).json({ 
              success: false, 
              message: 'Token expired too long ago, please login again' 
            });
          }
        } catch (err) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid token, please login again' 
          });
        }
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token, please login again' 
        });
      }
    }
    
    // Check if user exists and is active
    const [users] = await pool.query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }
    
    const user = users[0];
    
    // Generate new token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return new token
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during token refresh',
      error: error.message 
    });
  }
};
