"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function snapMinute(m: number): string {
  const snapped = Math.round(m / 15) * 15;
  return (snapped === 60 ? 45 : snapped).toString().padStart(2, "0");
}

function parseYmd(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const d = new Date(`${ymd}T12:00:00`);
  return isNaN(d.getTime()) ? undefined : d;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  maxDate,
  placeholder = "Escolher data e horário",
  className,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDay = React.useMemo(() => parseYmd(date), [date]);

  const hour = React.useMemo(() => {
    const h = parseInt((time || "08:00").split(":")[0] ?? "8", 10);
    return Math.min(23, Math.max(0, h || 0)).toString().padStart(2, "0");
  }, [time]);

  const minute = React.useMemo(() => {
    const m = parseInt((time || "08:00").split(":")[1] ?? "0", 10);
    return snapMinute(m || 0);
  }, [time]);

  const minTs = React.useMemo(() => {
    if (!minDate) return null;
    const d = new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [minDate]);

  const maxTs = React.useMemo(() => {
    if (!maxDate) return null;
    const d = new Date(maxDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [maxDate]);

  const isDisabledDay = React.useCallback(
    (d: Date) => {
      const t = new Date(d).setHours(12, 0, 0, 0);
      if (minTs != null && t < minTs) return true;
      if (maxTs != null && t > maxTs) return true;
      return false;
    },
    [minTs, maxTs],
  );

  const display = React.useMemo(() => {
    if (!date || !time) return null;
    const d = new Date(`${date}T${time}:00`);
    if (isNaN(d.getTime())) return null;
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  }, [date, time]);

  const setHour = (h: string) => onTimeChange(`${h}:${minute}`);
  const setMinute = (m: string) => onTimeChange(`${hour}:${m}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-left transition-colors",
            "bg-[#0a0a0a] border border-[#2a2a2e] text-white",
            "hover:bg-[#141416] focus:outline-none focus:border-amber-500/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !display && "text-gray-500",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-amber-400" />
          {display ?? <span>{placeholder}</span>}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[300px] p-0 bg-[#1c1c1e] border-[#2a2a2e] text-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Só monta o calendário com o popover aberto — evita custo quando fechado */}
        {open && (
          <DayPicker
            mode="single"
            locale={ptBR}
            selected={selectedDay}
            onSelect={(d) => {
              if (d) onDateChange(toYmd(d));
            }}
            disabled={isDisabledDay}
            showOutsideDays
            className="w-full p-3"
            classNames={{
              root: "w-full",
              months: "w-full relative",
              month: "w-full space-y-3",
              month_caption: "flex justify-center items-center h-9 px-10",
              caption_label: "text-sm font-semibold text-white capitalize",
              nav: "absolute inset-x-0 top-0 flex items-center justify-between",
              button_previous: cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-lg",
                "text-gray-400 hover:text-white hover:bg-[#2a2a2e] transition-colors",
              ),
              button_next: cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-lg",
                "text-gray-400 hover:text-white hover:bg-[#2a2a2e] transition-colors",
              ),
              month_grid: "w-full border-collapse",
              weekdays: "grid grid-cols-7 w-full",
              weekday: "text-[11px] font-medium text-gray-500 text-center py-1 uppercase",
              weeks: "w-full",
              week: "grid grid-cols-7 w-full mt-0.5",
              day: "relative p-0 text-center aspect-square",
              day_button: cn(
                "h-full w-full rounded-lg text-sm font-medium text-gray-200",
                "hover:bg-amber-500/15 hover:text-amber-200 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
              ),
              selected:
                "[&>button]:bg-amber-500 [&>button]:text-black [&>button]:hover:bg-amber-400 [&>button]:hover:text-black",
              today:
                "[&>button]:bg-amber-500/15 [&>button]:text-amber-300 [&>button]:font-semibold",
              outside: "[&>button]:text-gray-600 [&>button]:opacity-40",
              disabled:
                "[&>button]:text-gray-700 [&>button]:opacity-30 [&>button]:pointer-events-none",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ),
            }}
          />
        )}

        <div className="border-t border-[#2a2a2e] px-3 py-3 flex items-center gap-2 bg-[#161618]">
          <Clock className="h-4 w-4 text-amber-400 shrink-0" />
          <label className="sr-only" htmlFor="dtp-hour">Hora</label>
          <select
            id="dtp-hour"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className={cn(
              "flex-1 h-9 rounded-lg px-2 text-sm font-medium appearance-none cursor-pointer",
              "bg-[#0a0a0a] border border-[#2a2a2e] text-white",
              "focus:outline-none focus:border-amber-500/50",
            )}
          >
            {HOURS.map((h) => (
              <option key={h} value={h} className="bg-[#1c1c1e]">
                {h}
              </option>
            ))}
          </select>

          <span className="text-gray-500 font-semibold">:</span>

          <label className="sr-only" htmlFor="dtp-minute">Minuto</label>
          <select
            id="dtp-minute"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className={cn(
              "flex-1 h-9 rounded-lg px-2 text-sm font-medium appearance-none cursor-pointer",
              "bg-[#0a0a0a] border border-[#2a2a2e] text-white",
              "focus:outline-none focus:border-amber-500/50",
            )}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m} className="bg-[#1c1c1e]">
                {m}
              </option>
            ))}
          </select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
