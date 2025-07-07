const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Load JWT secret from .env
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Register new user
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Register request body:', req.body);

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    try {
        // Check if user/email already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        // After login directly after register;
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'User registered and logged in',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token (expires in 1 day)
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Send token and user info to frontend
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
