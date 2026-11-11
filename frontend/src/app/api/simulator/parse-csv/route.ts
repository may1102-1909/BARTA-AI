import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: "No valid contact rows found in CSV." }, { status: 400 });
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
    const nameIdx = headers.findIndex((h) => ["name", "contact_name", "full_name", "customer"].includes(h));
    const phoneIdx = headers.findIndex((h) => ["phone", "contact_phone", "mobile", "number"].includes(h));
    const emailIdx = headers.findIndex((h) => ["email", "contact_email"].includes(h));
    const langIdx = headers.findIndex((h) => ["language", "lang"].includes(h));
    const notesIdx = headers.findIndex((h) => ["notes", "context"].includes(h));

    const contacts = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      const name = nameIdx !== -1 ? parts[nameIdx] : parts[0] || "Unknown";
      const phone = phoneIdx !== -1 ? parts[phoneIdx] : parts[1] || "";
      const email = emailIdx !== -1 ? parts[emailIdx] : "";
      const language = langIdx !== -1 ? parts[langIdx] : "hinglish";
      const notes = notesIdx !== -1 ? parts[notesIdx] : "";

      if (phone || name !== "Unknown") {
        contacts.push({
          contact_name: name,
          contact_phone: phone,
          contact_email: email,
          preferred_language: language,
          notes: notes,
        });
      }
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid contact rows found in CSV." }, { status: 400 });
    }

    return NextResponse.json({
      contacts,
      count: contacts.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to parse CSV" }, { status: 500 });
  }
}

