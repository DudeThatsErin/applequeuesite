import CopyButton from './CopyButton.jsx';

/* Replaces the old document-level copy-button wiring: a <pre> that carries its
   own button, with the copied text passed in rather than scraped from the DOM. */
export default function Copyable({ text, label = 'Copy', className = '' }) {
  return (
    <pre className={`copyable ${className}`.trim()}>
      <code>{text}</code>
      <CopyButton text={text} label={label} />
    </pre>
  );
}
