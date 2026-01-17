// Simple in-memory database
const emails = new Map();

const db = {
  // Create new email
  createEmail(email, domain = 'temp.yourdomain.com') {
    const fullEmail = email.includes('@') ? email : `${email}@${domain}`;
    const emailData = {
      email: fullEmail,
      createdAt: Date.now(),
      messages: [],
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 jam
    };
    emails.set(fullEmail, emailData);
    return emailData;
  },

  // Get email data
  getEmail(email) {
    return emails.get(email);
  },

  // Add message to inbox
  addMessage(email, message) {
    const emailData = emails.get(email);
    if (emailData) {
      emailData.messages.push({
        id: emailData.messages.length,
        from: message.from || 'unknown@example.com',
        subject: message.subject || 'No Subject',
        text: message.text || '',
        html: message.html || '',
        receivedAt: Date.now(),
        read: false
      });
      return true;
    }
    return false;
  },

  // Get all emails (for admin/cleanup)
  getAllEmails() {
    return Array.from(emails.values());
  },

  // Cleanup expired emails
  cleanup() {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [email, data] of emails.entries()) {
      if (now > data.expiresAt) {
        emails.delete(email);
        deletedCount++;
      }
    }
    
    return deletedCount;
  },

  // Mark message as read
  markAsRead(email, messageId) {
    const emailData = emails.get(email);
    if (emailData && emailData.messages[messageId]) {
      emailData.messages[messageId].read = true;
      return true;
    }
    return false;
  },

  // Get total email count
  getStats() {
    let totalMessages = 0;
    emails.forEach(data => {
      totalMessages += data.messages.length;
    });
    
    return {
      totalEmails: emails.size,
      totalMessages: totalMessages,
      activeSince: new Date().toISOString()
    };
  }
};

module.exports = { db };
