import * as React from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  id,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayValue = React.useMemo(() => {
    if (!value) return '';
    try {
      return formatDate(value);
    } catch {
      return value;
    }
  }, [value]);

  const handleSelect = (dateStr: string) => {
    if (onChange) {
      onChange(dateStr);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-left',
            !value && 'text-slate-400',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{displayValue || placeholder}</span>
          </div>

          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar value={value} onChange={handleSelect} minDate={minDate} maxDate={maxDate} />
      </PopoverContent>
    </Popover>
  );
}
