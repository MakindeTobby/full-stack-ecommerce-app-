import { randomBytes } from "node:crypto";
import { addMinutes } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verification_tokens } from "@/db/schema";
import { db } from "@/db/server";
import { sendMailDevOrProd } from "@/lib/mail";
import {
  buildBrandEmailHtml,
  buildBrandEmailText,
} from "@/lib/notifications/templates";

const requestMagicSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: Request) {
  try {
    const parsed = requestMagicSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "A valid email is required" },
        { status: 400 },
      );
    }
    const email = parsed.data.email.toLowerCase();

    const token = randomBytes(24).toString("base64url");
    const expires = addMinutes(new Date(), 15);

    await db.insert(verification_tokens).values({
      identifier: email,
      token,
      expires,
    });

    const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const magicUrl = `${origin}/auth/magic?email=${encodeURIComponent(
      email,
    )}&token=${encodeURIComponent(token)}`;

    const model = {
      title: "Your secure sign-in link",
      intro:
        "Use the button below to sign in. This link expires in 15 minutes.",
      sections: [{ label: "Email", value: email }],
      cta: { label: "Sign in now", href: magicUrl },
      outro: "If you did not request this, you can ignore this email.",
    };

    await sendMailDevOrProd({
      to: email,
      subject: "Your sign-in link",
      text: buildBrandEmailText(model),
      html: buildBrandEmailHtml(model),
    });

    return NextResponse.json({ ok: true, message: "Magic link sent" });
  } catch (err: unknown) {
    console.error("magic request error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to send magic link" },
      { status: 500 },
    );
  }
}
