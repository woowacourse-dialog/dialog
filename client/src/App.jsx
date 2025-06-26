import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Signup from './pages/Signup/Signup';
import MyPage from './pages/MyPage/MyPage';
import './App.css';
import DiscussionCreateFormPage from './pages/discussion/create/DiscussionCreateFormPage';
import DiscussionDetailPage from './pages/discussion/detail/DiscussionDetailPage';
import DiscussionEditFormPage from './pages/discussion/edit/DiscussionEditFormPage';
import SearchResultPage from './pages/discussion/search/SearchResultPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/discussion/new" element={<DiscussionCreateFormPage />} />
              <Route path="/discussion/:id" element={<DiscussionDetailPage />} />
              <Route path="/discussion/:id/edit" element={<DiscussionEditFormPage />} />
              <Route path="/discussion/search" element={<SearchResultPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
