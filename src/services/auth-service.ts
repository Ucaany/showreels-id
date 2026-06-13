import { signIn, signOut } from "next-auth/react";
import type { ServiceResult } from "@/lib/types";

export const authService = {
  /**
   * Login dengan Google OAuth.
   * Memanggil signIn("google") dari next-auth/react (client-side).
   */
  async loginWithGoogle(
    callbackUrl = "/dashboard"
  ): Promise<ServiceResult<{ redirectTo: string }>> {
    try {
      await signIn("google", { callbackUrl, redirect: true });
      // Baris ini tidak akan tercapai karena redirect: true
      return { ok: true, data: { redirectTo: callbackUrl } };
    } catch (error) {
      console.error("[AuthService] Google login error:", error);
      return {
        ok: false,
        error: "Terjadi kesalahan saat login dengan Google. Silakan coba lagi.",
      };
    }
  },

  /**
   * Logout - clear session.
   */
  async logout(): Promise<void> {
    await signOut({ redirect: false });
  },
};
