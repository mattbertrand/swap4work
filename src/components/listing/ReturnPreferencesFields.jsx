import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Briefcase, Layers } from "lucide-react";
import { ITEM_CATEGORIES, SERVICE_CATEGORIES } from "@/lib/exchangePrefs";

// Listing return-preference editor — used by the create form and both edit
// pages. One controlled value object:
// { accepts, desired_item_categories, desired_item_custom, desired_items_any,
//   desired_service_categories, desired_service_custom, desired_services_any }
// "Open to any item/service" is mutually exclusive with specific preferences
// within its section.

const TYPE_OPTIONS = [
  { value: "item", label: "Items", hint: "I want an item in return", icon: Package },
  { value: "service", label: "Services", hint: "I want a service in return", icon: Briefcase },
  { value: "both", label: "Items or services", hint: "I'm open to either", icon: Layers },
];

function TypeBlock({ noun, anyFlag, categories, custom, onChange }) {
  const toggleCategory = (category, checked) => {
    const next = checked ? [...categories, category] : categories.filter((c) => c !== category);
    onChange({ categories: next });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold">What kind of {noun}s?</Label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={anyFlag}
            onCheckedChange={(checked) => onChange({ any: !!checked })}
          />
          Open to any {noun}
        </label>
      </div>

      {!anyFlag && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {(noun === "item" ? ITEM_CATEGORIES : SERVICE_CATEGORIES).map((category) => (
              <label
                key={category}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  categories.includes(category)
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <Checkbox
                  checked={categories.includes(category)}
                  onCheckedChange={(checked) => toggleCategory(category, !!checked)}
                />
                {category}
              </label>
            ))}
          </div>
          <Input
            value={custom}
            onChange={(e) => onChange({ custom: e.target.value })}
            placeholder={`Describe a specific ${noun} you want (optional)`}
            className="text-sm"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Preferences guide who offers what — you always decide which proposals to accept.
          </p>
        </>
      )}
    </div>
  );
}

export default function ReturnPreferencesFields({ value, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-3 block">
          What do you want in return? <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = value.accepts === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ accepts: opt.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${selected ? "text-orange-600" : "text-gray-400"}`} />
                <p className={`text-sm font-semibold ${selected ? "text-orange-700" : "text-gray-700"}`}>{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      {(value.accepts === "item" || value.accepts === "both") && (
        <TypeBlock
          noun="item"
          anyFlag={!!value.desired_items_any}
          categories={value.desired_item_categories || []}
          custom={value.desired_item_custom || ""}
          onChange={({ any, categories, custom }) =>
            update({
              ...(any !== undefined && { desired_items_any: any }),
              ...(categories !== undefined && { desired_item_categories: categories }),
              ...(custom !== undefined && { desired_item_custom: custom })
            })
          }
        />
      )}

      {(value.accepts === "service" || value.accepts === "both") && (
        <TypeBlock
          noun="service"
          anyFlag={!!value.desired_services_any}
          categories={value.desired_service_categories || []}
          custom={value.desired_service_custom || ""}
          onChange={({ any, categories, custom }) =>
            update({
              ...(any !== undefined && { desired_services_any: any }),
              ...(categories !== undefined && { desired_service_categories: categories }),
              ...(custom !== undefined && { desired_service_custom: custom })
            })
          }
        />
      )}
    </div>
  );
}