const mongoose = require('mongoose');

// Define User schema with email, username, and password hash
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,  // unique username
  },
  email: {
    type: String,
    required: true,
    unique: true,  // unique email
  },
  password: {
    type: String,
    required: true,
  }
}, { timestamps: true });  // timestamps adds createdAt and updatedAt fields

// Create and export User model
module.exports = mongoose.model('User', UserSchema);
