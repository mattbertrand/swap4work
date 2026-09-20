import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { US_STATES, STATE_NAMES, normalizeState, isValidCityName } from "@/lib/location";

/**
 * Structured location fields: street, city, state, zip.
 *
 * Props:
 *   value: { street, city, state, zip }
 *   onChange: (fields, locationString, coords) => void
 *     coords is { latitude, longitude } when set by "Locate Me", null on manual edits.
 *   disabled: bool
 *   errors: { zip?: string, city?: string }
 */
export default function LocationFields({ value = {}, onChange, disabled = false, errors = {} }) {
  const { street = "", city = "", state = "", zip = "" } = value;
  const [locating, setLocating] = useState(false);

  const zipError = errors.zip || (zip && !/^\d{5}(-\d{4})?$/.test(zip) ? "Enter a valid 5-digit ZIP code" : "");
  const cityError = errors.city || (city && !isValidCityName(city) ? "Enter a valid city name" : "");

  const buildLocationString = (fields) => {
    const parts = [];
    if (fields.street) parts.push(fields.street);
    if (fields.city) parts.push(fields.city);
    const stateZip = [fields.state, fields.zip].filter(Boolean).join(" ");
    if (stateZip) parts.push(stateZip);
    return parts.join(", ");
  };

  const handleChange = (field, val) => {
    const updated = { street, city, state, zip, [field]: val };
    onChange(updated, buildLocationString(updated), null);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let detectedCity = "";
          let detectedZip = "";
          let detectedState = "";
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const addr = data.address || {};
            detectedCity = addr.city || addr.town || addr.village || addr.hamlet || "";
            detectedZip = addr.postcode ? addr.postcode.slice(0, 5) : "";
            detectedState = normalizeState(addr.state) || "";
          } catch (e) {
            console.error("Reverse geocode failed", e);
          }

          // The street address is manually entered information — Locate Me
          // never overwrites or erases it. City/state/ZIP/coordinates are
          // only updated with what geolocation reliably determined.
          const updated = {
            street,
            city: detectedCity || city,
            state: detectedState || state,
            zip: detectedZip || zip,
          };
          onChange(updated, buildLocationString(updated), { latitude, longitude });

          if (detectedCity && detectedState) {
            toast.success(
              `Location detected: ${detectedCity}, ${detectedState}` +
                (street ? " — your street address was kept as entered" : "")
            );
          } else {
            toast.error("We found your coordinates, but couldn't determine your city. Please check the location fields.");
          }
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error("Unable to get your current location. Please enter it manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="loc-street">Street Address</Label>
          <Input
            id="loc-street"
            value={street}
            onChange={(e) => handleChange("street", e.target.value)}
            placeholder="123 Main St"
            disabled={disabled}
            className="mt-1"
          />
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            disabled={locating}
            className="h-9 shrink-0 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            <span className="ml-1">{locating ? "Locating..." : "Locate Me"}</span>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="loc-city">City</Label>
          <Input
            id="loc-city"
            value={city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="San Francisco"
            disabled={disabled}
            className={`mt-1 ${cityError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
          />
          {cityError && <p className="text-xs text-red-500 mt-1">{cityError}</p>}
        </div>
        <div>
          <Label htmlFor="loc-zip">ZIP Code</Label>
          <Input
            id="loc-zip"
            value={zip}
            onChange={(e) => handleChange("zip", e.target.value)}
            placeholder="94102"
            maxLength={10}
            disabled={disabled}
            className={`mt-1 ${zipError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
          />
          {zipError && <p className="text-xs text-red-500 mt-1">{zipError}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="loc-state">State</Label>
        <Select value={state} onValueChange={(val) => handleChange("state", val)} disabled={disabled}>
          <SelectTrigger id="loc-state" className="mt-1">
            <SelectValue placeholder="Select state..." />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {US_STATES.map(abbr => (
              <SelectItem key={abbr} value={abbr}>{abbr} — {STATE_NAMES[abbr]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Helper: parse a location string back into fields (never treats an invalid city as a city) */
export function parseLocationString(locationStr) {
  if (!locationStr) return { street: "", city: "", state: "", zip: "" };
  const zipMatch = locationStr.match(/(\d{5}(-\d{4})?)$/);
  const zip = zipMatch ? zipMatch[1] : "";
  const withoutZip = zip ? locationStr.slice(0, locationStr.lastIndexOf(zip)).replace(/,?\s*$/, "") : locationStr;
  const parts = withoutZip.split(",").map(p => p.trim());
  const lastPart = parts[parts.length - 1] || "";
  const stateAbbr = normalizeState(lastPart);
  const withoutState = stateAbbr ? parts.slice(0, -1) : parts;
  let city = withoutState[withoutState.length - 1] || "";
  let street = withoutState.slice(0, -1).join(", ");
  if (city && !isValidCityName(city)) {
    // Not a real city (e.g. a street line with no city) — keep it as street, don't guess
    street = [street, city].filter(Boolean).join(", ");
    city = "";
  }
  return { street, city, state: stateAbbr || "", zip };
}