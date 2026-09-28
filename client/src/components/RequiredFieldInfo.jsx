import { useId, useState } from "react";

export default function RequiredFieldInfo({ field, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <span className="required-field-info">
    <button type="button" className="required-field-info-button" aria-label={`Why ${field} is required`} aria-expanded={open} aria-controls={id} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(!open); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>i</button>
    <span id={id} className="required-field-info-text" hidden={!open}>{children}</span>
  </span>;
}
