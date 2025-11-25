const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Inventory status
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'available',
    validate: {
      isIn: [['available', 'sold', 'pending', 'hold']]
    }
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
    allowNull: false,
    unique: true,
    validate: {
      len: [17, 17]
    }
  },
  stockNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    field: 'stock_number'
  },
  // Pricing
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  msrp: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  // Vehicle details
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
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
    defaultValue: 'Clean',
    field: 'title_status'
  },
  // Performance
  mpgCity: {
    type: DataTypes.INTEGER,
    field: 'mpg_city'
  },
  mpgHighway: {
    type: DataTypes.INTEGER,
    field: 'mpg_highway'
  },
  horsepower: {
    type: DataTypes.INTEGER
  },
  // Features (JSON array)
  features: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Images (JSON array of URLs)
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  primaryImageUrl: {
    type: DataTypes.TEXT,
    field: 'primary_image_url'
  },
  latestPhotoModified: {
    type: DataTypes.DATE,
    field: 'latest_photo_modified',
    comment: 'Timestamp of when vehicle photos were last modified'
  },
  // History
  previousOwners: {
    type: DataTypes.INTEGER,
    field: 'previous_owners'
  },
  accidentHistory: {
    type: DataTypes.TEXT,
    field: 'accident_history'
  },
  serviceRecords: {
    type: DataTypes.TEXT,
    field: 'service_records'
  },
  carfaxAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'carfax_available'
  },
  carfaxUrl: {
    type: DataTypes.TEXT,
    field: 'carfax_url'
  },
  // Warranty
  warrantyDescription: {
    type: DataTypes.TEXT,
    field: 'warranty_description'
  },
  // Description
  description: {
    type: DataTypes.TEXT
  },
  marketingTitle: {
    type: DataTypes.STRING(255),
    field: 'marketing_title'
  },
  // Export tracking
  exportedToJekyll: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'exported_to_jekyll'
  },
  exportedToJekyllAt: {
    type: DataTypes.DATE,
    field: 'exported_to_jekyll_at'
  },
  exportedToDealerCenter: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'exported_to_dealer_center'
  },
  exportedToDealerCenterAt: {
    type: DataTypes.DATE,
    field: 'exported_to_dealer_center_at'
  },
  exportedToAutotrader: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'exported_to_autotrader'
  },
  exportedToAutotraderAt: {
    type: DataTypes.DATE,
    field: 'exported_to_autotrader_at'
  },
  exportedToCargurus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'exported_to_cargurus'
  },
  exportedToCargurusAt: {
    type: DataTypes.DATE,
    field: 'exported_to_cargurus_at'
  },
  exportedToFacebook: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'exported_to_facebook'
  },
  exportedToFacebookAt: {
    type: DataTypes.DATE,
    field: 'exported_to_facebook_at'
  },
  // Metadata
  source: {
    type: DataTypes.STRING(50)
  },
  sourceSubmissionId: {
    type: DataTypes.UUID,
    field: 'source_submission_id',
    references: {
      model: 'pending_submissions',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    field: 'updated_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  dateAdded: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    field: 'date_added'
  },
  soldDate: {
    type: DataTypes.DATEONLY,
    field: 'sold_date'
  }
}, {
  tableName: 'inventory',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Inventory;
