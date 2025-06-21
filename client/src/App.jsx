import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup/Signup';
import MyPage from './pages/MyPage/MyPage';
import './App.css';
import DiscussionCreateFormPage from './pages/discussion/create/DiscussionCreateFormPage';
import DiscussionDetailPage from './pages/discussion/detail/DiscussionDetailPage';

function App() {
  return (
    <Router>
      <div className="app">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/discussion/new" element={<DiscussionCreateFormPage />} />
            <Route path="/discussion/:id" element={<DiscussionDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
