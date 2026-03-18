require('dotenv').config(); // Loads .env file
const connectDB = require('./src/config/db'); // Your database connection logic
const app = require('./src/app'); // Your Express app setup

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database first
    await connectDB();

    // 2. Start listening for requests
    app.listen(PORT, () => {
      console.log(`
      ╔════════════════════════════════════════════╗
      ║     AKADEMIA CBT API Server Started        ║
      ║     Port: ${PORT}                          ║
      ║     URL: http://localhost:${PORT}/api/docs   ║
      ╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to start server:', error.message);
    process.exit(1); 
  }
};

startServer();