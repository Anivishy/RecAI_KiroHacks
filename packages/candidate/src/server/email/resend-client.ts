import { Resend } from "resend";

type SendOtpInput = {
  to: string;
  code: string;
  candidateName: string;
};

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

export async function sendRecommenderOtpEmail({
  to,
  code,
  candidateName,
}: SendOtpInput): Promise<void> {
  const client = getClient();
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "verify@recai.app";

  if (!client) {
    console.log(
      `[recommender-otp] (dev) would send code ${code} to ${to} for candidate ${candidateName}`,
    );
    return;
  }

  const subject = `Your RecAI verification code: ${code}`;
  const text = [
    `Hi,`,
    ``,
    `${candidateName} asked you to write a recommendation on RecAI.`,
    ``,
    `Your verification code is: ${code}`,
    ``,
    `This code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  ].join("\n");

  const { error } = await client.emails.send({
    from: fromAddress,
    to,
    subject,
    text,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? "unknown"}`);
  }
}
