import { createId, simulateDelay } from "@/lib/helpers";
import type {
  AuthSession,
  ServiceResult,
  UserProfile,
} from "@/lib/types";

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

const DEMO_PASSWORD = "demo12345";

export const authService = {
  async login(
    input: LoginInput,
    users: UserProfile[]
  ): Promise<ServiceResult<AuthSession>> {
    await simulateDelay(550);

    const email = input.email.trim().toLowerCase();
    const user = users.find((item) => item.email.toLowerCase() === email);
    if (!user) {
      return { ok: false, error: "Email belum terdaftar." };
    }
    if (input.password !== DEMO_PASSWORD) {
      return {
        ok: false,
        error: "Password mock tidak valid. Gunakan demo12345 untuk tahap MVP.",
      };
    }

    return {
      ok: true,
      data: {
        token: `mock_${createId("token")}`,
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      },
    };
  },

  async signup(
    input: SignupInput,
    users: UserProfile[]
  ): Promise<
    ServiceResult<{ user: UserProfile; session: AuthSession; notice: string }>
  > {
    await simulateDelay(650);

    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedUsername = input.username.trim().toLowerCase();

    const emailExists = users.some(
      (item) => item.email.toLowerCase() === normalizedEmail
    );
    if (emailExists) {
      return { ok: false, error: "Email sudah digunakan." };
    }

    const usernameExists = users.some(
      (item) => item.username.toLowerCase() === normalizedUsername
    );
    if (usernameExists) {
      return { ok: false, error: "Username sudah dipakai." };
    }

    if (input.password.length < 8) {
      return { ok: false, error: "Password minimal 8 karakter." };
    }

    const user: UserProfile = {
      id: createId("usr"),
      email: normalizedEmail,
      username: normalizedUsername,
      fullName: input.fullName.trim(),
      avatarUrl: "",
      bio: "",
      experience: "",
      skills: [],
      createdAt: new Date().toISOString(),
    };

    const session: AuthSession = {
      token: `mock_${createId("token")}`,
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    return {
      ok: true,
      data: {
        user,
        session,
        notice:
          "Akun berhasil dibuat. Verifikasi email masih opsional dan belum diaktifkan pada MVP frontend ini.",
      },
    };
  },

  async requestPasswordReset(
    email: string,
    users: UserProfile[]
  ): Promise<ServiceResult<{ notice: string }>> {
    await simulateDelay(450);
    const normalizedEmail = email.trim().toLowerCase();
    const exists = users.some(
      (item) => item.email.toLowerCase() === normalizedEmail
    );

    if (!exists) {
      return {
        ok: true,
        data: {
          notice:
            "Jika email terdaftar, kami akan kirim tautan reset (simulasi frontend).",
        },
      };
    }

    return {
      ok: true,
      data: {
        notice:
          "Tautan reset password mock berhasil dikirim. Gunakan halaman reset untuk menyelesaikan proses.",
      },
    };
  },

  async resetPassword(password: string): Promise<ServiceResult<{ notice: string }>> {
    await simulateDelay(450);
    if (password.length < 8) {
      return { ok: false, error: "Password baru minimal 8 karakter." };
    }

    return {
      ok: true,
      data: {
        notice:
          "Password berhasil direset (simulasi). Untuk login gunakan password demo: demo12345.",
      },
    };
  },
};
