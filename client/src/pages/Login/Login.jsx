import React from 'react';
import Header from '../../components/Header/Header';
import './Login.css';

const Login = () => {
  const handleGithubLogin = () => {
    
    // GitHub OAuth 인증 URL
    const githubURL = `${import.meta.env.VITE_API_URL}/oauth2/authorization/github`;
    
    // GitHub 로그인 페이지로 리다이렉트
    window.location.href = githubURL;
  };

  return (
    <div className="login-container">
      <Header />
      <div className="login-content">
        <button className="github-login-btn" onClick={handleGithubLogin}>
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
