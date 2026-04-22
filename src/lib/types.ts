export type VideoSource = "youtube" | "gdrive" | "instagram" | "vimeo";
export type VideoVisibility = "draft" | "private" | "semi_private" | "public";
export type ProfileVisibility = "private" | "semi_private" | "public";
export type VideoAspectRatio = "landscape" | "portrait";

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
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
  skills: string[];
  profileVisibility: ProfileVisibility;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  visibility: VideoVisibility;
  thumbnailUrl: string;
  extraVideoUrls: string[];
  imageUrls: string[];
  sourceUrl: string;
  source: VideoSource;
  aspectRatio: VideoAspectRatio;
  outputType: string;
  durationLabel: string;
  publicSlug: string;
  createdAt: string;
}

export interface VideoFormInput {
  title: string;
  sourceUrl: string;
  tags: string;
  visibility: VideoVisibility;
  aspectRatio?: VideoAspectRatio;
  outputType?: string;
  durationLabel?: string;
  thumbnailUrl?: string;
  extraVideoUrls?: string[];
  imageUrls?: string[];
  description?: string;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface AppState {
  session: AuthSession | null;
  users: UserProfile[];
  videos: VideoItem[];
}
