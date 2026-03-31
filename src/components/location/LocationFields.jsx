import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
 *   onChange: (fields, locationString, lat, lon) => void
 *     - locationString: "city, state zip" (used for display/storage)
 *     - lat/lon: null (geocoding done on save if needed externally)
 *   disabled: bool
 *   errors: { zip?: string }
 */
export default function LocationFields({ value = {}, onChange, disabled = false, errors = {} }) {
  const { street = "", city = "", state = "", zip = "" } = value;

  const zipError = errors.zip || (zip && !/^\d{5}(-\d{4})?$/.test(zip) ? "Enter a valid 5-digit ZIP code" : "");

  const handleChange = (field, val) => {
    const updated = { street, city, state, zip, [field]: val };
    // Build location string: "street, city, state zip" or just "city, state zip"
    const parts = [];
    if (updated.street) parts.push(updated.street);
    if (updated.city) parts.push(updated.city);
    const stateZip = [updated.state, updated.zip].filter(Boolean).join(" ");
    if (stateZip) parts.push(stateZip);
    const locationString = parts.join(", ");
    onChange(updated, locationString);
  };

  return (
    <div className="space-y-3">
      <div>
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
  // Try to match "..., City, ST 12345" or "City, ST 12345"
  const zipMatch = locationStr.match(/(\d{5}(-\d{4})?)$/);
  const zip = zipMatch ? zipMatch[1] : "";
  const withoutZip = zip ? locationStr.slice(0, locationStr.lastIndexOf(zip)).replace(/,?\s*$/, "") : locationStr;
  const parts = withoutZip.split(",").map(p => p.trim());
  // Last part might be state abbreviation
  const lastPart = parts[parts.length - 1] || "";
  const stateAbbr = US_STATES.find(s => s === lastPart.toUpperCase()) ? lastPart.toUpperCase() : "";
  const withoutState = stateAbbr ? parts.slice(0, -1) : parts;
  const city = withoutState[withoutState.length - 1] || "";
  const street = withoutState.slice(0, -1).join(", ");
  return { street, city, state: stateAbbr, zip };
}