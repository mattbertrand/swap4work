import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

const STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"Washington DC"
};

/**
 * Structured location fields: street, city, state, zip.
 * 
 * Props:
 *   value: { street, city, state, zip }
 *   onChange: (fields, locationString) => void
 *   disabled: bool
 *   errors: { zip?: string }
 */
export default function LocationFields({ value = {}, onChange, disabled = false, errors = {} }) {
  const { street = "", city = "", state = "", zip = "" } = value;
  const [locating, setLocating] = useState(false);

  const zipError = errors.zip || (zip && !/^\d{5}(-\d{4})?$/.test(zip) ? "Enter a valid 5-digit ZIP code" : "");

  const handleChange = (field, val) => {
    const updated = { street, city, state, zip, [field]: val };
    const parts = [];
    if (updated.street) parts.push(updated.street);
    if (updated.city) parts.push(updated.city);
    const stateZip = [updated.state, updated.zip].filter(Boolean).join(" ");
    if (stateZip) parts.push(stateZip);
    const locationString = parts.join(", ");
    onChange(updated, locationString);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const addr = data.address || {};
          const detectedCity = addr.city || addr.town || addr.village || addr.hamlet || "";
          const detectedZip = addr.postcode ? addr.postcode.slice(0, 5) : "";
          const detectedStateAbbr = Object.entries(STATE_NAMES).find(
            ([abbr, name]) => name.toLowerCase() === (addr.state || "").toLowerCase()
          )?.[0] || "";
          const updated = { street: street, city: detectedCity, state: detectedStateAbbr, zip: detectedZip };
          const parts = [];
          if (updated.street) parts.push(updated.street);
          if (updated.city) parts.push(updated.city);
          const stateZip = [updated.state, updated.zip].filter(Boolean).join(" ");
          if (stateZip) parts.push(stateZip);
          onChange(updated, parts.join(", "));
        } catch (e) {
          console.error("Reverse geocode failed", e);
        }
        setLocating(false);
      },
      () => setLocating(false),
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
            className="mt-1"
          />
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

/** Helper: parse a location string back into fields */
export function parseLocationString(locationStr) {
  if (!locationStr) return { street: "", city: "", state: "", zip: "" };
  const zipMatch = locationStr.match(/(\d{5}(-\d{4})?)$/);
  const zip = zipMatch ? zipMatch[1] : "";
  const withoutZip = zip ? locationStr.slice(0, locationStr.lastIndexOf(zip)).replace(/,?\s*$/, "") : locationStr;
  const parts = withoutZip.split(",").map(p => p.trim());
  const lastPart = parts[parts.length - 1] || "";
  const stateAbbr = US_STATES.find(s => s === lastPart.toUpperCase()) ? lastPart.toUpperCase() : "";
  const withoutState = stateAbbr ? parts.slice(0, -1) : parts;
  const city = withoutState[withoutState.length - 1] || "";
  const street = withoutState.slice(0, -1).join(", ");
  return { street, city, state: stateAbbr, zip };
}