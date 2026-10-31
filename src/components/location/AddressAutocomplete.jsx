import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * AddressAutocomplete
 * Uses Nominatim (OpenStreetMap) for free address autocomplete.
 * Props:
 *   value: string (the location string)
 *   onChange: (locationString, lat, lon) => void
 *   disabled: boolean
 *   placeholder: string
 *   showLocateMe: boolean (default true)
 */
export default function AddressAutocomplete({
  value = "",
  onChange,
  disabled = false,
  placeholder,
  showLocateMe = true,
}) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [verified, setVerified] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
    if (value) setVerified(true);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 4) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&addressdetails=1&limit=6`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setVerified(false);
    onChange(val, null, null);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const formatAddress = (place) => {
    const a = place.address || {};
    const parts = [];
    if (a.house_number && a.road) parts.push(`${a.house_number} ${a.road}`);
    else if (a.road) parts.push(a.road);
    if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
    if (a.state) parts.push(a.state);
    if (a.postcode) parts.push(a.postcode);
    return parts.join(", ") || place.display_name;
  };

  const handleSelect = (place) => {
    const formatted = formatAddress(place);
    setInputValue(formatted);
    setVerified(true);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(formatted, parseFloat(place.lat), parseFloat(place.lon));
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await res.json();
          const formatted = formatAddress(data);
          setInputValue(formatted);
          setVerified(true);
          onChange(formatted, latitude, longitude);
        } catch {
          const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setInputValue(fallback);
          onChange(fallback, latitude, longitude);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder || t('location.address_ph')}
            disabled={disabled}
            className={`pr-8 ${verified ? "border-green-400 focus:ring-green-400" : ""}`}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {!loading && verified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          </div>
        </div>
        {showLocateMe && !disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={handleLocateMe}
            aria-label={t('location.locate')}
            disabled={locating}
            className="flex-shrink-0 gap-1"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            <span className="hidden sm:inline">{t(locating ? 'location.locating' : 'location.locate')}</span>
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((place, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0"
              onClick={() => handleSelect(place)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-800 line-clamp-2">{formatAddress(place)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}