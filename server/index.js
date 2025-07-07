const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
require('dotenv').config(); // to use .env variables

// Middleware
app.use(cors());
app.use(express.json());

// Use the auth routes
app.use('/auth', require('./routes/auth'));

const { Redis } = require('@upstash/redis');
const connectDB = require('./db');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/newsfeeddb';
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

app.listen(5000, () => {
    console.log('Server running on port 5000');
});

const MAX_KEYWORDS = 20;

// Load your NewsAPI key from .env file
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Get keywords for this user from redis ** should be defined globally so that both click annd serach can use it**
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Route to handle search
app.get('/search', async (req, res) => {
    const query = req.query.q;
    const userId = req.query.userId; // Now optional

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        // Call NewsAPI
        const response = await axios.get(
            // number of article visible can be changed from here
            `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=24&apiKey=${NEWS_API_KEY}`
        );
        
        let articles = response.data.articles;
        
        // Only personalize if userId exists
        if (userId) {
            let keywords = await redis.get(userId);
            if (!Array.isArray(keywords)) keywords = [];

            if (keywords.length > 0) {
                // Score articles (renamed from scoredArticles to avoid confusion)
                const scoredArticles = articles.map((article) => {
                    const content = `${article.title} ${article.description}`.toLowerCase();
                    const score = keywords.reduce((count, keyword) => (
                        content.includes(keyword.toLowerCase()) ? count + 1 : count
                    ), 0);
                    return { ...article, relevanceScore: score };
                });

                // Sort by score (desc) + published date (recent first)
                articles = scoredArticles.sort((a, b) => {
                    if (b.relevanceScore === a.relevanceScore) {
                        return new Date(b.publishedAt) - new Date(a.publishedAt);
                    }
                    return b.relevanceScore - a.relevanceScore;
                });
            }
        }
        
        res.json({ articles });
    } catch (error) {
        console.error('NewsAPI Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

// Backend Node.js API to Receive Clicks
app.use(express.json()); // Needed to parse JSON bodies

app.post('/click', async (req, res) => {
    const article = req.body.article;
    const userId = req.body.userId || 'defaultUser';  // will be replace with real login ID later

    if (!article || !article.title || !article.description) {
        return res.status(400).json({ error: 'Invalid article data' });
    }

    // should be initialized before using txt
    const text = `${article.title}. ${article.description}`;

    // Send to Python backend for keyword extraction
    try {
        // Call Python keyBERT service
        const response = await axios.post('http://localhost:6000/extract_keywords', { text });
        const newKeywords = response.data.keywords;

        // Get existing keywords from Redis (defaults to empty array)
        let existingKeywords = await redis.get(userId);
        if (!Array.isArray(existingKeywords)) existingKeywords = [];

        // Merge new keywords + existing
        const merged = [...newKeywords, ...existingKeywords];


        // Remove duplicates
        const unique = [...new Set(merged)];

        // trimmed to MAX_KEYWORDS (FIFO)
        const trimmed = unique.slice(0, MAX_KEYWORDS);

        // Save updated list back to Redis
        await redis.set(userId, trimmed);

        console.log(`User ${userId} Interests:`, trimmed);

        res.json({ message: "Click tracked & keywords updated", interests: trimmed });

    } catch (err) {
        console.error("Keyword service failed:", err.message);
        res.status(500).json({ error: "Could not extract keywords" });
    }
});

// Route to remove a keyword from user interest list( This will allow the frontend to POST a keyword to remove)
app.post('/remove-keyword', async (req, res) => {
    const { userId = 'defaultUser', keyword } = req.body;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
    }

    try {
        // Get keywords from Redis
        let interests = await redis.get(userId);
        if (!Array.isArray(interests)) interests = [];

        // Remove the keyword
        interests = interests.filter(k => k.toLowerCase() !== keyword.toLowerCase());

        // Save updated list
        await redis.set(userId, interests); // no JSON.stringify

        console.log(`Removed keyword "${keyword}" for user ${userId}`);
        res.json({ message: 'Keyword removed', interests });
    } catch (error) {
        console.error('Error removing keyword:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// backend route to fetch interests
app.get('/interests', async (req, res) => {
    const { userId } = req.query;
    const interests = await redis.lrange(`interests:${userId}`, 0, -1);
    res.json({ interests });
});


// Start server
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});







//** to check if my upstash is working fine or not **

// app.get('/test-redis', async (req, res) => {
//     try {
//         await redis.set("testKey", "helloFromUpstash");
//         const value = await redis.get("testKey");
//         res.json({ success: true, value });
//     } catch (err) {
//         console.error("Redis test failed:", err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

//run this after adding above code
//http://localhost:5000/test-redis