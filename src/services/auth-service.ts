import { signIn, signOut } from "next-auth/react";
import type { ServiceResult } from "@/lib/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export const authService = {
  /**
   * Login menggunakan Auth.js Credentials provider.
   * Memanggil signIn dari next-auth/react (client-side).
   */
  async login(input: LoginInput): Promise<ServiceResult<{ redirectTo: string }>> {
    try {
      const result = await signIn("credentials", {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        redirect: false,
      });

      if (result?.error) {
        return {
          ok: false,
          error: "Email atau password salah.",
        };
      }

      return {
        ok: true,
        data: { redirectTo: "/dashboard" },
      };
    } catch (error) {
      console.error("[AuthService] Login error:", error);
      return {
        ok: false,
        error: "Terjadi kesalahan saat login. Silakan coba lagi.",
      };
    }
  },

  /**
   * Signup: POST ke /api/auth/register, lalu auto-login.
   */
  async signup(
    input: SignupInput
  ): Promise<ServiceResult<{ notice: string; redirectTo: string }>> {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          name: input.fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          error: data.error || "Gagal mendaftar.",
        };
      }

      // Auto-login after successful registration
      const loginResult = await signIn("credentials", {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        redirect: false,
      });

      if (loginResult?.error) {
        return {
          ok: true,
          data: {
            notice: "Akun berhasil dibuat. Silakan login.",
            redirectTo: "/auth/login",
          },
        };
      }

      return {
        ok: true,
        data: {
          notice: "Akun berhasil dibuat!",
          redirectTo: "/onboarding",
        },
      };
    } catch (error) {
      console.error("[AuthService] Signup error:", error);
      return {
        ok: false,
        error: "Terjadi kesalahan saat mendaftar.",
      };
    }
  },

  /**
   * Request password reset - kirim email reset.
   */
  async requestPasswordReset(
    email: string
  ): Promise<ServiceResult<{ notice: string }>> {
    try {
      const res = await fetch("/api/auth/password-recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      // Always return success to prevent email enumeration
      return {
        ok: true,
        data: {
          notice:
            "Jika email terdaftar, kami akan mengirim tautan reset password.",
        },
      };
    } catch {
      return {
        ok: true,
        data: {
          notice:
            "Jika email terdaftar, kami akan mengirim tautan reset password.",
        },
      };
    }
  },

  /**
   * Reset password with token.
   */
  async resetPassword(
    password: string,
    token?: string
  ): Promise<ServiceResult<{ notice: string }>> {
    try {
      if (password.length < 6) {
        return { ok: false, error: "Password minimal 6 karakter." };
      }

      const res = await fetch("/api/auth/password-recovery/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { ok: false, error: data.error || "Gagal mereset password." };
      }

      return {
        ok: true,
        data: {
          notice: "Password berhasil direset. Silakan login dengan password baru.",
        },
      };
    } catch {
      return {
        ok: false,
        error: "Terjadi kesalahan saat mereset password.",
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
