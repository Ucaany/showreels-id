import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(user.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan dashboard creator." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    actions: [
      {
        id: "open-link-builder",
        title: "Buka Link Builder",
        description: "Tambah dan atur urutan link publik creator.",
        href: "/dashboard/link-builder",
      },
      {
        id: "view-analytics",
        title: "Lihat Analytics",
        description: "Pantau performa halaman creator.",
        href: "/dashboard/analytics",
      },
      {
        id: "manage-billing",
        title: "Kelola Billing",
        description: "Lihat plan aktif dan riwayat transaksi.",
        href: "/dashboard/billing",
      },
      {
        id: "edit-profile",
        title: "Edit Profile",
        description: "Perbarui identitas utama creator.",
        href: "/dashboard/profile",
      },
    ],
  });
}
