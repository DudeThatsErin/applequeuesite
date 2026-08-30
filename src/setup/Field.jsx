/* One labelled text input with its hint and, when the step won't advance, the
   reason why. */
export default function Field({ id, label, hint, value, onChange, error, mono, type = 'text', placeholder }) {
  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {hint && <p className="hint">{hint}</p>}
      <input
        type={type}
        id={id}
        className={mono ? 'mono' : undefined}
        value={value}
        placeholder={placeholder}
        spellCheck="false"
        required
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
