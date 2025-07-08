# Personalized News Feed Web Application

This is a full-stack web application built for educational purposes to demonstrate how a simple keyword-based news personalization system can be implemented. The application allows users to search for news articles in two modes:

- **Guest Mode**: Users can search news articles by topic or keyword and view real-time results from NewsAPI.
- **Logged-In Mode**: Registered users receive a personalized feed where articles are ranked higher based on previously clicked article keywords.

The system tracks user interests based on clicked articles and uses a keyword extraction microservice to personalize future content.

---

## Features

- Search current news articles from NewsAPI by entering any topic  
- Browse as a guest or create an account for personalized experience  
- View articles ranked based on previously clicked content (login required)  
- Extracts keywords from articles to identify user interests  
- Store and retrieve interests using Redis for fast performance  
- View and manage saved interest keywords from your profile  
- Remove specific keywords to fine-tune personalization (helps users control their feed)  
- JWT-based user authentication  
- Visual indicators for articles that have already been clicked

---

## Why "Manage Interests"?

Inside the logged-in experience, users can view a list of keywords (interests) that are currently used to personalize their feed. Users can also remove keywords from this list.  
This feature was added to promote transparency and give users control over the content that influences their feed, demonstrating ethical personalization practices.

---

## Technology Stack

### Frontend  
- React.js  
- CSS  
- Axios

### Backend  
- Node.js with Express  
- JWT for authentication  
- REST API

### Data and Services  
- MongoDB (with MongoDB Compass) for user accounts  
- Redis for keyword interest storage  
- NewsAPI to fetch news articles

### Python Microservice  
- FastAPI  
- KeyBERT for extracting keywords from article titles

---

## Project Structure

```

personalized-news-feed/
├── client/           React frontend
├── ml/               Python microservice
│   └── src/          Keyword extraction logic
├── server/           Node.js backend
│   ├── models/       MongoDB schemas
│   ├── routes/       API routes
│   └── index.js      Backend entry point
└── README.md         Documentation

````

---

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/GitHubber07/personalized-news-feed.git
cd personalized-news-feed
````

### 2. Environment variables

In the `server` folder, create a `.env` file:

```env
NEWS_API_KEY=your_newsapi_key
MONGO_URI=mongodb://localhost:27017/personalizedNewsDB
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token
```

### 3. Install dependencies

**Frontend**

```bash
cd client
npm install
```

**Backend**

```bash
cd ../server
npm install
```

**Python Microservice**

```bash
cd ../ml
python -m venv venv
```

Activate the environment:

* Windows:

```bash
venv\Scripts\activate
```

* macOS/Linux:

```bash
source venv/bin/activate
```

Then install:

```bash
pip install -r requirements.txt
```

---

## Running the Application

Open three terminals and run each service:

**Frontend (React)**

```bash
cd client
npm start
```

**Backend (Node.js)**

```bash
cd server
node index.js
```

**Python Microservice**

```bash
cd ml/src
venv\Scripts\activate
python keyword_extractor.py
```

Access the application at:
[http://localhost:3000](http://localhost:3000)

---

## How It Works

* Guest users search for articles through the NewsAPI
* After logging in when an article is clicked, a Python microservice extracts its keywords
* These keywords are stored in Redis as the user’s "interests"
* In future searches, articles with matching keywords appear higher in results
* Logged-in users can open the "Interests" page to see which keywords are influencing their feed
* They can also delete specific interests to adjust what types of articles are prioritized

This demonstrates how interest-based personalization can be controlled by the user without relying on machine learning or opaque recommendation models.

---

## Planned Improvements

* Add unit and integration tests
* Dockerize for simplified deployment
* Real-time content updates using WebSockets
* Add bookmark and save-for-later features
* Improve scoring of keyword matches

---

## Requirements

To run this project locally, you need:

* Node.js and npm
* Python 3
* MongoDB (using MongoDB Compass)
* Redis (Upstash or local)
* NewsAPI key ([https://newsapi.org](https://newsapi.org))

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request.

---
