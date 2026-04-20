import type { AppState, UserProfile, VideoItem } from "@/lib/types";

const demoUser: UserProfile = {
  id: "usr_demo_1",
  email: "demo@videoport.ai",
  username: "videocreator",
  fullName: "Demo Creator",
  avatarUrl: "",
  bio: "Videografer freelance untuk brand, event, dan konten edukasi.",
  experience:
    "5+ tahun di produksi video komersial. Terbiasa mengelola workflow dari konsep sampai final edit.",
  birthDate: "1998-09-20",
  city: "Yogyakarta",
  contactEmail: "hello@videocreator.id",
  phoneNumber: "+62 812-3456-7890",
  websiteUrl: "https://videocreator.id",
  instagramUrl: "https://instagram.com/videocreator",
  youtubeUrl: "https://youtube.com/@videocreator",
  facebookUrl: "",
  threadsUrl: "https://threads.net/@videocreator",
  skills: ["Video Editing", "Storytelling", "Color Grading", "Motion Graphics"],
  createdAt: "2026-01-12T04:30:00.000Z",
};

const demoVideos: VideoItem[] = [
  {
    id: "vid_demo_1",
    userId: "usr_demo_1",
    title: "Showreel Brand Campaign 2026",
    description:
      "Kompilasi project campaign terbaru dengan fokus storytelling yang clean, pacing cepat, dan visual sinematik untuk kebutuhan sosial media brand.",
    tags: ["showreel", "brand", "commercial"],
    visibility: "public",
    thumbnailUrl: "",
    extraVideoUrls: [],
    imageUrls: [],
    sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    source: "youtube",
    publicSlug: "showreel-brand-campaign-2026",
    createdAt: "2026-03-04T10:15:00.000Z",
  },
];

export const storageKey = "videoport-mock-state-v1";

export const seedState: AppState = {
  session: null,
  users: [demoUser],
  videos: demoVideos,
};
