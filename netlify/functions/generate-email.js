// Database sederhana di memory (reset setiap deploy)
// Untuk production, ganti dengan Netlify KV atau FaunaDB

const emails = new Map(); // email -> { createdAt, messages: [] }

export const db = {
  // Create email
  createEmail(email) {
    const emailData = {
      email,
      createdAt: Date.now(),
      messages: [],
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 jam
    };
    emails.set(email, emailData);
    return emailData;
  },

  // Get email
  getEmail(email) {
    return emails.get(email);
  },

  // Add message to email
  addMessage(email, message) {
    const emailData = emails.get(email);
    if (emailData) {
      emailData.messages.push({
        ...message,
        receivedAt: Date.now(),
        read: false
      });
    }
  },

  // Get all emails
  getAllEmails() {
    return Array.from(emails.values());
  },

  // Delete expired emails
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
  markAsRead(email, messageIndex) {
    const emailData = emails.get(email);
    if (emailData && emailData.messages[messageIndex]) {
      emailData.messages[messageIndex].read = true;
      return true;
    }
    return false;
  }
};
