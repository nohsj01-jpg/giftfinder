import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase client using Service Role Key
const getAdminSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
};

// ── GET: Fetch all products (optional helper) ────────────────────
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("giftfinder")
      .select("*")
      .order("상품명", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Admin products GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: Add a new single product ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("giftfinder")
      .insert(body);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Admin product POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PUT: Update an existing product ─────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("giftfinder")
      .update(body)
      .eq("상품명", body.상품명);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Admin product PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: Remove a product ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "상품명이 제공되지 않았습니다." }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("giftfinder")
      .delete()
      .eq("상품명", name);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Admin product DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH: CSV Bulk Overwrite Upload ───────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const products = await req.json();
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "올바르지 않은 상품 데이터입니다." }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // 1. Delete all existing records in giftfinder table
    const { error: deleteError } = await supabase
      .from("giftfinder")
      .delete()
      .neq("상품명", "");

    if (deleteError) {
      throw new Error("기존 상품 목록 제거 실패: " + deleteError.message);
    }

    // 2. Insert new records in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      const { error: insertError } = await supabase
        .from("giftfinder")
        .insert(chunk);

      if (insertError) {
        throw new Error(`청크 ${Math.floor(i / chunkSize) + 1} 적재 실패: ${insertError.message}`);
      }
    }

    return NextResponse.json({ success: true, count: products.length });
  } catch (err: any) {
    console.error("Admin CSV Bulk Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
