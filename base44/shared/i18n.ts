// Server-side notification templates in English and Spanish.
// Backend functions send `i18n: { key, vars }` instead of raw English text;
// sendNotification renders them in the RECIPIENT's saved language
// (User.language), falling back to English when no preference is stored.

type Vars = Record<string, string | number | undefined>;

type Template = { title: string; message: string };

const T: Record<string, { en: Template; es: Template }> = {
  negotiation_legacy: { en: { title: 'New negotiation started', message: '{name} wants to trade work for your {title}' }, es: { title: 'Nueva negociación iniciada', message: '{name} quiere ofrecer trabajo a cambio de tu {title}' } },
  message_about: { en: { title: 'New message', message: '{name} sent you a message about {title}' }, es: { title: 'Nuevo mensaje', message: '{name} te envió un mensaje sobre {title}' } },
  counter_listing: { en: { title: 'New counter offer', message: '{name} offered {hours} for {title}' }, es: { title: 'Nueva contraoferta', message: '{name} ofreció {hours} por {title}' } },
  accepted_hours: { en: { title: 'Offer accepted!', message: '{name} accepted your offer of {hours} for {title}' }, es: { title: 'Oferta aceptada', message: '{name} aceptó tu oferta de {hours} por {title}' } },
  handover_completed: { en: { title: 'Agreement completed!', message: 'The handover for {title} has been confirmed by both parties' }, es: { title: 'Acuerdo completado', message: 'Ambas partes confirmaron la entrega de {title}' } },
  work_review: { en: { title: 'Work completed!', message: '{name} has completed the work for {title}. Please review and confirm handover.' }, es: { title: 'Trabajo completado', message: '{name} completó el trabajo de {title}. Revisa y confirma la entrega.' } },
  rating_stars: { en: { title: 'New rating received!', message: '{name} rated your work {stars} stars for {title}' }, es: { title: 'Nueva calificación recibida', message: '{name} calificó tu trabajo con {stars} estrellas por {title}' } },
  closed_other_offer: { en: { title: 'Negotiation closed', message: 'The item owner has accepted another offer for {title}' }, es: { title: 'Negociación cerrada', message: 'La persona que publicó {title} aceptó otra oferta' } },
  closed_preferences: { en: { title: 'Negotiation closed', message: "{name} closed the negotiation after the listing's return preferences changed." }, es: { title: 'Negociación cerrada', message: '{name} cerró la negociación después de que cambiaron las preferencias de intercambio.' } },
  spot_maybe: { en: { title: 'Negotiation spot may be available', message: 'A negotiation for {title} was closed. You may be able to start negotiating now!' }, es: { title: 'Puede haber espacio para negociar', message: 'Se cerró una negociación de {title}. Es posible que ahora puedas iniciar una negociación.' } },
  spot_open: { en: { title: 'Negotiation spot available', message: 'A negotiation for {title} was declined. You can now start negotiating!' }, es: { title: 'Hay espacio para negociar', message: 'Se rechazó una negociación de {title}. Ahora puedes iniciar una negociación.' } },
  item_in_progress: { en: { title: 'Item now in progress', message: 'The item "{title}" is now in progress. You will be notified if it becomes available again.' }, es: { title: 'Artículo con intercambio en curso', message: 'El intercambio de «{title}» está en curso. Te avisaremos si vuelve a estar disponible.' } },
  listing_prefs_detail: { en: { title: 'Listing preferences updated', message: '{name} updated what they want in return for "{title}". Your negotiation is paused for review. Updated preferences: {preferences}' }, es: { title: 'Preferencias de la publicación actualizadas', message: '{name} actualizó lo que busca a cambio de «{title}». La negociación está en pausa para revisión. Preferencias actualizadas: {preferences}' } },
  negotiation_cancelled: { en: { title: 'Negotiation cancelled', message: '{name} cancelled the negotiation for {title}' }, es: { title: 'Negociación cancelada', message: '{name} canceló la negociación de {title}' } },
  agreement_cancelled: { en: { title: 'Agreement cancelled', message: '{name} cancelled the agreement for {title}' }, es: { title: 'Acuerdo cancelado', message: '{name} canceló el acuerdo de {title}' } },
  member_removed: { en: { title: 'Agreement cancelled', message: 'The other member in your agreement(s) ({titles}) was removed from the community. The agreement was cancelled and your item is available for new offers again.' }, es: { title: 'Acuerdo cancelado', message: 'El otro miembro de tus acuerdos ({titles}) fue retirado de la comunidad. Se canceló el acuerdo y tu artículo vuelve a estar disponible para nuevas ofertas.' } },
  moderation_resolved: { en: { title: 'Your report has been reviewed', message: 'Thank you for your report. Our team has reviewed it and taken action: {resolution}.' }, es: { title: 'Tu reporte fue revisado', message: 'Gracias por tu reporte. El equipo lo revisó y tomó esta medida: {resolution}.' } },
  moderation_warning: { en: { title: 'Warning from Swap4Work', message: 'You have received a warning regarding: {resolution}. Please review our community guidelines. Repeated violations may result in account suspension.' }, es: { title: 'Advertencia de Swap4Work', message: 'Recibiste una advertencia: {resolution}. Revisa las normas de la comunidad. Las infracciones reiteradas pueden causar la suspensión de la cuenta.' } },
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
  const values = { ...vars };
  if (values.name) {
    const parts = String(values.name).trim().split(/\s+/);
    values.name = parts.length > 1 ? `${parts[0]} ${parts.at(-1)[0].toUpperCase()}.` : parts[0];
  }
  if (key === 'new_negotiation') values.offered_label = listingTypeLabel(String(values.offered_type || values.offered_label), lang);
  if (lang === 'es' && values.hours) values.hours = String(values.hours).replace(/\bhours?\b/g, match => match === 'hour' ? 'hora' : 'horas');
  if (lang === 'es' && values.resolution) {
    const resolutions = { 'Report ignored - no action needed': 'No se requirieron medidas', 'User warned about their behavior': 'Se advirtió al usuario sobre su conducta', 'Listing hidden from public view': 'Publicación oculta al público', 'User account suspended for 7 days': 'Cuenta suspendida por 7 días', 'User account permanently banned': 'Cuenta expulsada permanentemente' };
    values.resolution = resolutions[String(values.resolution)] || values.resolution;
  }
  if (key === 'rating_stars' && Number(values.stars) === 1) return { title: tpl.title, message: lang === 'es' ? fill('{name} calificó tu trabajo con {stars} estrella por {title}', values) : fill('{name} rated your work {stars} star for {title}', values) };
  return { title: fill(tpl.title, values), message: fill(tpl.message, values) };
}

// Convenience: offered listing label for messages ("item" / "service").
export function listingTypeLabel(type: string, lang: string): string {
  if (lang === "es") return ['service', 'servicio'].includes(type) ? "servicio" : "artículo";
  return ['service', 'servicio'].includes(type) ? "service" : "item";
}