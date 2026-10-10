import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatHmInput, parseHmInput, hoursMinutesToDecimal, MIN_TOTAL_MINUTES } from "@/lib/duration";

// Hours:minutes picker ("00:05", "01:30"). Stores decimal hours via onChange;
// emits null for empty or invalid values (below the 5-minute minimum).
export default function HoursMinutesInput({ id, value, onChange, className, placeholder = "e.g., 01:30" }) {
  const [text, setText] = useState(() => formatHmInput(value));
  const lastEmittedRef = useRef(value);

  // Sync when the value is set externally (e.g., prefilled when editing)
  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setText(formatHmInput(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    const { hours, minutes } = parseHmInput(digits);
    const totalMinutes = hours * 60 + minutes;
    const formatted = digits.length === 0
      ? ""
      : digits.length <= 2
        ? String(minutes).padStart(2, "0")
        : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    setText(formatted);

    const valid = digits.length > 0 && minutes <= 59 && totalMinutes >= MIN_TOTAL_MINUTES;
    const decimal = valid ? hoursMinutesToDecimal(hours, minutes) : null;
    lastEmittedRef.current = decimal;
    onChange(decimal);
  };

  const { minutes } = parseHmInput(text);
  const totalMinutes = parseHmInput(text).hours * 60 + minutes;
  const error = text !== ""
    ? (minutes > 59
        ? "Minutes must be between 00 and 59."
        : totalMinutes < MIN_TOTAL_MINUTES
          ? "Minimum work time is 00:05."
          : null)
    : null;

  return (
    <div>
      <Input
        id={id}
        inputMode="numeric"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`${error ? "border-red-400 focus:border-red-500" : ""} ${className || "mt-2"}`}
      />
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : (
        <p className="text-xs text-gray-500 mt-1">Format HH:MM, minimum 00:05.</p>
      )}
    </div>
  );
}