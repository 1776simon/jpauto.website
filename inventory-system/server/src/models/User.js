const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  oauthProvider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'oauth_provider'
  },
  oauthId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'oauth_id'
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'viewer',
    validate: {
      isIn: [['admin', 'manager', 'viewer']]
    }
  },
  avatarUrl: {
    type: DataTypes.TEXT,
    field: 'avatar_url'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = User;
