import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import TopBar from './components/TopBar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Docs from './pages/Docs.jsx';
import Setup from './pages/Setup.jsx';
import Shortcuts from './pages/Shortcuts.jsx';
import NotFound from './pages/NotFound.jsx';

/* Client-side routing loses the browser's own anchor handling, so /docs/#api
   has to be scrolled to by hand once the target section is mounted. */
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ block: 'start' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToHash />
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* React Router matches these with or without the trailing slash. */}
        <Route path="/setup" element={<Setup />} />
        <Route path="/shortcuts" element={<Shortcuts />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
