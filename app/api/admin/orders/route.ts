import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getAdminSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
};

// ── GET: Fetch all orders with items and user mapping ───────────
export async function GET() {
  try {
    const supabase = getAdminSupabase();

    // 1. Fetch all orders with items
    const { data: rawOrders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        ordered_at,
        total_price,
        status,
        user_id,
        order_items (
          id,
          product_id,
          product_name,
          price
        )
      `)
      .order("ordered_at", { ascending: false });

    if (ordersError) throw ordersError;

    // 2. Fetch all users from auth.users (no public.users table needed)
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const userList = (authData?.users || []).map((u: any) => ({
      id: u.id,
      display_name:
        u.user_metadata?.name ||
        u.user_metadata?.full_name ||
        u.email?.split("@")[0] ||
        "사용자",
      email: u.email ?? "",
    }));

    // 3. Map user information onto orders
    const mappedOrders = (rawOrders || []).map((order: any) => {
      const user = userList.find((u: any) => u.id === order.user_id);
      return {
        ...order,
        users: user ? { display_name: user.display_name, email: user.email } : null
      };
    });

    return NextResponse.json({ success: true, data: mappedOrders });
  } catch (err: any) {
    console.error("Admin orders GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PUT: Update an order status ────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "주문 ID 및 상태가 제공되지 않았습니다." }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Admin order status PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
