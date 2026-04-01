import { useState, useEffect, useRef, useCallback } from 'react';
import { addressSuggestRequestUrl, normalizeNominatimResults } from '../lib/addressSuggest.js';

const DEBOUNCE_MS = 420;
const MIN_QUERY_LEN = 3;
const MAX_SUGGESTIONS = 8;

/**
 * Single-line address field with debounced OpenStreetMap (Nominatim) suggestions.
 *
 * @param {{ id?: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }} props
 */
export default function AddressSuggestInput({ id = 'address-suggest', value, onChange, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [highlight, setHighlight] = useState(-1);
  const [fetchError, setFetchError] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(0);
  const seqRef = useRef(0);

  const runSearch = useCallback(async (q) => {
    const query = String(q).trim();
    if (query.length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setLoading(false);
      setFetchError(false);
      return;
    }
    const seq = ++seqRef.current;
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(addressSuggestRequestUrl(query));
      if (!res.ok) throw new Error('bad status');
      const json = await res.json();
      if (seq !== seqRef.current) return;
      setSuggestions(normalizeNominatimResults(json).slice(0, MAX_SUGGESTIONS));
    } catch {
      if (seq !== seqRef.current) return;
      setSuggestions([]);
      setFetchError(true);
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (disabled) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const q = String(value).trim();
    if (q.length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      runSearch(q);
      setOpen(true);
      setHighlight(-1);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(debounceRef.current);
  }, [value, disabled, runSearch]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = useCallback(
    (label) => {
      onChange(label);
      setOpen(false);
      setSuggestions([]);
      setHighlight(-1);
    },
    [onChange]
  );

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      pick(suggestions[highlight].label);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && !disabled && String(value).trim().length >= MIN_QUERY_LEN;

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <input
        id={id}
        type="text"
        autoComplete="street-address"
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={showList && suggestions.length > 0}
        aria-controls={showList ? `${id}-address-suggest-list` : undefined}
        aria-autocomplete="list"
        className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text placeholder:text-pos-muted/60 outline-none focus:ring-2 focus:ring-pos-accent"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        onFocus={() => {
          if (String(value).trim().length >= MIN_QUERY_LEN && suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {fetchError ? (
        <p className="mt-1 text-xs text-pos-muted">Could not load address suggestions. Check network or proxy.</p>
      ) : null}
      {showList && (loading || suggestions.length > 0) ? (
        <ul
          id={`${id}-address-suggest-list`}
          role="listbox"
          className="issue-address-suggest-list absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-pos-border bg-pos-panel py-1 shadow-xl"
        >
          {loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-pos-muted">Searching…</li>
          ) : null}
          {suggestions.map((s, idx) => (
            <li
              key={String(s.placeId)}
              role="option"
              aria-selected={idx === highlight}
              className={`cursor-pointer px-3 py-2 text-left text-sm text-pos-text ${
                idx === highlight ? 'bg-pos-accent/20' : 'hover:bg-pos-border/40'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s.label);
              }}
              onMouseEnter={() => setHighlight(idx)}
            >
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
