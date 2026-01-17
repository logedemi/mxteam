const { db } = require('./db.js');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Run cleanup
    const deletedCount = db.cleanup();
    const stats = db.getStats();

    const response = {
      success: true,
      action: 'cleanup',
      deleted_emails: deletedCount,
      timestamp: new Date().toISOString(),
      current_stats: stats,
      message: deletedCount > 0 
        ? `Cleaned up ${deletedCount} expired emails`
        : 'No expired emails to clean up'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Cleanup failed',
        message: error.message
      }, null, 2)
    };
  }
};
