import Stripe from "stripe";

/** Server-side Stripe client. Requires STRIPE_SECRET_KEY (test mode in dev). */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}
