import { Link } from 'react-router-dom';
import { EXTENSION_REPO, SUPPORT_EMAIL, SUPPORT_URL } from '../config.js';

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <span>Apple Queue, free and open source.</span>
        <nav>
          <Link to="/">Overview</Link>
          <Link to="/setup">Set up</Link>
          <Link to="/shortcuts">Shortcuts</Link>
          <Link to="/docs">Docs</Link>
          <a href={SUPPORT_URL} target="_blank" rel="noopener">GitHub support</a>
          <a href={SUPPORT_EMAIL}>Email support</a>
          <a href={EXTENSION_REPO} target="_blank" rel="noopener">Source</a>
        </nav>
      </div>
    </footer>
  );
}
