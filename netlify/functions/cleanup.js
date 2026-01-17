import { db } from './db.js';

// Fungsi ini bisa dipanggil manual atau dijadikan scheduled function
export const handler = async (event, context) => {
  try {
    const deletedCount = db.cleanup();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Cleanup berhasil. ${deletedCount} email dihapus.`,
        deleted_count: deletedCount,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};

// Untuk scheduled cleanup di Netlify, tambahkan di netlify.toml:
// [[functions.schedule]]
//   path = "/.netlify/functions/cleanup"
//   cron = "0 */6 * * *"  // Setiap 6 jam
