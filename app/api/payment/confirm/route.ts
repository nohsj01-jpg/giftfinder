import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "필수 결제 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const secretKey = (process.env.TOSS_SECRET_KEY || "test_sk_GjLJoQ1aVZaBdjmp1RWd3w6KYe2Ry").trim();
    // Basic Auth 인코딩
    const basicAuthToken = Buffer.from(`${secretKey}:`).toString("base64");

    // 토스페이먼츠 승인 API 호출
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuthToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.message || "토스페이먼츠 결제 승인에 실패했습니다." },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Payment Confirm API Error:", error);
    return NextResponse.json(
      { error: "결제 승인 처리 중 시스템 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
