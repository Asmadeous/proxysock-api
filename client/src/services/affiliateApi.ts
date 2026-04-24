import api from "./api";

// ── Affiliate (for user dashboard) ───────────────
export const fetchAffiliateProfile = () =>
    api.get("/web/api/affiliate");

export const enrollAffiliate = () =>
    api.post("/web/api/affiliate");

export const requestPayout = (
    amount: number,
    paymentMethod = "wallet",
    paymentDetails: Record<string, string> = {}
) =>
    api.post("/web/api/affiliate/request_payout", {
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
    });

export const fetchReferrals = (page = 1) =>
    api.get("/web/api/affiliate_referrals", { params: { page } });

export const fetchPayouts = (page = 1) =>
    api.get("/web/api/affiliate_payouts", { params: { page } });

// ── Blog Posts (public) ──────────────────────────
export const fetchBlogPosts = (params?: Record<string, string>) =>
    api.get("/web/api/blog_posts", { params });

export const fetchBlogPost = (slug: string) =>
    api.get(`/web/api/blog_posts/${slug}`);
