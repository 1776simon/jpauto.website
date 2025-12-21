const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create email transporter
// For production, use your business email SMTP settings
const createTransporter = () => {
  // Using Gmail as example - replace with your business email provider
  // For Gmail, you need to:
  // 1. Enable 2-factor authentication
  // 2. Create an "App Password" at https://myaccount.google.com/apppasswords

  return nodemailer.createTransporter({
    service: 'gmail', // or 'smtp.office365.com' for Outlook, etc.
    auth: {
      user: process.env.EMAIL_USER || 'jpautomotivegroupllc@gmail.com',
      pass: process.env.EMAIL_PASSWORD // Store this in .env file!
    }
  });
};

/**
 * Send financing application email
 * @param {Object} applicationData - The financing application data
 */
async function sendFinancingApplication(applicationData) {
  try {
    const transporter = createTransporter();

    // Format the email content
    const emailHtml = formatFinancingEmail(applicationData);
    const emailText = formatFinancingEmailText(applicationData);

    // Email options
    const mailOptions = {
      from: `JP AUTO <${process.env.EMAIL_USER || 'jpautomotivegroupllc@gmail.com'}>`,
      to: process.env.FINANCE_EMAIL || 'jpautomotivegroupllc@gmail.com',
      subject: `New Financing Application - ${applicationData.firstName} ${applicationData.lastName}`,
      text: emailText,
      html: emailHtml,
      replyTo: applicationData.email
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Financing application email sent: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    logger.error('Error sending financing application email:', error);
    throw error;
  }
}

/**
 * Format financing application data as HTML email
 */
function formatFinancingEmail(data) {
  const vehicleInfo = data.selectedVehicle
    ? `<h3>Selected Vehicle</h3>
       <p><strong>${data.selectedVehicle.year} ${data.selectedVehicle.make} ${data.selectedVehicle.model}</strong><br>
       Price: $${data.selectedVehicle.price?.toLocaleString()}<br>
       Mileage: ${data.selectedVehicle.mileage?.toLocaleString()} miles<br>
       Down Payment: $${data.downPayment || '0'}</p>`
    : '<p><em>No vehicle selected</em></p>';

  const coApplicantInfo = data.hasCoApplicant === 'true'
    ? `<h3>Co-Applicant Information</h3>
       <p><strong>Name:</strong> ${data.coFirstName} ${data.coMiddleInitial || ''} ${data.coLastName}<br>
       <strong>Phone:</strong> ${data.coMobileNumber}<br>
       <strong>Email:</strong> ${data.coEmail}<br>
       <strong>SSN:</strong> ***-**-${data.coSsn?.slice(-4)}<br>
       <strong>Birth Date:</strong> ${data.coBirthDate}</p>

       <p><strong>Employer:</strong> ${data.coCompanyName}<br>
       <strong>Job Title:</strong> ${data.coJobTitle}<br>
       <strong>Monthly Income:</strong> $${data.coGrossMonthlyIncome}<br>
       <strong>Time at Company:</strong> ${data.coYearsAtCompany} years, ${data.coMonthsAtCompany} months</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h2 { color: #083344; border-bottom: 2px solid #083344; padding-bottom: 10px; }
        h3 { color: #083344; margin-top: 20px; }
        p { margin: 10px 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🚗 New Financing Application</h2>

        <h3>Personal Information</h3>
        <p><strong>Name:</strong> ${data.firstName} ${data.middleInitial || ''} ${data.lastName} ${data.suffix || ''}<br>
        <strong>Phone:</strong> ${data.mobileNumber}<br>
        <strong>Email:</strong> ${data.email}<br>
        <strong>SSN:</strong> ***-**-${data.ssn?.slice(-4)}<br>
        <strong>Driver's License:</strong> ${data.driversLicense} (${data.state})<br>
        <strong>Birth Date:</strong> ${data.birthDate}</p>

        <h3>Current Residence</h3>
        <p><strong>Address:</strong> ${data.currentAddress}${data.currentApt ? ' ' + data.currentApt : ''}<br>
        <strong>City, State, Zip:</strong> ${data.currentCity}, ${data.currentState} ${data.currentZip}<br>
        <strong>Status:</strong> ${data.residenceStatus}<br>
        <strong>Monthly Payment:</strong> $${data.monthlyPayment}<br>
        <strong>Time at Residence:</strong> ${data.yearsAtResidence} years, ${data.monthsAtResidence} months</p>

        ${data.previousAddress ? `
        <p><strong>Previous Address:</strong> ${data.previousAddress}<br>
        <strong>City, State, Zip:</strong> ${data.previousCity}, ${data.previousState} ${data.previousZip}<br>
        <strong>Time at Previous:</strong> ${data.yearsAtPreviousResidence || 0} years, ${data.monthsAtPreviousResidence || 0} months</p>
        ` : ''}

        <h3>Current Employment</h3>
        <p><strong>Employer:</strong> ${data.companyName}<br>
        <strong>Phone:</strong> ${data.employerPhone}<br>
        <strong>Job Title:</strong> ${data.jobTitle}<br>
        <strong>Monthly Income:</strong> $${data.grossMonthlyIncome}<br>
        <strong>Time at Company:</strong> ${data.yearsAtCompany} years, ${data.monthsAtCompany} months</p>

        ${data.previousCompanyName ? `
        <p><strong>Previous Employer:</strong> ${data.previousCompanyName}<br>
        <strong>Job Title:</strong> ${data.previousJobTitle}<br>
        <strong>Time at Company:</strong> ${data.yearsAtPreviousCompany || 0} years</p>
        ` : ''}

        ${coApplicantInfo}

        ${vehicleInfo}

        ${data.comments ? `<h3>Additional Comments</h3><p>${data.comments}</p>` : ''}

        <div class="footer">
          <p>This application was submitted through the JP AUTO website financing form on ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format financing application as plain text
 */
function formatFinancingEmailText(data) {
  const vehicleInfo = data.selectedVehicle
    ? `SELECTED VEHICLE
${data.selectedVehicle.year} ${data.selectedVehicle.make} ${data.selectedVehicle.model}
Price: $${data.selectedVehicle.price?.toLocaleString()}
Mileage: ${data.selectedVehicle.mileage?.toLocaleString()} miles
Down Payment: $${data.downPayment || '0'}`
    : 'No vehicle selected';

  return `
NEW FINANCING APPLICATION
========================

PERSONAL INFORMATION
Name: ${data.firstName} ${data.middleInitial || ''} ${data.lastName} ${data.suffix || ''}
Phone: ${data.mobileNumber}
Email: ${data.email}
SSN: ***-**-${data.ssn?.slice(-4)}
Driver's License: ${data.driversLicense} (${data.state})
Birth Date: ${data.birthDate}

CURRENT RESIDENCE
Address: ${data.currentAddress}${data.currentApt ? ' ' + data.currentApt : ''}
City, State, Zip: ${data.currentCity}, ${data.currentState} ${data.currentZip}
Status: ${data.residenceStatus}
Monthly Payment: $${data.monthlyPayment}
Time at Residence: ${data.yearsAtResidence} years, ${data.monthsAtResidence} months

CURRENT EMPLOYMENT
Employer: ${data.companyName}
Phone: ${data.employerPhone}
Job Title: ${data.jobTitle}
Monthly Income: $${data.grossMonthlyIncome}
Time at Company: ${data.yearsAtCompany} years, ${data.monthsAtCompany} months

${vehicleInfo}

${data.comments ? `ADDITIONAL COMMENTS\n${data.comments}` : ''}

Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST
  `.trim();
}

module.exports = {
  sendFinancingApplication
};
