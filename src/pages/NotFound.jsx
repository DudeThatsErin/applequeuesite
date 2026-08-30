import { Link } from 'react-router-dom';
import usePageMeta from '../usePageMeta.js';

export default function NotFound() {
  usePageMeta('Not found · Apple Queue', 'That page does not exist.');

  return (
    <div className="wrap narrow">
      <section className="hero">
        <span className="eyebrow">404</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)' }}>That page isn't here</h1>
        <p className="sub">The site is three pages deep: an overview, the setup wizard, and the docs.</p>
        <div className="cta">
          <Link className="btn primary" to="/">Back to the overview</Link>
          <Link className="btn ghost" to="/docs">Read the docs</Link>
        </div>
      </section>
    </div>
  );
}
