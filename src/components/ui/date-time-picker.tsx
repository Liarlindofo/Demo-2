"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function to12h(hours24: number): { hour: string; ampm: "AM" | "PM" } {
  const ampm: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";
  let h = hours24 % 12;
  if (h === 0) h = 12;
  return { hour: h.toString().padStart(2, "0"), ampm };
}

function to24h(hour12: string, ampm: string): number {
  let h = parseInt(hour12, 10);
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h;
}

/** Snap minutes to nearest step of 15 (00 / 15 / 30 / 45). */
function snapMinute(m: number): string {
  const snapped = Math.round(m / 15) * 15;
  const normalized = snapped === 60 ? 45 : snapped;
  return normalized.toString().padStart(2, "0");
}

export interface DateTimePickerProps {
  /** Date as YYYY-MM-DD */
  date: string;
  /** Time as HH:mm (24h) */
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  /** Minimum selectable calendar day (Date at local midnight) */
  minDate?: Date;
  /** Maximum selectable calendar day */
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

  const selectedDay = React.useMemo(() => {
    if (!date) return undefined;
    const d = new Date(`${date}T12:00:00`);
    return isNaN(d.getTime()) ? undefined : d;
  }, [date]);

  const { hour, minute, ampm } = React.useMemo(() => {
    const [hStr = "8", mStr = "0"] = (time || "08:00").split(":");
    const h24 = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const { hour: h12, ampm: ap } = to12h(h24);
    return { hour: h12, minute: snapMinute(m), ampm: ap };
  }, [time]);

  const emitTime = (h12: string, m: string, ap: string) => {
    const h24 = to24h(h12, ap);
    onTimeChange(`${h24.toString().padStart(2, "0")}:${m}`);
  };

  const display = React.useMemo(() => {
    if (!date || !time) return null;
    const d = new Date(`${date}T${time}:00`);
    if (isNaN(d.getTime())) return null;
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  }, [date, time]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-auto justify-start text-left font-normal rounded-xl px-3.5 py-2.5",
            "bg-[#0a0a0a] border-[#2a2a2e] text-white hover:bg-[#141416] hover:text-white",
            "focus-visible:ring-amber-500/40 focus-visible:border-amber-500/40",
            !display && "text-gray-500",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-amber-400" />
          {display ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 bg-[#1c1c1e] border-[#2a2a2e] text-white rounded-xl shadow-xl"
      >
        <div className="flex flex-col gap-3 p-3">
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={(d) => {
              if (!d) return;
              const y = d.getFullYear();
              const m = (d.getMonth() + 1).toString().padStart(2, "0");
              const day = d.getDate().toString().padStart(2, "0");
              onDateChange(`${y}-${m}-${day}`);
            }}
            disabled={(d) => {
              if (minDate) {
                const min = new Date(minDate);
                min.setHours(0, 0, 0, 0);
                if (d < min) return true;
              }
              if (maxDate) {
                const max = new Date(maxDate);
                max.setHours(23, 59, 59, 999);
                if (d > max) return true;
              }
              return false;
            }}
            initialFocus
            className="rounded-lg bg-[#1c1c1e] text-white [--cell-size:2.25rem]"
            classNames={{
              today: "bg-amber-500/15 text-amber-300 rounded-md data-[selected=true]:rounded-md",
              weekday: "text-gray-500",
              caption_label: "text-white",
              button_previous: "text-gray-400 hover:text-white border-0",
              button_next: "text-gray-400 hover:text-white border-0",
              outside: "text-gray-600 opacity-50",
              disabled: "text-gray-600 opacity-40",
            }}
            components={{
              DayButton: ({ className, ...props }) => (
                <CalendarDayButton
                  className={cn(
                    "text-gray-200 hover:bg-amber-500/10 hover:text-amber-200",
                    "data-[selected-single=true]:bg-amber-500 data-[selected-single=true]:text-black",
                    "data-[selected-single=true]:hover:bg-amber-400 data-[selected-single=true]:hover:text-black",
                    className,
                  )}
                  {...props}
                />
              ),
            }}
          />

          <div className="border-t border-[#2a2a2e] pt-3 flex items-center gap-2 px-1">
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <Select
              value={hour}
              onValueChange={(v) => emitTime(v, minute, ampm)}
            >
              <SelectTrigger className="w-[70px] h-9 bg-[#0a0a0a] border-[#2a2a2e] text-white rounded-lg focus:ring-amber-500/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c1e] border-[#2a2a2e] text-white">
                {Array.from({ length: 12 }, (_, i) => {
                  const h = (i + 1).toString().padStart(2, "0");
                  return (
                    <SelectItem
                      key={h}
                      value={h}
                      className="focus:bg-amber-500/20 focus:text-amber-200"
                    >
                      {h}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <span className="text-gray-500 font-medium">:</span>

            <Select
              value={minute}
              onValueChange={(v) => emitTime(hour, v, ampm)}
            >
              <SelectTrigger className="w-[70px] h-9 bg-[#0a0a0a] border-[#2a2a2e] text-white rounded-lg focus:ring-amber-500/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c1e] border-[#2a2a2e] text-white">
                {["00", "15", "30", "45"].map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                    className="focus:bg-amber-500/20 focus:text-amber-200"
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={ampm}
              onValueChange={(v) => emitTime(hour, minute, v)}
            >
              <SelectTrigger className="w-[72px] h-9 bg-[#0a0a0a] border-[#2a2a2e] text-white rounded-lg focus:ring-amber-500/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c1e] border-[#2a2a2e] text-white">
                <SelectItem value="AM" className="focus:bg-amber-500/20 focus:text-amber-200">
                  AM
                </SelectItem>
                <SelectItem value="PM" className="focus:bg-amber-500/20 focus:text-amber-200">
                  PM
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
