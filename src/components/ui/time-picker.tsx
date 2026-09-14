import * as React from 'react';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const COMMON_TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'
];

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  className,
  disabled = false,
  id,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse hour, minute, period if valid
  const parsed = React.useMemo(() => {
    if (!value) return { hour: '09', minute: '00', period: 'AM' };
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      const p = (match[3] || 'AM').toUpperCase();
      return { hour: h, minute: m, period: p };
    }
    return { hour: '09', minute: '00', period: 'AM' };
  }, [value]);

  const [selectedHour, setSelectedHour] = React.useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = React.useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = React.useState(parsed.period);

  React.useEffect(() => {
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [parsed]);

  const handleSlotSelect = (slot: string) => {
    if (onChange) {
      onChange(slot);
    }
    setOpen(false);
  };

  const handleCustomApply = () => {
    const formatted = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    if (onChange) {
      onChange(formatted);
    }
    setOpen(false);
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
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{value || placeholder}</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {/* Custom Time Selector */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select Time
            </span>
            <div className="flex items-center justify-between gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
              {/* Hours */}
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-600"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>

              <span className="font-bold text-slate-400">:</span>

              {/* Minutes */}
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-600"
              >
                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* AM / PM */}
              <div className="flex rounded border border-slate-200 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  className={cn(
                    'px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer',
                    selectedPeriod === 'AM' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  className={cn(
                    'px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer',
                    selectedPeriod === 'PM' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  PM
                </button>
              </div>

              <button
                type="button"
                onClick={handleCustomApply}
                className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium cursor-pointer"
                title="Apply custom time"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Preset Slots */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Quick Presets
            </span>
            <div className="grid grid-cols-4 gap-1 max-h-36 overflow-y-auto pr-1">
              {COMMON_TIME_SLOTS.map((slot) => {
                const isSelected = value === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    className={cn(
                      'px-1.5 py-1 text-[11px] rounded font-medium transition-colors text-center cursor-pointer truncate',
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
