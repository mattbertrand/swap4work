// Shared exchange-preference logic for backend functions.
// Eligibility rule: what matters is the TARGET listing's return-type
// preference (`accepts`). Specific categories and custom descriptions are
// guidance shown to the requester — the owner always decides whether to
// accept a proposal, so matching beyond the type level is deliberately
// informational.

export const ITEM_CATEGORIES = [
  "Electronics",
  "Home Goods",
  "Furniture",
  "Appliances",
  "Tools",
  "Sports Equipment",
  "Other",
];

export const SERVICE_CATEGORIES = [
  "Home Repairs",
  "Cleaning",
  "Yard Work",
  "Digital Services",
  "Tutoring",
  "Personal Assistance",
  "Creative Services",
];

// Listings saved before return preferences existed default to "open to both".
export function getReturnTypes(item) {
  return item?.accepts || "both";
}

// Which listing types (of the requester's own listings) may be offered.
export function getAllowedOfferTypes(item) {
  const want = getReturnTypes(item);
  if (want === "item") return ["item"];
  if (want === "service") return ["service"];
  return ["item", "service"];
}

// Stable signature used to detect a real preference change on edit.
export function prefsSignature(item) {
  return JSON.stringify([
    item?.accepts || "both",
    [...(item?.desired_item_categories || [])].sort(),
    item?.desired_item_custom || "",
    !!item?.desired_items_any,
    [...(item?.desired_service_categories || [])].sort(),
    item?.desired_service_custom || "",
    !!item?.desired_services_any,
  ]);
}

function describeTypePrefs(anyFlag, categories, custom, noun) {
  const parts = [];
  if (Array.isArray(categories) && categories.length) parts.push(...categories);
  if (custom) parts.push(custom);
  if (!parts.length || anyFlag) return `any ${noun}`;
  return parts.join(", ");
}

// Plain-language summary of what the owner wants in return.
export function summarizeReturnPrefs(item) {
  const want = getReturnTypes(item);
  if (want === "item") {
    return "Items: " + describeTypePrefs(item?.desired_items_any, item?.desired_item_categories, item?.desired_item_custom, "item");
  }
  if (want === "service") {
    return "Services: " + describeTypePrefs(item?.desired_services_any, item?.desired_service_categories, item?.desired_service_custom, "service");
  }
  return (
    "Items: " + describeTypePrefs(item?.desired_items_any, item?.desired_item_categories, item?.desired_item_custom, "item") +
    " · Services: " + describeTypePrefs(item?.desired_services_any, item?.desired_service_categories, item?.desired_service_custom, "service")
  );
}