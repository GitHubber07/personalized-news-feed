import React, { useState, useEffect } from 'react';
import './App.css';
import AuthForm from './AuthForm';

function App() {
  // React "state" variables to track user input and articles
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(window.scrollY);
  const [clickedArticles, setClickedArticles] = useState(new Set());
  const [userInterests, setUserInterests] = useState([]);
  const [showInterests, setShowInterests] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // Handles changes to the search input
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Fetch news articles from backend
  const handleSearch = async () => {
    if (!searchTerm) return;

    /* only required when we need compulsory login to search */
    // if (!userId) {
    //   setShowAuthPopup(true);
    //   return;
    // }

    try {
      const url = userId
        ? `http://localhost:5000/search?q=${searchTerm}&userId=${userId}`
        : `http://localhost:5000/search?q=${searchTerm}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      console.log('Fetched articles:', data); // See what’s coming from backend
      setArticles(data.articles); // Make sure it's data.articles
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // changed logic after change on cards after clicking
  const handleArticleClick = async (article) => {
    // Check if already clicked to prevent duplicate tracking
    const isClicked = clickedArticles.has(article.url);

    // Update local state immediately for UI feedback
    if (!isClicked) {
      setClickedArticles(prev => new Set(prev).add(article.url));
    }

    // Only send to backend if user is logged in
    if (userId && !isClicked) {
      try {
        const response = await fetch('http://localhost:5000/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article, userId })
        });

        const result = await response.json();
        setUserInterests(result.interests || []);
      } catch (error) {
        console.error("Click tracking failed:", error);

        // Rollback local state if tracking failed
        setClickedArticles(prev => {
          const newSet = new Set(prev);
          newSet.delete(article.url);
          return newSet;
        });

      }
    }
  };

  // remove keywords form interest list 
  const handleRemoveKeyword = async (keyword) => {
    try {
      const response = await fetch('http://localhost:5000/remove-keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || 'defaultUser', keyword }) // Replace with real user ID when ready
      });

      const data = await response.json();
      setUserInterests(data.interests); // Refresh the updated keyword list
    } catch (err) {
      console.error("Failed to remove keyword", err);
    }
  };

  // to handle login 
  const handleLogin = async (id, username) => {  // Add username parameter
    setUserId(id);
    setUsername(username); // Store username in state
    setClickedArticles(new Set());  // Reset clicked articles
    localStorage.setItem('userId', id);
    localStorage.setItem('username', username);  // Store username
    try {
      const response = await fetch(`http://localhost:5000/interests?userId=${id}`);
      const data = await response.json();
      setUserInterests(data.interests || []);
      setArticles([]);  // Clear articles
    } catch (err) {
      console.error('Failed to load interests after login', err);
    }
  };

  // to handle logout
  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setUserId(null);
    setUsername('');
    setClickedArticles(new Set());  // Reset clicked articles
    setArticles([]);  // Clear articles
    setUserInterests([]);  // Clear interests
    setShowAuthPopup(false);
  };

  // Scroll effect for top bar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        setShowTopBar(true); // scrolling up
      } else {
        setShowTopBar(false); // scrolling down
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load user from localStorage on startup
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');

    if (savedUserId) {
      setUserId(savedUserId);
      setUsername(savedUsername || '');

      // Load interests too
      fetch(`http://localhost:5000/interests?userId=${savedUserId}`)
        .then(res => res.json())
        .then(data => setUserInterests(data.interests || []))
        .catch(err => console.error('Failed to load interests:', err));
    }
  }, []);

  return (
    <div className="App">
      {/* Top bar */}
      <div className={`top-bar ${showTopBar ? 'show' : 'hide'}`}>
        <h1> Personalized News Feed</h1>

        <div className="search-and-user">

          {/* Search input and button */}
          <div className="search-container">
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Search for news..."
            />
            <button onClick={handleSearch}>Search</button>
            {!userId && (
              <p className="login-prompt">
                <span onClick={() => setShowAuthPopup(true)}>Login</span> for personalized results
              </p>
            )}
          </div>

          {/* User icon & greeting */}
          <div className="user-section">
            <span className="user-icon" onClick={() => setShowAuthPopup(!showAuthPopup)}>👤</span>
            {userId && <span className="welcome-text">Hi, {username}</span>}
          </div>
        </div>
      </div>

      {/* Toggle button for showing interest */}
      {userInterests.length > 0 && (
        <div className="interests">
          <button className="toggle-btn" onClick={() => setShowInterests(!showInterests)}>
            {showInterests ? 'Hide Interests 🔽' : 'Show Interests 🔼'}
          </button>

          {showInterests && (
            <div className="interest-list">
              {userInterests.map((keyword, idx) => (
                <span key={idx} className="interest">
                  {keyword}
                  <button
                    style={{ marginLeft: '5px' }}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove "${keyword}" from your interests?`)) {
                        handleRemoveKeyword(keyword);
                      }
                    }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auth popup outside top bar for positioning */}
      {showAuthPopup && (
        <div className="auth-popup">
          {!userId ? (
            <AuthForm handleLogin={handleLogin} setShowPopup={setShowAuthPopup} />
          ) : (
            <button onClick={handleLogout}>Logout</button>
          )}
        </div>
      )}

      {/* Show fetched articles with clicked already or not function*/}
      <div className="articles">
        {Array.isArray(articles) && articles.map((article, index) => {
          const isClicked = clickedArticles.has(article.url);

          return (
            <div
              key={index}
              className={`card ${isClicked ? 'clicked' : ''}`}
              onClick={(e) => {
                // Only open article if not clicking on a link
                if (e.target.tagName !== 'A') {
                  window.open(article.url, '_blank');
                  handleArticleClick(article);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={article.urlToImage || 'https://dummyimage.com/600x400/4c51bf/ffffff&text=News+Image'}
                alt={article.title}
                onError={(e) => {
                  e.target.src = `https://picsum.photos/400/200?random=${index}`;
                  e.target.alt = `https://dummyimage.com/400x200/4c51bf/ffffff&text=News+Image`;
                }}
                className="article-image"
              />
              <div className="card-content">
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <p><b>Source:</b> {article.source.name}</p>
                <div className="card-footer">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArticleClick(article);
                    }}
                    className="article-link"
                  >
                    Read Full Article
                  </a>
                  {isClicked && <span className="badge">✓ Viewed</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Array.isArray(articles) && articles.length === 0 && (
        <p>No articles found. Try searching for something else.</p>
      )}
    </div>
  );
}

export default App;
