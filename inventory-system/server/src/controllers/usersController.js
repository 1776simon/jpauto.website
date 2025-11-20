const { User } = require('../models');

/**
 * Get all users
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['oauthId'] } // Don't expose OAuth ID
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['oauthId'] }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
};

/**
 * Get current user profile
 * GET /api/users/me
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['oauthId'] }
    });

    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
};

/**
 * Update user role (admin only)
 * PUT /api/users/:id/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Don't allow changing own role
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot change your own role'
      });
    }

    await user.update({ role });

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      message: error.message
    });
  }
};

/**
 * Deactivate user (admin only)
 * POST /api/users/:id/deactivate
 */
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Don't allow deactivating self
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot deactivate your own account'
      });
    }

    await user.update({ isActive: false });

    res.json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      error: 'Failed to deactivate user',
      message: error.message
    });
  }
};

/**
 * Activate user (admin only)
 * POST /api/users/:id/activate
 */
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    await user.update({ isActive: true });

    res.json({
      message: 'User activated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({
      error: 'Failed to activate user',
      message: error.message
    });
  }
};

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Don't allow deleting self
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser
};
