import { Link } from 'react-router-dom';
import { EXTENSION_REPO } from '../config.js';

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <span>Apple Queue, free and open source.</span>
        <nav>
          <Link to="/">Overview</Link>
          <Link to="/setup">Set up</Link>
          <Link to="/docs">Docs</Link>
          <a href={EXTENSION_REPO} target="_blank" rel="noopener">Source</a>
        </nav>
      </div>
    </footer>
  );
}
