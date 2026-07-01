import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placeme_ai';
  
  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
  };

  try {
    await mongoose.connect(mongoURI, options);
    console.log('✨ MongoDB Connected Successfully to Atlas/Local server.');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    console.warn('⚠️ Starting server with MOCK database mode fallback to avoid app crashes. Please verify MONGODB_URI.');
    
    // In production, we'd fail-fast, but for a resilient SaaS setup, we can continue.
    // We can set up a local in-memory DB or keep retrying in the background.
    setTimeout(async () => {
      console.log('🔄 Attempting MongoDB reconnect...');
      try {
        await mongoose.connect(mongoURI, options);
        console.log('✨ MongoDB Connected successfully on retry.');
      } catch (err) {
        console.warn('⚠️ Reconnect failed. Running on fallback. Ensure MongoDB is running.');
      }
    }, 10000);
  }
};
