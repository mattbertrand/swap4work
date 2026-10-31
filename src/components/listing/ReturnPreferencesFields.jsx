import React from "react";
import { Label } from "@/components/ui/label";
import { Package, Briefcase, Layers } from "lucide-react";
import TypeBlock from "@/components/listing/ReturnPreferenceTypeBlock";
import { useLanguage } from "@/i18n/LanguageContext";

// Listing return-preference editor — used by the create form and both edit
// pages. One controlled value object:
// { accepts, desired_item_categories, desired_item_custom, desired_items_any,
//   desired_service_categories, desired_service_custom, desired_services_any }
// "Open to any item/service" is mutually exclusive with specific preferences
// within its section.

const TYPE_OPTIONS = [
  { value: "item", label: "listing.items", hint: "return.hint_item", icon: Package },
  { value: "service", label: "listing.services", hint: "return.hint_service", icon: Briefcase },
  { value: "both", label: "return.both", hint: "return.hint_both", icon: Layers },
];

export default function ReturnPreferencesFields({ value, onChange }) {
  const { t } = useLanguage();
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-3 block">
          {t('return.question')} <span className="text-red-500">*</span>
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
                <p className={`text-sm font-semibold ${selected ? "text-orange-700" : "text-gray-700"}`}>{t(opt.label)}</p>
                <p className="text-xs text-gray-500">{t(opt.hint)}</p>
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