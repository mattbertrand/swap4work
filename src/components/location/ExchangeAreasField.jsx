import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { US_STATES, STATE_NAMES, normalizeCityName, isValidCityName } from "@/lib/location";
import { verifyLocationOnline } from "@/lib/locationValidation";

export const MAX_EXCHANGE_AREAS = 5;

/**
 * Optional extra areas where a member is willing to exchange items or provide
 * services. These are availability areas — NOT residences and never verified.
 * Each is validated as a real "City, ST" (no ZIP, no street, no coordinates).
 */
export default function ExchangeAreasField({ areas = [], onChange, disabled = false }) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setError("");
    const cleanCity = normalizeCityName(city);
    if (!isValidCityName(cleanCity) || !state) {
      setError("Enter a valid city and choose a state.");
      return;
    }
    if (areas.length >= MAX_EXCHANGE_AREAS) {
      setError(`You can add up to ${MAX_EXCHANGE_AREAS} areas.`);
      return;
    }
    setAdding(true);
    // ZIP is not collected for exchange areas, so only the city + state existence is checked
    const geo = await verifyLocationOnline({ city: cleanCity, state, zip: "" }, { zipOptional: true }).catch(() => null);
    setAdding(false);
    if (geo && geo.status === "invalid" && geo.field === "city") {
      setError("We couldn't verify this city. Please check the city and state.");
      return;
    }
    const label = `${geo?.status === "valid" ? geo.city : cleanCity}, ${state}`;
    if (areas.some((a) => a.toLowerCase() === label.toLowerCase())) {
      setError("That area is already on your list.");
      return;
    }
    onChange([...areas, label]);
    setCity("");
    setState("");
  };

  return (
    <div>
      <Label>Exchange areas (optional)</Label>
      <p className="text-xs text-gray-500 mt-1">
        Other cities where you're willing to meet to exchange items or provide services. These are shown as
        "Also exchanges in…" — they are not verified and aren't your home location.
      </p>

      <div className="flex flex-wrap gap-2 mt-2">
        {areas.length === 0 && <span className="text-sm text-gray-400 italic">No extra areas</span>}
        {areas.map((area) => (
          <Badge key={area} variant="secondary" className="bg-white border-gray-200 gap-1">
            {area}
            {!disabled && (
              <button type="button" aria-label={`Remove ${area}`} onClick={() => onChange(areas.filter((a) => a !== area))}>
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {!disabled && areas.length < MAX_EXCHANGE_AREAS && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="sm:flex-1" />
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent className="max-h-64">
              {US_STATES.map((abbr) => (
                <SelectItem key={abbr} value={abbr}>{abbr} — {STATE_NAMES[abbr]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={handleAdd} disabled={adding}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="ml-1">Add</span>
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}