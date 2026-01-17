import { db } from './db.js';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { username, domain = 'temp.yourdomain.com' } = event.queryStringParameters || {};
    
    // Generate random username jika tidak ada
    let finalUsername;
    if (username) {
      finalUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      finalUsername = generateRandomString(8);
    }

    const email = `${finalUsername}@${domain}`;
    
    // Cek apakah email sudah ada
    const existing = db.getEmail(email);
    if (existing) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          email: existing.email,
          created_at: new Date(existing.createdAt).toISOString(),
          expires_at: new Date(existing.expiresAt).toISOString(),
          messages_count: existing.messages.length,
          inbox_url: `${event.headers.host}/api/inbox?email=${encodeURIComponent(email)}`
        })
      };
    }

    // Buat email baru
    const emailData = db.createEmail(email);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email,
        created_at: new Date(emailData.createdAt).toISOString(),
        expires_at: new Date(emailData.expiresAt).toISOString(),
        inbox_url: `https://${event.headers.host}/api/inbox?email=${encodeURIComponent(email)}`,
        api_url: `https://${event.headers.host}/api/inbox?email=${encodeURIComponent(email)}`,
        note: 'Email akan otomatis terhapus setelah 24 jam'
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
