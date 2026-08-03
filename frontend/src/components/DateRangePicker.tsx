import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export type DateRangeValue = {
  start: string;
  end: string;
};

type PresetId =
  | 'today'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  placeholder?: string;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseYmd(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatRangeLabel(start: string, end: string) {
  if (!start && !end) return '';
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function getPresetRange(id: PresetId, today = startOfDay(new Date())): DateRangeValue | null {
  if (id === 'custom') return null;
  if (id === 'today') {
    const s = toYmd(today);
    return { start: s, end: s };
  }
  if (id === 'last7') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { start: toYmd(start), end: toYmd(today) };
  }
  if (id === 'last30') {
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    return { start: toYmd(start), end: toYmd(today) };
  }
  if (id === 'thisMonth') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: toYmd(start), end: toYmd(end) };
  }
  if (id === 'lastMonth') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: toYmd(start), end: toYmd(end) };
  }
  return null;
}

function detectPreset(start: string, end: string): PresetId {
  if (!start || !end) return 'custom';
  const presets: PresetId[] = ['today', 'last7', 'last30', 'thisMonth', 'lastMonth'];
  for (const id of presets) {
    const range = getPresetRange(id);
    if (range && range.start === start && range.end === end) return id;
  }
  return 'custom';
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'custom', label: 'Custom Range' },
];

function MonthCalendar({
  viewDate,
  draftStart,
  draftEnd,
  hoverDate,
  onSelectDay,
  onHoverDay,
  hideTitle = false,
}: {
  viewDate: Date;
  draftStart: string;
  draftEnd: string;
  hoverDate: string | null;
  onSelectDay: (ymd: string) => void;
  onHoverDay: (ymd: string | null) => void;
  hideTitle?: boolean;
}) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);

  const start = parseYmd(draftStart);
  const end = parseYmd(draftEnd);
  const hover = hoverDate ? parseYmd(hoverDate) : null;

  let rangeStart = start;
  let rangeEnd = end || (start && hover && !end ? hover : end);
  if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
    const tmp = rangeStart;
    rangeStart = rangeEnd;
    rangeEnd = tmp;
  }

  const cells: Array<{ day: number | null; ymd?: string }> = [];
  for (let i = 0; i < firstDow; i += 1) cells.push({ day: null });
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({ day, ymd: `${year}-${pad(month + 1)}-${pad(day)}` });
  }

  return (
    <div className="w-[240px]">
      {!hideTitle && (
        <div className="mb-2 text-center text-sm font-semibold text-gray-800">
          {MONTHS[month]} {year}
        </div>
      )}
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-gray-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.ymd) {
            return <div key={`e-${idx}`} className="h-8" />;
          }
          const dt = parseYmd(cell.ymd)!;
          const isStart = draftStart === cell.ymd;
          const isEnd = draftEnd === cell.ymd;
          const inRange =
            !!rangeStart &&
            !!rangeEnd &&
            dt >= startOfDay(rangeStart) &&
            dt <= startOfDay(rangeEnd);
          const isEndpoint = isStart || isEnd;

          return (
            <button
              key={cell.ymd}
              type="button"
              onClick={() => onSelectDay(cell.ymd!)}
              onMouseEnter={() => onHoverDay(cell.ymd!)}
              onMouseLeave={() => onHoverDay(null)}
              className={[
                'h-8 rounded-sm transition',
                isEndpoint
                  ? 'bg-[#0F3C66] font-semibold text-white'
                  : inRange
                    ? 'bg-[#0F3C66]/15 text-[#0F3C66]'
                    : 'text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
  className = '',
  placeholder = 'Select date range',
}: DateRangePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(value.start);
  const [draftEnd, setDraftEnd] = useState(value.end);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [preset, setPreset] = useState<PresetId>(() => detectPreset(value.start, value.end));
  const [leftMonth, setLeftMonth] = useState(() => {
    const s = parseYmd(value.start) || new Date();
    return new Date(s.getFullYear(), s.getMonth(), 1);
  });

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);
  const displayValue = formatRangeLabel(value.start, value.end);

  useEffect(() => {
    if (!open) return;
    setDraftStart(value.start);
    setDraftEnd(value.end);
    setPickingEnd(false);
    setPreset(detectPreset(value.start, value.end));
    const s = parseYmd(value.start) || new Date();
    setLeftMonth(new Date(s.getFullYear(), s.getMonth(), 1));
  }, [open, value.start, value.end]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const applyPreset = (id: PresetId) => {
    setPreset(id);
    if (id === 'custom') {
      setPickingEnd(false);
      return;
    }
    const range = getPresetRange(id);
    if (!range) return;
    setDraftStart(range.start);
    setDraftEnd(range.end);
    setPickingEnd(false);
    const s = parseYmd(range.start)!;
    setLeftMonth(new Date(s.getFullYear(), s.getMonth(), 1));
  };

  const onSelectDay = (ymd: string) => {
    setPreset('custom');
    if (!pickingEnd || !draftStart) {
      setDraftStart(ymd);
      setDraftEnd('');
      setPickingEnd(true);
      return;
    }
    if (ymd < draftStart) {
      setDraftStart(ymd);
      setDraftEnd(draftStart);
    } else {
      setDraftEnd(ymd);
    }
    setPickingEnd(false);
  };

  const handleClear = () => {
    setDraftStart('');
    setDraftEnd('');
    setPickingEnd(false);
    setPreset('custom');
    onChange({ start: '', end: '' });
    setOpen(false);
  };

  const handleApply = () => {
    let start = draftStart;
    let end = draftEnd || draftStart;
    if (start && end && start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    onChange({ start, end });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2.5 text-left text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
      >
        <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
          <div className="flex flex-col md:flex-row">
            <div className="border-b border-gray-200 bg-gray-50 md:w-40 md:border-b-0 md:border-r">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className={[
                    'block w-full px-4 py-2.5 text-left text-sm transition',
                    preset === p.id
                      ? 'bg-[#0F3C66] font-medium text-white'
                      : 'text-gray-700 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              <div className="flex flex-col gap-6 sm:flex-row">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLeftMonth((m) => addMonths(m, -1))}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center text-sm font-semibold text-gray-800">
                      {MONTHS[leftMonth.getMonth()]} {leftMonth.getFullYear()}
                    </div>
                    <div className="w-6" />
                  </div>
                  <MonthCalendar
                    viewDate={leftMonth}
                    draftStart={draftStart}
                    draftEnd={draftEnd}
                    hoverDate={hoverDate}
                    onSelectDay={onSelectDay}
                    onHoverDay={setHoverDate}
                    hideTitle
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="w-6" />
                    <div className="flex-1 text-center text-sm font-semibold text-gray-800">
                      {MONTHS[rightMonth.getMonth()]} {rightMonth.getFullYear()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLeftMonth((m) => addMonths(m, 1))}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <MonthCalendar
                    viewDate={rightMonth}
                    draftStart={draftStart}
                    draftEnd={draftEnd}
                    hoverDate={hoverDate}
                    onSelectDay={onSelectDay}
                    onHoverDay={setHoverDate}
                    hideTitle
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-white px-4 py-3">
            <span className="mr-auto text-sm text-gray-600">
              {formatRangeLabel(draftStart, draftEnd || draftStart) || '—'}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md bg-[#0F3C66] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#154b8a]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-md bg-[#0F3C66] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#154b8a]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
