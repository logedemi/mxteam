import { db } from './db.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { email } = event.queryStringParameters || {};
  
  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Parameter email diperlukan' 
      })
    };
  }

  try {
    // GET: Ambil semua pesan
    if (event.httpMethod === 'GET') {
      const { mark_read } = event.queryStringParameters || {};
      const emailData = db.getEmail(email);
      
      if (!emailData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Email tidak ditemukan atau sudah kadaluarsa' 
          })
        };
      }

      // Mark all as read jika diminta
      if (mark_read === 'true') {
        emailData.messages.forEach(msg => msg.read = true);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          email: emailData.email,
          created_at: new Date(emailData.createdAt).toISOString(),
          expires_at: new Date(emailData.expiresAt).toISOString(),
          messages_count: emailData.messages.length,
          messages: emailData.messages.map((msg, index) => ({
            id: index,
            from: msg.from,
            subject: msg.subject,
            preview: msg.text ? msg.text.substring(0, 100) + '...' : '',
            received_at: new Date(msg.receivedAt).toISOString(),
            read: msg.read
          }))
        })
      };
    }
    
    // POST: Terima email baru (simulasi dari eksternal)
    else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      if (!body.from || !body.subject) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Dari dan subjek diperlukan' 
          })
        };
      }

      const emailData = db.getEmail(email);
      if (!emailData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Email tidak ditemukan' 
          })
        };
      }

      const message = {
        from: body.from,
        subject: body.subject,
        text: body.text || '',
        html: body.html || '',
        headers: body.headers || {}
      };

      db.addMessage(email, message);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Email diterima',
          message_id: emailData.messages.length - 1,
          total_messages: emailData.messages.length
        })
      };
    }
    
    // DELETE: Hapus email (untuk testing)
    else if (event.httpMethod === 'DELETE') {
      // Hapus dari database (dalam real implementation)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Email dihapus'
        })
      };
    }

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
