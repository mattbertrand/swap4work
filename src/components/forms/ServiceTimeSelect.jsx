import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDuration } from "@/lib/duration";
import { useLanguage } from '@/i18n/LanguageContext';

// Quick-pick durations for the time a service session takes, from a few
// minutes to a few hours. Stored as decimal hours like the rest of the app.
const SERVICE_TIME_OPTIONS = [
  { value: 0.25, label: "15 minutes" },
  { value: 0.5, label: "30 minutes" },
  { value: 0.75, label: "45 minutes" },
  { value: 1, label: "1 hour" },
  { value: 1.5, label: "1 hour 30 minutes" },
  { value: 2, label: "2 hours" },
  { value: 2.5, label: "2 hours 30 minutes" },
  { value: 3, label: "3 hours" },
  { value: 4, label: "4 hours" },
  { value: 5, label: "5 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours" }
];

export default function ServiceTimeSelect({ id, value, onChange, className }) {
  const { t } = useLanguage();
  const current = parseFloat(value);
  // Keep a previously saved custom duration selectable when editing
  const options = current > 0 && !SERVICE_TIME_OPTIONS.some((o) => o.value === current)
    ? [{ value: current, label: formatDuration(current) }, ...SERVICE_TIME_OPTIONS]
    : SERVICE_TIME_OPTIONS;

  return (
    <div>
      <Select
        value={current > 0 ? String(current) : ""}
        onValueChange={(v) => onChange(parseFloat(v))}
      >
        <SelectTrigger id={id} className={className || "mt-2"}>
          <SelectValue placeholder={t('service.time_ph')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={String(o.value)}>{formatDuration(o.value)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500 mt-1">{t('service.time_help')}</p>
    </div>
  );
}