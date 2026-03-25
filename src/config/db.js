const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '8.8.8.8']);
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ensure your .env has MONGO_URI
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Default admin creation removed for security/flexibility
  } catch (error) {
    console.error(`❌ Database Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;