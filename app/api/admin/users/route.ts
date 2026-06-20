import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getAdminSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
};

// ── GET: Fetch all users from auth.users (service_role only) ──────
export async function GET() {
  try {
    const supabase = getAdminSupabase();

    // Use Supabase Admin API to list users from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) throw authError;

    const users = (authData?.users || []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      display_name:
        u.user_metadata?.name ||
        u.user_metadata?.full_name ||
        u.email?.split("@")[0] ||
        "사용자",
      avatar_url:
        u.user_metadata?.avatar_url ||
        u.user_metadata?.picture ||
        null,
      created_at: u.created_at,
    }));

    // Sort by created_at desc
    users.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
