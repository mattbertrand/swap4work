// Server-side notification templates in English and Spanish.
// Backend functions send `i18n: { key, vars }` instead of raw English text;
// sendNotification renders them in the RECIPIENT's saved language
// (User.language), falling back to English when no preference is stored.

type Vars = Record<string, string | number | undefined>;

type Template = { title: string; message: string };

const T: Record<string, { en: Template; es: Template }> = {
  new_negotiation: {
    en: { title: "New negotiation started", message: '{name} offered their {offered_label} "{offered_title}" in exchange for "{target_title}"' },
    es: { title: "Nueva negociación iniciada", message: '{name} ofreció su {offered_label} "{offered_title}" a cambio de "{target_title}"' },
  },
  new_message: {
    en: { title: "New message", message: "{name} sent you a message: {text}" },
    es: { title: "Nuevo mensaje", message: "{name} te envió un mensaje: {text}" },
  },
  new_offer: {
    en: { title: "New offer", message: '{name} offered {hours} for "{title}"' },
    es: { title: "Nueva oferta", message: '{name} ofreció {hours} por "{title}"' },
  },
  counter_offer: {
    en: { title: "Counter-offer received", message: "{name} countered with {hours}" },
    es: { title: "Contraoferta recibida", message: "{name} respondió con {hours}" },
  },
  offer_accepted: {
    en: { title: "Offer accepted", message: "{name} accepted your offer for \"{title}\"" },
    es: { title: "Oferta aceptada", message: "{name} aceptó tu oferta por \"{title}\"" },
  },
  offer_declined: {
    en: { title: "Offer declined", message: "{name} declined your offer for \"{title}\"" },
    es: { title: "Oferta rechazada", message: "{name} rechazó tu oferta por \"{title}\"" },
  },
  agreement_created: {
    en: { title: "Agreement created", message: 'An agreement was created for "{title}"' },
    es: { title: "Acuerdo creado", message: 'Se creó un acuerdo para "{title}"' },
  },
  agreement_confirmed: {
    en: { title: "Agreement confirmed", message: "{name} confirmed the agreement for \"{title}\"" },
    es: { title: "Acuerdo confirmado", message: "{name} confirmó el acuerdo de \"{title}\"" },
  },
  work_completed: {
    en: { title: "Work completed", message: "{name} marked the work on \"{title}\" as complete" },
    es: { title: "Trabajo completado", message: "{name} marcó el trabajo de \"{title}\" como completado" },
  },
  rating_received: {
    en: { title: "New rating", message: "{name} left you a rating" },
    es: { title: "Nueva reseña", message: "{name} te dejó una reseña" },
  },
  negotiation_closed: {
    en: { title: "Negotiation closed", message: "The negotiation for \"{title}\" was closed" },
    es: { title: "Negociación cerrada", message: "La negociación de \"{title}\" fue cerrada" },
  },
  item_available: {
    en: { title: "Listing available again", message: "\"{title}\" is available again" },
    es: { title: "Publicación disponible de nuevo", message: "\"{title}\" está disponible de nuevo" },
  },
  listing_prefs_changed: {
    en: { title: "Listing preferences changed", message: 'The owner of "{title}" updated what they want in return. Your negotiation is paused for review.' },
    es: { title: "Preferencias de la publicación cambiadas", message: 'El dueño de "{title}" actualizó lo que acepta a cambio. Tu negociación quedó en pausa para revisión.' },
  },
};

function fill(text: string, vars: Vars): string {
  let out = text;
  for (const [name, value] of Object.entries(vars)) {
    if (value === undefined || value === null) continue;
    out = out.split(`{${name}}`).join(String(value));
  }
  return out;
}

// Render a notification in the given language ('en' default).
export function renderNotification(lang: string, key: string, vars: Vars): Template | null {
  const entry = T[key];
  if (!entry) return null;
  const tpl = lang === "es" ? entry.es : entry.en;
  return { title: fill(tpl.title, vars), message: fill(tpl.message, vars) };
}

// Convenience: offered listing label for messages ("item" / "service").
export function listingTypeLabel(type: string, lang: string): string {
  if (lang === "es") return type === "service" ? "servicio" : "artículo";
  return type === "service" ? "service" : "item";
}