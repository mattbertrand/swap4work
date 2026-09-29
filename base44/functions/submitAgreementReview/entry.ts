import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getActiveUser } from '../../shared/moderation.ts';

// Records a review for a completed agreement and recomputes the rated
// member's reputation server-side so ratings and karma can't be forged.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json();
    const agreementId = String(body.agreement_id || '');
    const stars = Number(body.stars);
    const review = String(body.review || '').slice(0, 2000);
    if (!agreementId) {
      return Response.json({ error: 'agreement_id is required' }, { status: 400 });
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return Response.json({ error: 'Stars must be between 1 and 5' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    let agreement = null;
    try {
      const agreements = await db.Agreement.filter({ id: agreementId });
      agreement = agreements[0];
    } catch (e) {
      agreement = null;
    }
    if (!agreement) return Response.json({ error: 'Agreement not found' }, { status: 404 });

    const isOfferer = user.id === agreement.offerer_id;
    const isWorker = user.id === agreement.worker_id;
    if (!isOfferer && !isWorker) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (agreement.status !== 'completed') {
      return Response.json({ error: 'You can only review a completed agreement' }, { status: 400 });
    }

    const existing = await db.Rating.filter({ agreement_id: agreementId, from_user_id: user.id });
    if (existing[0]) {
      return Response.json({ error: 'You have already reviewed this agreement' }, { status: 409 });
    }

    const otherUserId = isOfferer ? agreement.worker_id : agreement.offerer_id;
    const otherUserName = isOfferer ? agreement.worker_name : agreement.offerer_name;

    await db.Rating.create({
      agreement_id: agreementId,
      from_user_id: user.id,
      to_user_id: otherUserId,
      from_user_name: user.full_name,
      to_user_name: otherUserName,
      stars,
      review,
      published: true
    });

    // Recompute the rated member's reputation from the full rating history
    const allRatings = await db.Rating.filter({ to_user_id: otherUserId });
    const totalStars = allRatings.reduce((sum, r) => sum + r.stars, 0);
    const avgRating = totalStars / allRatings.length;

    const ratedWorkers = await db.Worker.filter({ user_id: otherUserId });
    if (ratedWorkers[0]) {
      await db.Worker.update(ratedWorkers[0].id, {
        rating: avgRating,
        total_ratings: allRatings.length
      });
    }
    await db.Item.updateMany({ offerer_id: otherUserId }, {
      $set: { offerer_rating: avgRating, offerer_total_ratings: allRatings.length }
    });

    // Karma from the review, recorded server-side only
    let karmaPoints = 0;
    if (stars === 5) karmaPoints = 10;
    else if (stars === 4) karmaPoints = 5;
    else if (stars === 3) karmaPoints = 0;
    else if (stars === 2) karmaPoints = -5;
    else if (stars === 1) karmaPoints = -10;

    if (karmaPoints !== 0) {
      await db.KarmaTransaction.create({
        user_id: otherUserId,
        user_name: otherUserName,
        type: karmaPoints > 0 ? 'gain' : 'loss',
        reason: stars >= 4 ? 'positive_review' : 'negative_review',
        points: Math.abs(karmaPoints),
        agreement_id: agreementId,
        description: `Received ${stars}-star review from ${user.full_name}`
      });
    }

    await db.Notification.create({
      user_id: otherUserId,
      type: 'rating_received',
      title: 'New rating received!',
      message: `${user.full_name} rated your work ${stars} stars for ${agreement.item_title}`,
      related_id: agreementId,
      related_type: 'agreement',
      link_url: '/profile',
      from_user_id: user.id,
      from_user_name: user.full_name
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}