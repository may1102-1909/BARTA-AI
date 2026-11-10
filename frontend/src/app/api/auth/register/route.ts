import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existing) {
      // Auto-confirm their email and update password
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        password: password,
        user_metadata: { full_name: fullName || existing.user_metadata?.full_name },
      });
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, user: existing });
    }

    // 2. Create user with email_confirm: true so NO verification link is required
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName?.trim() || "",
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: err.message || "Failed to create account" }, { status: 500 });
  }
}

