import { Resend } from "resend";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

/** Until pataamiga.mx is verified in Resend, use the sandbox sender. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Club Pata Amiga <onboarding@resend.dev>";
