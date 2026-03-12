import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header/Header';
import LoadingSpinner from './components/ui/LoadingSpinner/LoadingSpinner';

const Home = React.lazy(() => import('./pages/Home'));
const Signup = React.lazy(() => import('./pages/Signup/Signup'));
const SignupComplete = React.lazy(() => import('./pages/Signup/SignupComplete'));
const MyPage = React.lazy(() => import('./pages/MyPage/MyPage'));
const DiscussionCreateFormPage = React.lazy(() => import('./pages/discussion/create/DiscussionCreateFormPage'));
const DiscussionDetailPage = React.lazy(() => import('./pages/discussion/detail/DiscussionDetailPage'));
const DiscussionCreateCompletePage = React.lazy(() => import('./pages/discussion/create/DiscussionCreateCompletePage'));
const DiscussionEditFormPage = React.lazy(() => import('./pages/discussion/edit/DiscussionEditFormPage'));
const SearchResultPage = React.lazy(() => import('./pages/discussion/search/SearchResultPage'));
const MyDiscussionPage = React.lazy(() => import('./pages/discussion/my/MyDiscussionPage'));
const ScrapDiscussionPage = React.lazy(() => import('./pages/discussion/scrap/ScrapDiscussionPage'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app" data-color-mode="light">
          <Header />
          <main className="main-content">
            <Suspense fallback={<LoadingSpinner message="페이지를 불러오는 중..." />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discussion" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signup/complete" element={<SignupComplete />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/discussion/new" element={<DiscussionCreateFormPage />} />
                <Route path="/discussion/my" element={<MyDiscussionPage />} />
                <Route path="/discussion/scrap" element={<ScrapDiscussionPage />} />
                <Route path="/discussion/:id" element={<DiscussionDetailPage />} />
                <Route path="/discussion/:id/complete" element={<DiscussionCreateCompletePage />} />
                <Route path="/discussion/:id/edit" element={<DiscussionEditFormPage />} />
                <Route path="/discussion/search" element={<SearchResultPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
