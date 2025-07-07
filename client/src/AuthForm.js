import React, { useState } from 'react';

const AuthForm = ({ setShowPopup, handleLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'register' or 'login'
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = mode === 'login' ? 'login' : 'register';

    try {
      const payload =
        mode === 'login'
          ? { email, password }
          : { username, email, password };

      const response = await fetch(`http://localhost:5000/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Instead of just setting userId directly, call handleLogin:
      await handleLogin(data.user.id, data.user.username);  // Pass both id and username


      setShowPopup(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-form">
      <h3>{mode === 'login' ? 'Login' : 'Register'}</h3>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
      </form>

      <p>
        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
        <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="toggle-link">
          {mode === 'login' ? 'Register' : 'Login'}
        </span>
      </p>
    </div>
  );
};

export default AuthForm;
