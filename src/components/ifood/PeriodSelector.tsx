"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Period, PeriodType } from "@/types/ifood-dashboard";
import { DateRange } from "react-day-picker";

interface Props {
  value: Period;
  onChange: (period: Period) => void;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function subtractDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

const QUICK_PERIODS: { label: string; type: PeriodType; days: number }[] = [
  { label: "1D", type: "1D", days: 0 },
  { label: "7D", type: "7D", days: 6 },
  { label: "15D", type: "15D", days: 14 },
  { label: "30D", type: "30D", days: 29 },
];

export function PeriodSelector({ value, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const handleQuick = (type: PeriodType, days: number) => {
    const today = getToday();
    onChange({
      type,
      startDate: days === 0 ? today : subtractDays(days),
      endDate: today,
    });
  };

  const handleCustomApply = () => {
    if (!range?.from) return;
    const start = range.from.toISOString().split("T")[0];
    const end = range.to ? range.to.toISOString().split("T")[0] : start;
    onChange({ type: "custom", startDate: start, endDate: end });
    setCustomOpen(false);
  };

  const customLabel =
    value.type === "custom"
      ? `${format(new Date(value.startDate + "T12:00:00"), "dd/MM", { locale: ptBR })} – ${format(
          new Date(value.endDate + "T12:00:00"),
          "dd/MM",
          { locale: ptBR },
        )}`
      : "Personalizado";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex bg-[#141415] rounded-lg p-1 gap-0.5">
        {QUICK_PERIODS.map(({ label, type, days }) => (
          <Button
            key={type}
            variant={value.type === type ? "default" : "ghost"}
            size="sm"
            onClick={() => handleQuick(type, days)}
            className={`h-8 px-3 text-xs font-medium ${
              value.type === type
                ? "bg-[#22c55e] text-black hover:bg-[#16a34a]"
                : "text-gray-400 hover:text-white hover:bg-transparent"
            }`}
          >
            {label}
            {type === "1D" && value.type === "1D" && (
              <span className="ml-1.5 flex items-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              </span>
            )}
          </Button>
        ))}
      </div>

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 px-3 text-xs font-medium border-[#374151] ${
              value.type === "custom"
                ? "bg-[#22c55e]/10 border-[#22c55e]/50 text-green-400"
                : "bg-[#141415] text-gray-400 hover:text-white hover:bg-[#374151]"
            }`}
          >
            <CalendarIcon className="h-3 w-3 mr-1.5" />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3 bg-[#141415] border-[#374151] shadow-2xl"
          align="start"
        >
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            className="bg-[#141415] text-white"
            locale={ptBR}
          />
          <div className="flex justify-end gap-2 mt-3 border-t border-[#374151] pt-3">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-400 hover:text-white"
              onClick={() => setCustomOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-[#22c55e] text-black hover:bg-[#16a34a]"
              onClick={handleCustomApply}
              disabled={!range?.from}
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Period label */}
      <span className="text-xs text-gray-500">
        {format(new Date(value.startDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
        {value.startDate !== value.endDate && (
          <>
            {" — "}
            {format(new Date(value.endDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
          </>
        )}
      </span>
    </div>
  );
}
