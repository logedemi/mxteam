const { db } = require('./db.js');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS, DELETE',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const email = params.email;

  // Validate email parameter
  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Email parameter is required',
        example: '/api/inbox?email=test@temp.yourdomain.com'
      }, null, 2)
    };
  }

  try {
    // GET: Retrieve inbox messages
    if (event.httpMethod === 'GET') {
      const emailData = db.getEmail(email);
      
      if (!emailData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Email not found or expired',
            tip: 'Generate a new email at /api/generate-email'
          }, null, 2)
        };
      }

      // Mark all as read if requested
      if (params.mark_read === 'true') {
        emailData.messages.forEach(msg => msg.read = true);
      }

      const response = {
        success: true,
        email: emailData.email,
        created_at: new Date(emailData.createdAt).toISOString(),
        expires_at: new Date(emailData.expiresAt).toISOString(),
        expires_in: Math.max(0, Math.round((emailData.expiresAt - Date.now()) / (1000 * 60 * 60))) + ' hours',
        messages_count: emailData.messages.length,
        unread_count: emailData.messages.filter(m => !m.read).length,
        messages: emailData.messages.map(msg => ({
          id: msg.id,
          from: msg.from,
          subject: msg.subject,
          preview: msg.text ? msg.text.substring(0, 150) + (msg.text.length > 150 ? '...' : '') : '',
          received_at: new Date(msg.receivedAt).toISOString(),
          read: msg.read,
          has_html: !!msg.html
        }))
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response, null, 2)
      };
    }

    // POST: Add new message to inbox (simulate receiving email)
    if (event.httpMethod === 'POST') {
      const emailData = db.getEmail(email);
      
      if (!emailData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Email not found'
          }, null, 2)
        };
      }

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch (e) {
        body = {};
      }

      // Validate required fields
      if (!body.from || !body.subject) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Missing required fields',
            required: ['from', 'subject'],
            received: Object.keys(body)
          }, null, 2)
        };
      }

      // Add message to inbox
      const success = db.addMessage(email, {
        from: body.from,
        subject: body.subject,
        text: body.text || body.body || '',
        html: body.html || ''
      });

      if (success) {
        const emailData = db.getEmail(email);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Email received successfully',
            message_id: emailData.messages.length - 1,
            total_messages: emailData.messages.length,
            inbox_url: `https://${event.headers.host}/api/inbox?email=${encodeURIComponent(email)}`
          }, null, 2)
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to add message'
          }, null, 2)
        };
      }
    }

    // PUT: Mark message as read
    if (event.httpMethod === 'PUT') {
      const emailData = db.getEmail(email);
      
      if (!emailData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Email not found'
          }, null, 2)
        };
      }

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch (e) {
        body = {};
      }

      const messageId = parseInt(body.message_id);
      if (isNaN(messageId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid message_id'
          }, null, 2)
        };
      }

      const success = db.markAsRead(email, messageId);
      
      return {
        statusCode: success ? 200 : 404,
        headers,
        body: JSON.stringify({
          success: success,
          message: success ? 'Message marked as read' : 'Message not found'
        }, null, 2)
      };
    }

    // DELETE: Delete email (manual cleanup)
    if (event.httpMethod === 'DELETE') {
      // Note: In actual implementation, you would remove from database
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Delete endpoint - implement actual deletion in db.js'
        }, null, 2)
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
        allowed: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }, null, 2)
    };

  } catch (error) {
    console.error('Inbox error:', error);
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
