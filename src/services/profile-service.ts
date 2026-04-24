import { simulateDelay } from "@/lib/helpers";
import type { ServiceResult, UserProfile } from "@/lib/types";

export interface ProfileUpdateInput {
  fullName: string;
  username: string;
  role: string;
  avatarUrl: string;
  bio: string;
  experience: string;
  birthDate: string;
  city: string;
  contactEmail: string;
  phoneNumber: string;
  websiteUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  threadsUrl: string;
  customLinks?: Array<{
    id: string;
    title: string;
    url: string;
    enabled: boolean;
    order: number;
  }>;
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
        role: payload.role.trim(),
        avatarUrl: payload.avatarUrl.trim(),
        bio: payload.bio.trim(),
        experience: payload.experience.trim(),
        birthDate: payload.birthDate.trim(),
        city: payload.city.trim(),
        contactEmail: payload.contactEmail.trim().toLowerCase(),
        phoneNumber: payload.phoneNumber.trim(),
        websiteUrl: payload.websiteUrl.trim(),
        instagramUrl: payload.instagramUrl.trim(),
        youtubeUrl: payload.youtubeUrl.trim(),
        facebookUrl: payload.facebookUrl.trim(),
        threadsUrl: payload.threadsUrl.trim(),
        customLinks: payload.customLinks || [],
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
