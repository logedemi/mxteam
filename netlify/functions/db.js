// Simple in-memory database
const emails = new Map();

const db = {
  createEmail(email) {
    const emailData = {
      email,
      createdAt: Date.now(),
      messages: [],
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
    emails.set(email, emailData);
    return emailData;
  },

  getEmail(email) {
    return emails.get(email);
  },

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

  getAllEmails() {
    return Array.from(emails.values());
  },

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
  }
};

module.exports = { db };  // CommonJS export untuk Netlify
