import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { seedDatabase } from './database/seed.js';

const PORT = parseInt(process.env.PORT || '5001', 10);

async function start() {
  try {
    // Run seed to ensure users and default accounts are present
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Going Merry HMS Server running on http://localhost:${PORT}`);
      console.log(`🔒 Authentication & Authorization API active at http://localhost:${PORT}/api/v1/auth`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
