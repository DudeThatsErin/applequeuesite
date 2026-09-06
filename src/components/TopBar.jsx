import { Link, NavLink } from 'react-router-dom';
import { useRef } from 'react';
import { EXTENSION_REPO, SUPPORT_EMAIL, SUPPORT_URL } from '../config.js';
import ThemeToggle from './ThemeToggle.jsx';

// NavLink sets aria-current="page" on the active link, which is what the
// stylesheet keys off.
function NavigationLinks({ onNavigate }) {
  return (
    <>
      <NavLink to="/" end onClick={onNavigate}>Overview</NavLink>
      <NavLink to="/setup" onClick={onNavigate}>Set up</NavLink>
      <NavLink to="/shortcuts" onClick={onNavigate}>Shortcuts</NavLink>
      <NavLink to="/docs" onClick={onNavigate}>Docs</NavLink>
      <a href={SUPPORT_URL} target="_blank" rel="noopener" onClick={onNavigate}>GitHub support</a>
      <a href={SUPPORT_EMAIL} onClick={onNavigate}>Email support</a>
      <a href={EXTENSION_REPO} target="_blank" rel="noopener" onClick={onNavigate}>GitHub</a>
    </>
  );
}

export default function TopBar() {
  const mobileMenu = useRef(null);
  const closeMobileMenu = () => mobileMenu.current?.removeAttribute('open');

  return (
    <header className="topbar">
      <Link className="brand" to="/"><span className="mark">Q</span> Apple Queue</Link>
      <nav className="desktop-navigation"><NavigationLinks /></nav>
      <ThemeToggle />
      <details className="mobile-navigation" ref={mobileMenu}>
        <summary aria-label="Open navigation">Menu</summary>
        <nav aria-label="Mobile navigation"><NavigationLinks onNavigate={closeMobileMenu} /></nav>
      </details>
    </header>
  );
}
