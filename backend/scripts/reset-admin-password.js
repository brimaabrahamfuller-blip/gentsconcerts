#!/usr/bin/env node

/**
 * One-time operational reset for the creator administrator.
 *
 * Required runtime environment:
 *   MONGODB_URI
 *   ADMIN_NEW_PASSWORD
 *
 * Optional:
 *   ADMIN_EMAIL (defaults to gentsconcerts@gmail.com)
 *
 * The password is intentionally never stored in source, logs, or Git history.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = String(process.env.ADMIN_EMAIL || 'gentsconcerts@gmail.com').trim().toLowerCase();
const password = process.env.ADMIN_NEW_PASSWORD;

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required.');
  process.exit(1);
}
if (!password || password.length < 12) {
  console.error('ADMIN_NEW_PASSWORD is required and must be at least 12 characters.');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error(`No account found for ${email}.`);
    }

    user.password = password;
    user.role = 'admin';
    user.status = 'active';
    user.isVerified = true;
    user.hostApprovalStatus = 'not_requested';
    await user.save();

    console.log(`Admin password reset completed for ${email}.`);
  } catch (error) {
    console.error(`Admin password reset failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
