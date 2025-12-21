const { sendFinancingApplication, testEmailConnection } = require('../services/emailService');
const logger = require('../config/logger');

/**
 * Submit financing application
 * POST /api/financing/apply
 */
exports.submitApplication = async (req, res) => {
  try {
    const applicationData = req.body;

    // Basic validation
    if (!applicationData.firstName || !applicationData.lastName || !applicationData.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email'
      });
    }

    // Log the application submission (without sensitive data)
    logger.info(`Financing application received from: ${applicationData.firstName} ${applicationData.lastName} (${applicationData.email})`);

    // Send email
    await sendFinancingApplication(applicationData);

    // Return success response
    res.json({
      success: true,
      message: 'Your financing application has been submitted successfully. Our team will contact you within 1-2 business days.'
    });

  } catch (error) {
    logger.error('Error processing financing application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit financing application. Please try again or call us directly.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Test email connection
 * GET /api/financing/test-connection
 */
exports.testConnection = async (req, res) => {
  try {
    const result = await testEmailConnection();

    res.json(result);

  } catch (error) {
    logger.error('Error testing email connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email connection',
      details: error.message
    });
  }
};

/**
 * Test email configuration
 * GET /api/financing/test-email (admin only)
 */
exports.testEmail = async (req, res) => {
  try {
    const testData = {
      firstName: 'Test',
      lastName: 'Application',
      email: 'test@example.com',
      mobileNumber: '(555) 555-5555',
      ssn: '123-45-6789',
      driversLicense: 'TEST123',
      state: 'CA',
      birthDate: '1990-01-01',
      currentAddress: '123 Test St',
      currentCity: 'Sacramento',
      currentState: 'CA',
      currentZip: '95815',
      residenceStatus: 'Rent',
      monthlyPayment: '1500',
      yearsAtResidence: '2',
      monthsAtResidence: '6',
      companyName: 'Test Company',
      employerPhone: '(555) 555-5555',
      jobTitle: 'Test Job',
      yearsAtCompany: '1',
      monthsAtCompany: '3',
      grossMonthlyIncome: '5000',
      comments: 'This is a test financing application'
    };

    await sendFinancingApplication(testData);

    res.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    logger.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    });
  }
};
