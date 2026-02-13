import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "Scottsdale1!";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const sessionToken = crypto.randomUUID();
      const cookieStore = await cookies();
      cookieStore.set("qinary_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("qinary_session");
  return NextResponse.json({ success: true });
}
