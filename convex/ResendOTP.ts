import { Email } from "@convex-dev/auth/providers/Email";

function generateOTP(length: number): string {
  const digits = "0123456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (num) => digits[num % digits.length]).join("");
}

export const ResendOTP = Email({
  id: "resend-otp",
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return generateOTP(6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    if (process.env.OTP_ENDPOINT) {
      const response = await fetch(process.env.OTP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          chatId: process.env.CHAT_ID,
          appName: process.env.APP_NAME ?? "My App",
          secretKey: process.env.SECRET_KEY,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as any).error ?? "Failed to send verification email");
      }
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Czech Course Reader <noreply@czechitas-vibecoding.cz>",
        to: email,
        subject: "Your verification code",
        text: `Your verification code is: ${token}`,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).message ?? "Failed to send verification email");
    }
  },
});
