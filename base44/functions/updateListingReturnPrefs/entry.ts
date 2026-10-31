import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { prefsSignature, summarizeReturnPrefs, ITEM_CATEGORIES, SERVICE_CATEGORIES } from '../../shared/exchange.ts';

// Updates a listing's return preferences (owner only). When the preferences
// actually change, every ACTIVE negotiation on the listing is paused for
// review: the historical offer terms are kept untouched, both parties must
// confirm they want to continue under the updated preferences (or close the
// negotiation). Existing agreements are never modified.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const listingId = String(body.listing_id || '');
    if (!listingId) return Response.json({ error: 'listing_id is required' }, { status: 400 });

    const accepts = String(body.accepts || 'both');
    if (!['item', 'service', 'both'].includes(accepts)) {
      return Response.json({ error: 'accepts must be item, service, or both' }, { status: 400 });
    }

    if (['desired_item_custom', 'desired_service_custom'].some(key => body[key] != null && (typeof body[key] !== 'string' || body[key].length > 500))) {
      return Response.json({ error: user.language === 'es' ? 'Las preferencias personalizadas deben tener un máximo de 500 caracteres.' : 'Custom preferences must be at most 500 characters.' }, { status: 400 });
    }
    // Only recognized categories are stored; original custom text is never trimmed or translated.
    const sanitizeCategories = (value, allowed) => {
      if (!Array.isArray(value)) return [];
      return value.map(String).filter((c) => allowed.includes(c));
    };
    const prefUpdate = {
      accepts,
      desired_item_categories: sanitizeCategories(body.desired_item_categories, ITEM_CATEGORIES),
      desired_item_custom: body.desired_item_custom ? String(body.desired_item_custom) : "",
      desired_items_any: !!body.desired_items_any,
      desired_service_categories: sanitizeCategories(body.desired_service_categories, SERVICE_CATEGORIES),
      desired_service_custom: body.desired_service_custom ? String(body.desired_service_custom) : "",
      desired_services_any: !!body.desired_services_any
    };

    const results = await base44.entities.Item.filter({ id: listingId });
    const listing = results[0];
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.offerer_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const changed = prefsSignature(listing) !== prefsSignature(prefUpdate);

    await base44.entities.Item.update(listing.id, prefUpdate);

    let paused = 0;
    if (changed) {
      const summary = summarizeReturnPrefs(prefUpdate);
      // Service role: active negotiations include rows the owner cannot read
      // directly (they belong to the bidder).
      const serviceDb = base44.asServiceRole.entities;
      const activeNegotiations = await serviceDb.Negotiation.filter({
        item_id: listing.id,
        status: 'active'
      });

      for (const neg of activeNegotiations) {
        await serviceDb.Negotiation.update(neg.id, {
          review_status: 'pending',
          review_confirmed_offerer: false,
          review_confirmed_bidder: false,
          review_note: summary
        });
        paused += 1;
        try {
          await base44.functions.invoke('sendNotification', {
            user_id: neg.bidder_id,
            type: 'listing_prefs_changed',
            title: 'Listing preferences updated',
            message: `${user.full_name} updated what they want in return for "${listing.title}". Your negotiation is paused for review. Updated preferences: ${summary}`,
            related_id: neg.id,
            related_type: 'negotiation',
            link_url: `/negotiation?id=${neg.id}`
          });
        } catch (e) { /* best-effort */ }
      }
    }

    return Response.json({ updated: true, changed, paused_negotiations: paused });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}