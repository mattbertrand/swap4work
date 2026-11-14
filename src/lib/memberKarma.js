import { base44 } from "@/api/base44Client";

/** Public karma score for a member — the transaction ledger itself stays admin-only. */
export async function fetchMemberKarma(userId) {
  if (!userId) return 0;
  const res = await base44.functions.invoke("getMemberKarma", { user_id: userId });
  return Number(res.data?.karma_points) || 0;
}