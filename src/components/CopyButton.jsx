import { useEffect, useRef, useState } from 'react';

/* The copy affordance on its own, for places that aren't a <pre>. */
export default function CopyButton({ text, label = 'Copy', className = 'copy-btn', style }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const value = String(text ?? '').replace(/\s+$/, '');
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers, and any context where the clipboard API is blocked.
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        document.body.removeChild(ta);
        return;
      }
      document.body.removeChild(ta);
    }

    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      className={`${className}${copied ? ' done' : ''}`}
      style={style}
      onClick={copy}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
