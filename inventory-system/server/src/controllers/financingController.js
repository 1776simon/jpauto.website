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
      // Main applicant - Personal
      firstName: 'John',
      middleInitial: 'A',
      lastName: 'Testman',
      suffix: 'Jr',
      email: 'test@example.com',
      mobileNumber: '(916) 555-1234',
      ssn: '123-45-6789',
      birthDate: '1990-03-15',
      driversLicense: 'D1234567',
      state: 'CA',
      dlIssueDate: '2018-06-01',
      dlExpirationDate: '2026-06-01',

      // Main applicant - Current Residence
      currentAddress: '123 Maple Street',
      currentApt: 'Apt 4B',
      currentCity: 'Sacramento',
      currentState: 'CA',
      currentZip: '95814',
      residenceStatus: 'Rent',
      monthlyPayment: '1800',
      yearsAtResidence: '1',
      monthsAtResidence: '6',

      // Main applicant - Previous Residence (< 2 yrs at current)
      previousAddress: '456 Oak Avenue',
      previousCity: 'Roseville',
      previousState: 'CA',
      previousZip: '95661',
      yearsAtPreviousResidence: '2',
      monthsAtPreviousResidence: '3',

      // Main applicant - Current Employment
      companyName: 'Acme Corporation',
      employerPhone: '(916) 555-9876',
      jobTitle: 'Software Engineer',
      grossMonthlyIncome: '7500',
      yearsAtCompany: '1',
      monthsAtCompany: '8',

      // Main applicant - Previous Employment (< 2 yrs at current)
      previousCompanyName: 'Old Corp Inc',
      previousEmployerPhone: '(916) 555-4321',
      previousJobTitle: 'Junior Developer',
      yearsAtPreviousCompany: '3',

      // Co-applicant
      hasCoApplicant: 'true',
      coFirstName: 'Jane',
      coMiddleInitial: 'B',
      coLastName: 'Testwoman',
      coSuffix: '',
      coMobileNumber: '(916) 555-5678',
      coEmail: 'co-test@example.com',
      coSsn: '987-65-4321',
      coBirthDate: '1992-07-20',
      coDriversLicense: 'D7654321',
      coState: 'CA',
      coDlIssueDate: '2019-09-15',
      coDlExpirationDate: '2027-09-15',
      coCurrentAddress: '789 Pine Road',
      coCurrentCity: 'Elk Grove',
      coCurrentState: 'CA',
      coCurrentZip: '95758',
      coCompanyName: 'Beta Industries',
      coJobTitle: 'Marketing Manager',
      coGrossMonthlyIncome: '6000',
      coYearsAtCompany: '4',
      coMonthsAtCompany: '2',

      // Vehicle
      selectedVehicle: {
        year: 2022,
        make: 'Toyota',
        model: 'Camry',
        vin: '4T1BF1FK5CU123456',
        price: 24500,
        mileage: 32000
      },
      downPayment: '3000',

      comments: 'This is a full test financing application covering all fields.'
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
