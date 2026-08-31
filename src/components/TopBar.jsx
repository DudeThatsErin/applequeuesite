import { Link, NavLink } from 'react-router-dom';
import { EXTENSION_REPO, SUPPORT_URL } from '../config.js';
import ThemeToggle from './ThemeToggle.jsx';

// NavLink sets aria-current="page" on the active link, which is what the
// stylesheet keys off.
export default function TopBar() {
  return (
    <header className="topbar">
      <Link className="brand" to="/"><span className="mark">Q</span> Apple Queue</Link>
      <nav>
        <NavLink to="/" end>Overview</NavLink>
        <NavLink to="/setup">Set up</NavLink>
        <NavLink to="/shortcuts">Shortcuts</NavLink>
        <NavLink to="/docs">Docs</NavLink>
        <a href={SUPPORT_URL} target="_blank" rel="noopener">Support</a>
        <a href={EXTENSION_REPO} target="_blank" rel="noopener">GitHub</a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
