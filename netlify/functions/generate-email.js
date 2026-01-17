const { db } = require('./db.js');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const params = event.queryStringParameters || {};
    let username = params.username;
    const domain = params.domain || 'temp.yourdomain.com';

    // Generate random username jika tidak ada
    if (!username || username.trim() === '') {
      const randomString = () => Math.random().toString(36).substring(2, 10);
      username = randomString();
    }

    // Clean username (only alphanumeric)
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${cleanUsername}@${domain}`;

    // Check if email already exists
    let emailData = db.getEmail(email);
    if (!emailData) {
      emailData = db.createEmail(cleanUsername, domain);
    }

    // Build response
    const response = {
      success: true,
      email: emailData.email,
      username: cleanUsername,
      domain: domain,
      created_at: new Date(emailData.createdAt).toISOString(),
      expires_at: new Date(emailData.expiresAt).toISOString(),
      expires_in: '24 jam',
      inbox_url: `https://${event.headers.host}/api/inbox?email=${encodeURIComponent(emailData.email)}`,
      inbox_api: `https://${event.headers.host}/api/inbox?email=${encodeURIComponent(emailData.email)}`,
      web_inbox: `https://${event.headers.host}/inbox.html?email=${encodeURIComponent(emailData.email)}`,
      note: 'Email akan otomatis terhapus setelah 24 jam. Pesan di inbox akan hilang bersama email.'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }, null, 2)
    };
  }
};
