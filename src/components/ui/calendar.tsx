import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/common/Button';

export interface CalendarProps {
  value?: string | Date;
  onChange?: (dateStr: string) => void;
  className?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function Calendar({
  value,
  onChange,
  className,
  minDate,
  maxDate,
}: CalendarProps) {
  const selectedDate = React.useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parts = value.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(value);
  }, [value]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    return selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : new Date();
  });

  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const minDateTime = React.useMemo(() => {
    if (!minDate) return null;
    const d = minDate instanceof Date ? new Date(minDate) : new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [minDate]);

  const maxDateTime = React.useMemo(() => {
    if (!maxDate) return null;
    const d = maxDate instanceof Date ? new Date(maxDate) : new Date(maxDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [maxDate]);

  const isDateDisabled = (d: Date) => {
    const checkTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (minDateTime && checkTime < minDateTime) return true;
    if (maxDateTime && checkTime > maxDateTime) return true;
    return false;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Generate grid days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = React.useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const str = formatDateToISO(d);
      days.push({ date: d, isCurrentMonth: false, dateStr: str });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const str = formatDateToISO(d);
      days.push({ date: d, isCurrentMonth: true, dateStr: str });
    }

    // Next month padding days to complete grid (up to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const str = formatDateToISO(d);
      days.push({ date: d, isCurrentMonth: false, dateStr: str });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, daysInPrevMonth]);

  function formatDateToISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isSelected = (d: Date) => {
    if (!selectedDate) return false;
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleSelectDay = (dateStr: string) => {
    if (onChange) {
      onChange(dateStr);
    }
  };

  const handleToday = () => {
    const now = new Date();
    const iso = formatDateToISO(now);
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    if (onChange) onChange(iso);
  };

  const handleClear = () => {
    if (onChange) onChange('');
  };

  return (
    <div className={cn('p-3 bg-white select-none w-72', className)}>
      {/* Header Month / Year controls */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-slate-900">
          {MONTH_NAMES[month]} {year}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAYS_OF_WEEK.map((day) => (
          <span key={day} className="text-[11px] font-semibold text-slate-400 py-1">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map(({ date, isCurrentMonth, dateStr }, index) => {
          const selected = isSelected(date);
          const today = isToday(date);
          const disabled = isDateDisabled(date);

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && handleSelectDay(dateStr)}
              className={cn(
                'h-8 w-8 text-xs rounded-lg font-medium flex items-center justify-center transition-colors mx-auto',
                disabled
                  ? 'text-slate-300 opacity-30 cursor-not-allowed hover:bg-transparent'
                  : 'cursor-pointer',
                !disabled && !isCurrentMonth && 'text-slate-300 hover:text-slate-600',
                !disabled && isCurrentMonth && !selected && 'text-slate-700 hover:bg-slate-100',
                !disabled && today && !selected && 'border border-blue-600 text-blue-600 font-bold',
                !disabled && selected && 'bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xs'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
        <button
          type="button"
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  );
}
