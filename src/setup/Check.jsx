export default function Check({ checked, onChange, title, description }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="t">{title}</span>
        <span className="d">{description}</span>
      </span>
    </label>
  );
}
