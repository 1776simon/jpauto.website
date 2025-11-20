const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PendingSubmission = sequelize.define('PendingSubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Submission metadata
  submissionStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']]
    },
    field: 'submission_status'
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'submitted_at'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    field: 'reviewed_at'
  },
  reviewedBy: {
    type: DataTypes.UUID,
    field: 'reviewed_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    field: 'rejection_reason'
  },
  // Customer information
  customerName: {
    type: DataTypes.STRING(255),
    field: 'customer_name'
  },
  customerEmail: {
    type: DataTypes.STRING(255),
    field: 'customer_email',
    validate: {
      isEmail: true
    }
  },
  customerPhone: {
    type: DataTypes.STRING(50),
    field: 'customer_phone'
  },
  // Vehicle basic information
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1900,
      max: new Date().getFullYear() + 2
    }
  },
  make: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  trim: {
    type: DataTypes.STRING(100)
  },
  vin: {
    type: DataTypes.STRING(17),
    unique: true,
    validate: {
      len: [17, 17]
    }
  },
  mileage: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  askingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'asking_price'
  },
  // Vehicle details
  exteriorColor: {
    type: DataTypes.STRING(100),
    field: 'exterior_color'
  },
  interiorColor: {
    type: DataTypes.STRING(100),
    field: 'interior_color'
  },
  transmission: {
    type: DataTypes.STRING(50)
  },
  engine: {
    type: DataTypes.STRING(100)
  },
  fuelType: {
    type: DataTypes.STRING(50),
    field: 'fuel_type'
  },
  drivetrain: {
    type: DataTypes.STRING(20)
  },
  bodyType: {
    type: DataTypes.STRING(50),
    field: 'body_type'
  },
  doors: {
    type: DataTypes.INTEGER
  },
  titleStatus: {
    type: DataTypes.STRING(50),
    field: 'title_status'
  },
  // Condition
  conditionRating: {
    type: DataTypes.INTEGER,
    field: 'condition_rating',
    validate: {
      min: 1,
      max: 5
    }
  },
  conditionNotes: {
    type: DataTypes.TEXT,
    field: 'condition_notes'
  },
  accidentHistory: {
    type: DataTypes.TEXT,
    field: 'accident_history'
  },
  serviceRecords: {
    type: DataTypes.TEXT,
    field: 'service_records'
  },
  // Images
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  primaryImageUrl: {
    type: DataTypes.TEXT,
    field: 'primary_image_url'
  },
  // Notes
  customerNotes: {
    type: DataTypes.TEXT,
    field: 'customer_notes'
  },
  internalNotes: {
    type: DataTypes.TEXT,
    field: 'internal_notes'
  }
}, {
  tableName: 'pending_submissions',
  timestamps: true,
  createdAt: 'submitted_at',
  updatedAt: 'updated_at'
});

module.exports = PendingSubmission;
