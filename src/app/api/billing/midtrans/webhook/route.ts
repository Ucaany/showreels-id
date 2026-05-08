import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Midtrans webhook sudah tidak digunakan.
 * Semua pembayaran sekarang menggunakan Tripay.
 * Route ini dipertahankan agar tidak 404 jika ada request lama.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Midtrans webhook sudah tidak aktif. Pembayaran menggunakan Tripay.",
      status: "gone",
    },
    { status: 410 }
  );
}
