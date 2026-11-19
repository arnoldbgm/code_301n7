import { readFile } from "node:fs/promises";
import path from "node:path";

import { Resend } from "resend";

const TEMPLATE_PATH = path.join(process.cwd(), "emails", "template.html");
const DEFAULT_FROM = "Inventarios <onboarding@resend.dev>";

type WelcomeEmailInput = {
  to: string;
  firstName: string;
};

let resendClient: Resend | undefined;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

/**
 * Sends the welcome email to a newly registered user using the HTML template
 * stored in `emails/template.html`. Missing Resend configuration or delivery
 * errors are thrown so the caller can decide how to handle them.
 */
export async function sendWelcomeEmail({
  to,
  firstName,
}: WelcomeEmailInput): Promise<string | undefined> {
  const template = await readFile(TEMPLATE_PATH, "utf8");
  const html = template.replaceAll("{{firstName}}", escapeHtml(firstName));

  const { data, error } = await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to,
    subject: "¡Bienvenido a Inventarios!",
    html,
  });

  if (error) {
    throw new Error(`Resend could not send the welcome email: ${error.message}`);
  }

  return data?.id;
}
