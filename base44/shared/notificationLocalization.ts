import { renderNotification } from './i18n.ts';

// Only anchored, app-owned sentence formats are decoded. Captures remain original text.
const LEGACY = [
 ['new_negotiation', 'negotiation_legacy', /^(.+) wants to trade work for your ([\s\S]+)$/, ['name','title']],
 ['new_negotiation', 'new_negotiation', /^(.+) offered their (item|service) "([\s\S]+)" in exchange for "([\s\S]+)"\.?$/, ['name','offered_type','offered_title','target_title']],
 ['new_negotiation', 'new_negotiation', /^(.+) ofreció su (artículo|servicio) "([\s\S]+)" a cambio de "([\s\S]+)"\.?$/, ['name','offered_type','offered_title','target_title']],
 ['new_message', 'message_about', /^(.+) sent you a message about ([\s\S]+)$/, ['name','title']],
 ['new_message', 'new_message', /^(.+) sent you a message: ([\s\S]*)$/, ['name','text']],
 ['new_message', 'new_message', /^(.+) te envió un mensaje: ([\s\S]*)$/, ['name','text']],
 ['new_offer', 'new_offer', /^(.+) offered ([\d:.]+(?: hours?)?) for "?([\s\S]+?)"?$/, ['name','hours','title']],
 ['counter_offer', 'counter_listing', /^(.+) offered ([\d:.]+(?: hours?)?) for ([\s\S]+)$/, ['name','hours','title']],
 ['counter_offer', 'counter_offer', /^(.+) countered with ([\s\S]+)$/, ['name','hours']],
 ['offer_accepted', 'accepted_hours', /^(.+) accepted your offer of ([\d:.]+(?: hours?)?) for ([\s\S]+)$/, ['name','hours','title']],
 ['offer_accepted', 'offer_accepted', /^(.+) accepted your offer for "([\s\S]+)"$/, ['name','title']],
 ['offer_accepted', 'offer_accepted', /^(.+) aceptó tu oferta por "([\s\S]+)"$/, ['name','title']],
 ['offer_declined', 'offer_declined', /^(.+) declined the negotiation for ([\s\S]+)$/, ['name','title']],
 ['offer_declined', 'offer_declined', /^(.+) declined your offer for "([\s\S]+)"$/, ['name','title']],
 ['offer_declined', 'offer_declined', /^(.+) rechazó tu oferta por "([\s\S]+)"$/, ['name','title']],
 ['agreement_created', 'agreement_created', /^An agreement was created for "([\s\S]+)"$/, ['title']],
 ['agreement_created', 'agreement_created', /^Se creó un acuerdo para "([\s\S]+)"$/, ['title']],
 ['agreement_confirmed', 'handover_completed', /^The handover for ([\s\S]+) has been confirmed by both parties$/, ['title']],
 ['agreement_confirmed', 'agreement_confirmed', /^(.+) confirmed the agreement for "([\s\S]+)"$/, ['name','title']],
 ['agreement_confirmed', 'agreement_confirmed', /^(.+) confirmó el acuerdo de "([\s\S]+)"$/, ['name','title']],
 ['work_completed', 'work_review', /^(.+) has completed the work for ([\s\S]+)\. Please review and confirm handover\.$/, ['name','title']],
 ['work_completed', 'work_completed', /^(.+) marked the work on "([\s\S]+)" as complete$/, ['name','title']],
 ['work_completed', 'work_completed', /^(.+) marcó el trabajo de "([\s\S]+)" como completado$/, ['name','title']],
 ['rating_received', 'rating_stars', /^(.+) rated your work ([1-5]) stars for ([\s\S]+)$/, ['name','stars','title']],
 ['rating_received', 'rating_received', /^(.+) left you a rating$/, ['name']],
 ['rating_received', 'rating_received', /^(.+) te dejó una reseña$/, ['name']],
 ['negotiation_closed', 'closed_other_offer', /^The item owner has accepted another offer for ([\s\S]+)$/, ['title']],
 ['negotiation_closed', 'closed_preferences', /^(.+) closed the negotiation after the listing's return preferences changed\.$/, ['name']],
 ['negotiation_closed', 'negotiation_closed', /^The negotiation for "([\s\S]+)" was closed$/, ['title']],
 ['negotiation_closed', 'negotiation_closed', /^La negociación de "([\s\S]+)" fue cerrada$/, ['title']],
 ['item_available', 'spot_maybe', /^A negotiation for ([\s\S]+) was closed\. You may be able to start negotiating now!$/, ['title']],
 ['item_available', 'spot_open', /^A negotiation for ([\s\S]+) was declined\. You can now start negotiating!$/, ['title']],
 ['item_available', 'item_in_progress', /^The item "([\s\S]+)" is now in progress\. You will be notified if it becomes available again\.$/, ['title']],
 ['item_available', 'item_available', /^"([\s\S]+)" is available again$/, ['title']],
 ['item_available', 'item_available', /^"([\s\S]+)" está disponible de nuevo$/, ['title']],
 ['listing_prefs_changed', 'listing_prefs_detail', /^(.+) updated what they want in return for "([\s\S]+)"\. Your negotiation is paused for review\. Updated preferences: ([\s\S]*)$/, ['name','title','preferences']],
 ['listing_prefs_changed', 'listing_prefs_changed', /^The owner of "([\s\S]+)" updated what they want in return\. Your negotiation is paused for review\.$/, ['title']],
 ['listing_prefs_changed', 'listing_prefs_changed', /^El dueño de "([\s\S]+)" actualizó lo que acepta a cambio\. Tu negociación quedó en pausa para revisión\.$/, ['title']],
 ['moderation_resolved', 'member_removed', /^The other member in your agreements? \(([\s\S]*)\) was removed from the community\. The agreement was cancelled and your item is available for new offers again\.$/, ['titles']],
 ['moderation_resolved', 'moderation_resolved', /^Thank you for your report\. Our team has reviewed it and taken action: ([\s\S]+)\.$/, ['resolution']],
 ['moderation_warning', 'moderation_warning', /^You have received a warning regarding: ([\s\S]+)\. Please review our community guidelines\. Repeated violations may result in account suspension\.$/, ['resolution']],
];

export function notificationMetadata(record) {
  if (record.i18n_key && record.i18n_vars && renderNotification('en', record.i18n_key, record.i18n_vars)) {
    return { key: record.i18n_key, vars: record.i18n_vars };
  }
  // Historical event types were reused for cancellation. Never infer meaning from type alone.
  if (['agreement_created','offer_declined'].includes(record.type)) {
    const match = String(record.message || '').match(/^(.+) cancelled the (negotiation|agreement) for ([\s\S]+)$/);
    if (match) return { key: `${match[2]}_cancelled`, vars: { name: match[1], title: match[3] } };
  }
  for (const [type, key, pattern, names] of LEGACY) {
    if (type !== record.type) continue;
    const match = String(record.message || '').match(pattern);
    if (match) return { key, vars: Object.fromEntries(names.map((name, i) => [name, match[i + 1]])) };
  }
  return null;
}

export function notificationDisplay(record, language) {
  const metadata = notificationMetadata(record);
  const rendered = metadata && renderNotification(language, metadata.key, metadata.vars);
  return rendered ? { ...rendered, metadata } : { title: record.title, message: record.message, metadata: null };
}

export async function prepareNotification(db, record, metadata = null) {
  const resolved = metadata || notificationMetadata(record);
  if (!resolved) return record;
  const recipients = await db.User.filter({ id: record.user_id });
  const rendered = renderNotification(recipients[0]?.language === 'es' ? 'es' : 'en', resolved.key, resolved.vars);
  if (!rendered) return record;
  return { ...record, ...rendered, i18n_key: resolved.key, i18n_vars: resolved.vars };
}