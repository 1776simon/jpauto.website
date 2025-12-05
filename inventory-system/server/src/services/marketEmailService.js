/**
 * Market Email Service
 *
 * Sends email notifications for market research alerts
 * User specified: Send to jpautomotivegroupllc@gmail.com
 */

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class MarketEmailService {
  constructor() {
    this.enabled = process.env.MARKET_RESEARCH_ENABLED === 'true';
    this.alertEmail = process.env.MARKET_RESEARCH_ALERT_EMAIL || 'jpautomotivegroupllc@gmail.com';
    this.transporter = null;

    if (this.enabled && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        logger.info('Email transporter initialized successfully');
      } catch (error) {
        logger.warn('Failed to initialize email transporter', { error: error.message });
      }
    } else if (this.enabled) {
      logger.warn('Market research enabled but email configuration incomplete (missing SMTP_USER or SMTP_PASS)');
    }
  }

  /**
   * Send alert email with all pending alerts
   */
  async sendAlertEmail(alerts) {
    if (!this.enabled) {
      logger.warn('Email sending disabled (MARKET_RESEARCH_ENABLED=false)');
      return false;
    }

    if (!this.transporter) {
      logger.warn('Email transporter not configured - cannot send alerts');
      return false;
    }

    if (!alerts || alerts.length === 0) {
      logger.info('No alerts to send');
      return false;
    }

    try {
      const subject = this.buildEmailSubject(alerts);
      const htmlBody = this.buildAlertEmailHtml(alerts);
      const textBody = this.buildAlertEmailText(alerts);

      const mailOptions = {
        from: process.env.SMTP_FROM || `"JP Auto Market Research" <${this.alertEmail}>`,
        to: this.alertEmail,
        subject,
        text: textBody,
        html: htmlBody
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Alert email sent', {
        messageId: info.messageId,
        alertCount: alerts.length,
        to: this.alertEmail
      });

      return true;
    } catch (error) {
      logger.error('Failed to send alert email', {
        error: error.message,
        alertCount: alerts.length
      });
      throw error;
    }
  }

  /**
   * Build email subject line
   */
  buildEmailSubject(alerts) {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const infoCount = alerts.filter(a => a.severity === 'info').length;

    if (criticalCount > 0) {
      return `🚨 ${criticalCount} Critical Market Alert${criticalCount > 1 ? 's' : ''} - JP Auto`;
    } else if (warningCount > 0) {
      return `⚠️ ${warningCount} Market Alert${warningCount > 1 ? 's' : ''} - JP Auto`;
    } else {
      return `📊 ${infoCount} Market Update${infoCount > 1 ? 's' : ''} - JP Auto`;
    }
  }

  /**
   * Build HTML email body
   */
  buildAlertEmailHtml(alerts) {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');
    const infoAlerts = alerts.filter(a => a.severity === 'info');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 10px 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .alert-section {
      margin-bottom: 40px;
    }
    .alert-section h2 {
      border-bottom: 2px solid;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .alert-section.critical h2 {
      color: #d32f2f;
      border-color: #d32f2f;
    }
    .alert-section.warning h2 {
      color: #f57c00;
      border-color: #f57c00;
    }
    .alert-section.info h2 {
      color: #1976d2;
      border-color: #1976d2;
    }
    .alert-card {
      background: #f9f9f9;
      border-left: 4px solid;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .alert-card.critical {
      border-color: #d32f2f;
      background: #ffebee;
    }
    .alert-card.warning {
      border-color: #f57c00;
      background: #fff3e0;
    }
    .alert-card.info {
      border-color: #1976d2;
      background: #e3f2fd;
    }
    .alert-card h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    .alert-card .vehicle-info {
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }
    .alert-card .message {
      color: #555;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
    .dashboard-link {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚗 Market Research Alert</h1>
    <p>${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
  </div>

  <div class="content">
    ${this.buildAlertSection(criticalAlerts, '🔴 Critical Alerts', 'critical')}
    ${this.buildAlertSection(warningAlerts, '⚠️ Warning Alerts', 'warning')}
    ${this.buildAlertSection(infoAlerts, 'ℹ️ Info Alerts', 'info')}

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://admin.jpautomotivegroup.com/market-research" class="dashboard-link">
        View Full Dashboard →
      </a>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated alert from JP Auto Market Research System</p>
    <p>Powered by Auto.dev Listings API</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Build alert section HTML
   */
  buildAlertSection(alerts, title, severity) {
    if (alerts.length === 0) {
      return '';
    }

    const alertsHtml = alerts.map(alert => `
      <div class="alert-card ${severity}">
        <h3>${alert.title}</h3>
        <div class="vehicle-info">
          ${alert.year} ${alert.make} ${alert.model}${alert.trim ? ' ' + alert.trim : ''}
          ${alert.vin ? `(VIN: ${alert.vin})` : ''}
        </div>
        <div class="message">${alert.message}</div>
      </div>
    `).join('');

    return `
      <div class="alert-section ${severity}">
        <h2>${title} (${alerts.length})</h2>
        ${alertsHtml}
      </div>
    `;
  }

  /**
   * Build plain text email body
   */
  buildAlertEmailText(alerts) {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');
    const infoAlerts = alerts.filter(a => a.severity === 'info');

    let text = `
JP AUTO - MARKET RESEARCH ALERT
${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
${'='.repeat(60)}

`;

    if (criticalAlerts.length > 0) {
      text += this.buildAlertSectionText(criticalAlerts, '🔴 CRITICAL ALERTS');
    }

    if (warningAlerts.length > 0) {
      text += this.buildAlertSectionText(warningAlerts, '⚠️  WARNING ALERTS');
    }

    if (infoAlerts.length > 0) {
      text += this.buildAlertSectionText(infoAlerts, 'ℹ️ INFO ALERTS');
    }

    text += `
${'='.repeat(60)}

View full dashboard at:
https://admin.jpautomotivegroup.com/market-research

---
This is an automated alert from JP Auto Market Research System
Powered by Auto.dev Listings API
`;

    return text;
  }

  /**
   * Build alert section plain text
   */
  buildAlertSectionText(alerts, title) {
    let text = `\n${title} (${alerts.length})\n${'-'.repeat(60)}\n\n`;

    alerts.forEach((alert, index) => {
      text += `${index + 1}. ${alert.title}\n`;
      text += `   Vehicle: ${alert.year} ${alert.make} ${alert.model}${alert.trim ? ' ' + alert.trim : ''}\n`;
      if (alert.vin) {
        text += `   VIN: ${alert.vin}\n`;
      }
      text += `   ${alert.message}\n\n`;
    });

    return text;
  }

  /**
   * Send test email
   */
  async sendTestEmail() {
    if (!this.enabled) {
      logger.warn('Email sending disabled (MARKET_RESEARCH_ENABLED=false)');
      return false;
    }

    if (!this.transporter) {
      logger.warn('Email transporter not configured - cannot send test email');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"JP Auto Market Research" <${this.alertEmail}>`,
        to: this.alertEmail,
        subject: '✅ Test Email - Market Research System',
        text: 'This is a test email from the JP Auto Market Research System. If you received this, email notifications are configured correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">✅ Email Configuration Test</h2>
            <p>This is a test email from the JP Auto Market Research System.</p>
            <p>If you received this message, email notifications are configured correctly!</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">JP Auto Market Research System</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Test email sent successfully', {
        messageId: info.messageId,
        to: this.alertEmail
      });

      return true;
    } catch (error) {
      logger.error('Failed to send test email', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new MarketEmailService();
