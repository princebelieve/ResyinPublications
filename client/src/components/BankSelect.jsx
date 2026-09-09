import { useEffect, useMemo, useState } from "react";

export default function BankSelect({ banks = [], value, onChange, required = false, disabled = false, id = "bank-select" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectedBank = useMemo(() => banks.find((bank) => String(bank.code) === String(value)), [banks, value]);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return banks;

    // A broad "contains" search leaves unrelated banks in the list. Keep the
    // exact name-start matches first, followed only by matches at a word start.
    const nameStarts = [];
    const wordStarts = [];
    banks.forEach((bank) => {
      const name = bank.name.toLowerCase();
      if (name.startsWith(term)) nameStarts.push(bank);
      else if (name.split(/[\s-]+/).some((word) => word.startsWith(term))) wordStarts.push(bank);
    });
    return [...nameStarts, ...wordStarts];
  }, [banks, query]);

  useEffect(() => {
    if (selectedBank && !open) setQuery(selectedBank.name);
    if (!selectedBank && !value && !open) setQuery("");
  }, [selectedBank, value, open]);

  function choose(bank) {
    onChange(String(bank.code));
    setQuery(bank.name);
    setOpen(false);
  }

  return (
    <div className="bank-select">
      <input type="hidden" value={value || ""} required={required} />
      <input
        id={id}
        type="search"
        value={query}
        disabled={disabled}
        placeholder="Search and select your bank"
        aria-label="Search and select your bank"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-autocomplete="list"
        onFocus={() => { setQuery(""); setOpen(true); }}
        onChange={(event) => { if (value) onChange(""); setQuery(event.target.value); setOpen(true); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && !disabled && (
        <div id={`${id}-options`} className="bank-select-options" role="listbox">
          {matches.length ? matches.map((bank) => <button key={bank.code} type="button" role="option" aria-selected={String(bank.code) === String(value)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(bank)}>{bank.name}</button>) : <p>No bank found. Try a different name.</p>}
        </div>
      )}
    </div>
  );
}
