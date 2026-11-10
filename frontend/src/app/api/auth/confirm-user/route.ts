import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existing) {
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
      });
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, confirmed: true });
    }

    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

