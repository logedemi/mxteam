// Import database
const { db } = require('./db.js');

exports.handler = async function(event, context) {
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
    
    // Generate username
    let finalUsername;
    if (username && username.trim() !== '') {
      finalUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      finalUsername = Math.random().toString(36).substring(2, 10);
    }

    const email = `${finalUsername}@${domain}`;
    
    // Create or get existing
    let emailData = db.getEmail(email);
    if (!emailData) {
      emailData = db.createEmail(email);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email,
        created_at: new Date(emailData.createdAt).toISOString(),
        expires_at: new Date(emailData.expiresAt).toISOString(),
        inbox_url: `https://${event.headers.host}/api/inbox?email=${encodeURIComponent(email)}`,
        api_url: `https://${event.headers.host}/api/inbox?email=${encodeURIComponent(email)}`
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
