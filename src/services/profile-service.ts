import { simulateDelay } from "@/lib/helpers";
import type { ServiceResult, UserProfile } from "@/lib/types";

export interface ProfileUpdateInput {
  fullName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  experience: string;
  skills: string[];
}

export const profileService = {
  async updateProfile(
    userId: string,
    users: UserProfile[],
    payload: ProfileUpdateInput
  ): Promise<ServiceResult<{ users: UserProfile[]; profile: UserProfile }>> {
    await simulateDelay(500);

    const normalizedUsername = payload.username.trim().toLowerCase();
    const isTaken = users.some(
      (user) => user.id !== userId && user.username.toLowerCase() === normalizedUsername
    );
    if (isTaken) {
      return { ok: false, error: "Username sudah dipakai user lain." };
    }

    const nextUsers = users.map((user) => {
      if (user.id !== userId) {
        return user;
      }
      return {
        ...user,
        fullName: payload.fullName.trim(),
        username: normalizedUsername,
        avatarUrl: payload.avatarUrl.trim(),
        bio: payload.bio.trim(),
        experience: payload.experience.trim(),
        skills: payload.skills,
      };
    });

    const updated = nextUsers.find((item) => item.id === userId);
    if (!updated) {
      return { ok: false, error: "Profil user tidak ditemukan." };
    }

    return {
      ok: true,
      data: {
        users: nextUsers,
        profile: updated,
      },
    };
  },
};
