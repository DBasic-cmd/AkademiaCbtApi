require('dotenv').config(); // Loads .env file
const connectDB = require('./src/config/db'); // Your database connection logic
const app = require('./src/app'); // Your Express app setup
const helmet = require('helmet');
const cors = require('cors');

app.use(helmet());
app.use(cors());

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database first
    await connectDB();

    // 2. Start listening for requests
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
      ╔════════════════════════════════════════════╗
      ║     AKADEMIA CBT API Server Started        ║
      ║     Port: ${PORT}                          ║
      ║     URL: '0.0.0.0'   ║
      ╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to start server:', error.message);
    process.exit(1); 
  }
};

startServer();