import { useRef, useEffect, useState, useMemo } from 'react';
import { DayPicker, UI } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/style.css';

/** Max visible rows in month/year lists (rest scrolls). */
const CAPTION_DROPDOWN_VISIBLE_ROWS = 5;

/**
 * Replaces react-day-picker’s native select caption dropdowns so the open list
 * matches the dark theme and shows at most {@link CAPTION_DROPDOWN_VISIBLE_ROWS} rows.
 */
function IssueCaptionDropdown(props) {
  const { options, className, components, classNames, ...selectProps } = props;
  const { value, onChange, disabled, style, 'aria-label': ariaLabel } = selectProps;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const { Chevron } = components;

  const selectedOption = options?.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocMouse(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onDocKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouse);
    document.addEventListener('keydown', onDocKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouse);
      document.removeEventListener('keydown', onDocKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current || selectedOption == null) return;
    const el = listRef.current.querySelector(`[data-opt-value="${selectedOption.value}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, selectedOption]);

  const fireChange = (v) => {
    onChange({ target: { value: String(v) } });
    setOpen(false);
  };

  const listMaxHeight = `calc(2.25rem * ${CAPTION_DROPDOWN_VISIBLE_ROWS})`;

  return (
    <span
      ref={rootRef}
      data-disabled={disabled ? 'true' : undefined}
      className={classNames[UI.DropdownRoot]}
    >
      <button
        type="button"
        disabled={disabled}
        className={['issue-rdp-dropdown-trigger', className].filter(Boolean).join(' ')}
        style={style}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={classNames[UI.CaptionLabel]} aria-hidden>
          {selectedOption?.label}
          <Chevron orientation="down" size={18} className={classNames[UI.Chevron]} />
        </span>
      </button>
      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="issue-rdp-dropdown-list absolute left-0 top-full z-[100] mt-1 min-w-[10.5rem] overflow-y-auto rounded-lg border border-pos-border bg-pos-panel py-1 shadow-xl"
          style={{ maxHeight: listMaxHeight }}
        >
          {options?.map((opt) => (
            <li
              key={opt.value}
              role="option"
              tabIndex={-1}
              aria-selected={opt.value === value}
              aria-disabled={opt.disabled || undefined}
              data-opt-value={opt.value}
              className={[
                'cursor-pointer px-3 py-2 text-left text-sm text-pos-text',
                opt.disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-pos-border/40',
                opt.value === value ? 'bg-pos-accent/25 font-medium text-pos-accent' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!opt.disabled) fireChange(opt.value);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}

function CalendarIcon({ className = 'h-5 w-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
      />
    </svg>
  );
}

function dateFromYmd(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

/**
 * @param {{ id?: string; value: string; onChange: (ymd: string) => void; disabled?: boolean }} props
 */
export default function BirthdayPicker({ id, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = useMemo(() => dateFromYmd(value), [value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const label = selected ? format(selected, 'MMMM d, yyyy') : '';

  return (
    <div className="relative min-w-0" ref={wrapRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-left text-sm outline-none focus:ring-2 focus:ring-pos-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? 'text-pos-text' : 'text-pos-muted'}>
          {selected ? label : 'Select birthday'}
        </span>
        <CalendarIcon className="h-5 w-5 shrink-0 text-pos-muted" />
      </button>
      {open ? (
        <div
          className="issue-birthday-popover absolute left-0 top-full z-50 mt-1 rounded-xl border border-pos-border bg-pos-panel p-1 shadow-xl"
          role="dialog"
          aria-label="Choose birthday"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) onChange(format(d, 'yyyy-MM-dd'));
              else onChange('');
              setOpen(false);
            }}
            disabled={{ after: new Date() }}
            captionLayout="dropdown"
            startMonth={new Date(1920, 0)}
            endMonth={new Date()}
            defaultMonth={selected || new Date(new Date().getFullYear() - 25, 0)}
            className="issue-rdp"
            components={{ Dropdown: IssueCaptionDropdown }}
          />
        </div>
      ) : null}
    </div>
  );
}
