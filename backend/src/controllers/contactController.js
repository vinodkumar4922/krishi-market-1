const AuditLog = require('../models/AuditLog');

/**
 * Handle public support & contact inquiries with validation and rate limiting
 */
const submitContactInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, category = 'GENERAL' } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    const ticketId = `KM-SUP-${Date.now().toString().slice(-6)}`;

    // Log the contact inquiry for admin tracking
    await AuditLog.create({
      actor: null,
      action: 'CONTACT_INQUIRY_SUBMITTED',
      resourceType: 'SupportTicket',
      resourceId: ticketId,
      details: {
        name,
        email,
        phone: phone || 'N/A',
        subject: subject || 'General Support',
        category,
        messagePreview: message.slice(0, 150),
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you for contacting Krishi Market! Your support request has been logged and our team will get in touch within 24 hours.',
      data: {
        ticketId,
        receivedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContactInquiry };
