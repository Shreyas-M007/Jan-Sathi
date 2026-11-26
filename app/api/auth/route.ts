import { NextResponse } from "next/server";
import { authenticateUser, registerUser, type UserRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name, role } = body as {
      action?: "login" | "register";
      email?: string;
      password?: string;
      name?: string;
      role?: UserRole;
    };

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and access level are required." },
        { status: 400 }
      );
    }

    if (action === "register") {
      const result = await registerUser(name || "", email, password, role);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, user: result.user }, { status: 201 });
    }

    // Default action: login
    const result = await authenticateUser(email, password, role);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json(
      { error: "Internal server error connecting to user authentication service." },
      { status: 500 }
    );
  }
}
