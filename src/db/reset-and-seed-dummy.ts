import { config } from "dotenv";
import { ne } from "drizzle-orm";
import { users, videos, accounts, sessions, verificationTokens } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { upsertOwnerAccount } from "@/db/owner-utils";

config({ path: ".env.local" });
config();

type DummyCreatorSeed = {
  fullName: string;
  username: string;
  role: string;
  city: string;
  bio: string;
  experience: string;
  websiteUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  threadsUrl: string;
  avatarUrl: string;
  coverImageUrl: string;
  skills: string[];
};

const dummyCreators: DummyCreatorSeed[] = [
  {
    fullName: "Raka Mahendra",
    username: "raka",
    role: "Video Editor",
    city: "Jakarta",
    bio: "Editor konten edukasi dan teknologi dengan style clean dan cepat.",
    experience: "5 tahun menangani konten edukasi, launch produk, dan corporate social media.",
    websiteUrl: "https://rakastudio.example.com",
    instagramUrl: "https://instagram.com/rakaedit",
    youtubeUrl: "https://youtube.com/@rakaedit",
    facebookUrl: "https://facebook.com/rakaedit",
    threadsUrl: "https://threads.net/@rakaedit",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1600&q=80",
    skills: ["Video Editing", "Color Grading", "Sound Design"],
  },
  {
    fullName: "Nadia Pratiwi",
    username: "nadia",
    role: "Videografer",
    city: "Bandung",
    bio: "Videografer wedding dan event dengan pendekatan cinematic ringan.",
    experience: "4 tahun menangani wedding, event kampus, dan dokumentasi komunitas.",
    websiteUrl: "https://nadiastudio.example.com",
    instagramUrl: "https://instagram.com/nadiashot",
    youtubeUrl: "https://youtube.com/@nadiashot",
    facebookUrl: "https://facebook.com/nadiashot",
    threadsUrl: "https://threads.net/@nadiashot",
    avatarUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    skills: ["Videography", "Direction", "Storyboarding"],
  },
  {
    fullName: "Dimas Pratama",
    username: "dimas",
    role: "Content Creator",
    city: "Yogyakarta",
    bio: "Creator travel dan lifestyle, fokus visual storytelling personal brand.",
    experience: "3 tahun membuat konten travel komersial untuk hotel, F&B, dan tourism board.",
    websiteUrl: "https://dimasworks.example.com",
    instagramUrl: "https://instagram.com/dimasworks",
    youtubeUrl: "https://youtube.com/@dimasworks",
    facebookUrl: "https://facebook.com/dimasworks",
    threadsUrl: "https://threads.net/@dimasworks",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80",
    skills: ["Content Strategy", "Scripting", "Editing"],
  },
  {
    fullName: "Fauzan Al Anshari",
    username: "fauzany",
    role: "Videografer",
    city: "Yogyakarta",
    bio: "Videografer event, kampus, dan social media campaign.",
    experience: "4 tahun produksi konten kampus, event daerah, dan brand UMKM.",
    websiteUrl: "https://fauzanfilms.example.com",
    instagramUrl: "https://instagram.com/fauzanfilms",
    youtubeUrl: "https://youtube.com/@fauzanfilms",
    facebookUrl: "https://facebook.com/fauzanfilms",
    threadsUrl: "https://threads.net/@fauzanfilms",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    skills: ["Videography", "Event Coverage", "Drone"],
  },
  {
    fullName: "Zain Niors",
    username: "zainniors",
    role: "Video Editor",
    city: "Surabaya",
    bio: "Editor pendekatan modern untuk short-form brand content.",
    experience: "3 tahun mengedit short-form commercial dan konten produk.",
    websiteUrl: "https://zainedit.example.com",
    instagramUrl: "https://instagram.com/zainedit",
    youtubeUrl: "https://youtube.com/@zainedit",
    facebookUrl: "https://facebook.com/zainedit",
    threadsUrl: "https://threads.net/@zainedit",
    avatarUrl:
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80",
    skills: ["Editing", "Motion Graphics", "Subtitles"],
  },
  {
    fullName: "Sofia Adelia",
    username: "sofiaadelia",
    role: "Penulis Naskah",
    city: "Semarang",
    bio: "Script writer untuk konten edukasi, campaign, dan storytelling.",
    experience: "5 tahun menulis skrip video brand dan edukasi digital.",
    websiteUrl: "https://sofiascript.example.com",
    instagramUrl: "https://instagram.com/sofiascript",
    youtubeUrl: "https://youtube.com/@sofiascript",
    facebookUrl: "https://facebook.com/sofiascript",
    threadsUrl: "https://threads.net/@sofiascript",
    avatarUrl:
      "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80",
    skills: ["Script Writing", "Story Arc", "Research"],
  },
  {
    fullName: "Aldo Wirawan",
    username: "aldow",
    role: "Motion Designer",
    city: "Malang",
    bio: "Motion designer untuk promo reels dan explainer visual.",
    experience: "4 tahun membuat motion package untuk startup dan e-commerce.",
    websiteUrl: "https://aldomotion.example.com",
    instagramUrl: "https://instagram.com/aldomotion",
    youtubeUrl: "https://youtube.com/@aldomotion",
    facebookUrl: "https://facebook.com/aldomotion",
    threadsUrl: "https://threads.net/@aldomotion",
    avatarUrl:
      "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1600&q=80",
    skills: ["Motion Graphics", "2D Animation", "Brand Visuals"],
  },
  {
    fullName: "Nadia Putri",
    username: "nadiaputri",
    role: "Content Strategist",
    city: "Depok",
    bio: "Menyusun konsep konten video agar lebih terarah dan konversi tinggi.",
    experience: "6 tahun menyusun strategi konten social media untuk B2C.",
    websiteUrl: "https://nadiacreative.example.com",
    instagramUrl: "https://instagram.com/nadiacreative",
    youtubeUrl: "https://youtube.com/@nadiacreative",
    facebookUrl: "https://facebook.com/nadiacreative",
    threadsUrl: "https://threads.net/@nadiacreative",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80",
    skills: ["Content Planning", "Audience Research", "Campaign Management"],
  },
  {
    fullName: "Rasya Nugraha",
    username: "rasya",
    role: "Creative Producer",
    city: "Bekasi",
    bio: "Producer konten kolaborasi brand, campaign, dan live production.",
    experience: "5 tahun memimpin produksi konten digital lintas tim.",
    websiteUrl: "https://rasyastudio.example.com",
    instagramUrl: "https://instagram.com/rasyastudio",
    youtubeUrl: "https://youtube.com/@rasyastudio",
    facebookUrl: "https://facebook.com/rasyastudio",
    threadsUrl: "https://threads.net/@rasyastudio",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80",
    skills: ["Creative Direction", "Production", "Team Management"],
  },
  {
    fullName: "Herman Baru",
    username: "herman",
    role: "Videografer",
    city: "Bogor",
    bio: "Videografer outdoor dan dokumentasi komunitas dengan visual natural.",
    experience: "3 tahun fokus pada dokumentasi komunitas, travel, dan social campaign.",
    websiteUrl: "https://hermanvisual.example.com",
    instagramUrl: "https://instagram.com/hermanvisual",
    youtubeUrl: "https://youtube.com/@hermanvisual",
    facebookUrl: "https://facebook.com/hermanvisual",
    threadsUrl: "https://threads.net/@hermanvisual",
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80",
    skills: ["Outdoor Videography", "Color Tones", "Narrative Editing"],
  },
];

const sourcePool = [
  {
    source: "youtube" as const,
    sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    aspectRatio: "landscape" as const,
  },
  {
    source: "vimeo" as const,
    sourceUrl: "https://vimeo.com/76979871",
    thumbnailUrl: "https://vumbnail.com/76979871.jpg",
    aspectRatio: "landscape" as const,
  },
  {
    source: "instagram" as const,
    sourceUrl: "https://www.instagram.com/reel/C5q9pYQxyz1/",
    thumbnailUrl: "https://picsum.photos/seed/ig-reel/1280/720",
    aspectRatio: "portrait" as const,
  },
  {
    source: "gdrive" as const,
    sourceUrl:
      "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
    thumbnailUrl:
      "https://drive.google.com/thumbnail?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms&sz=w640",
    aspectRatio: "landscape" as const,
  },
];

function buildVideosForCreator(userId: string, username: string, index: number) {
  const first = sourcePool[index % sourcePool.length];
  const second = sourcePool[(index + 1) % sourcePool.length];
  const third = sourcePool[(index + 2) % sourcePool.length];

  return [
    {
      userId,
      title: `Showreel ${username} 2026`,
      description:
        "Showreel karya terbaru dengan fokus storytelling yang clean, ritme visual konsisten, dan output siap publish.",
      tags: ["showreel", "brand", "portfolio"],
      visibility: "public" as const,
      source: first.source,
      sourceUrl: first.sourceUrl,
      thumbnailUrl: first.thumbnailUrl,
      aspectRatio: first.aspectRatio,
      outputType: "Awareness",
      durationLabel: "01:25",
      publicSlug: `${username}-showreel-2026`,
      imageUrls: [`https://picsum.photos/seed/${username}-img-1/1200/800`],
      extraVideoUrls: [],
    },
    {
      userId,
      title: `Campaign Draft ${username}`,
      description:
        "Draft campaign untuk revisi internal, masih dalam tahap penyempurnaan pacing dan CTA.",
      tags: ["draft", "campaign"],
      visibility: index % 2 === 0 ? ("draft" as const) : ("private" as const),
      source: second.source,
      sourceUrl: second.sourceUrl,
      thumbnailUrl: second.thumbnailUrl,
      aspectRatio: second.aspectRatio,
      outputType: "Reels",
      durationLabel: "00:45",
      publicSlug: `${username}-campaign-draft-2026`,
      imageUrls: [`https://picsum.photos/seed/${username}-img-2/1200/800`],
      extraVideoUrls: [third.sourceUrl],
    },
    {
      userId,
      title: `Behind The Scene ${username}`,
      description:
        "Konten behind the scene untuk dokumentasi proses produksi dan insight teknis.",
      tags: ["bts", "process"],
      visibility: index % 2 === 0 ? ("private" as const) : ("draft" as const),
      source: third.source,
      sourceUrl: third.sourceUrl,
      thumbnailUrl: third.thumbnailUrl,
      aspectRatio: third.aspectRatio,
      outputType: "Film",
      durationLabel: "02:10",
      publicSlug: `${username}-behind-scene-2026`,
      imageUrls: [`https://picsum.photos/seed/${username}-img-3/1200/800`],
      extraVideoUrls: [],
    },
  ];
}

async function resetAndSeedDummy() {
  const { db } = await import("@/db");
  const owner = await upsertOwnerAccount();
  const now = new Date();

  await db.delete(videos);
  await db.delete(accounts);
  await db.delete(sessions);
  await db.delete(verificationTokens);
  await db.delete(users).where(ne(users.id, owner.id));

  const sharedPasswordHash = await hashPassword("masuk123");

  const userRows = dummyCreators.map((creator, index) => ({
    name: creator.fullName,
    email: `${creator.username}@dummy.videoport.ai`,
    username: creator.username,
    role: creator.role,
    bio: creator.bio,
    experience: creator.experience,
    city: creator.city,
    address: `${creator.city}, Indonesia`,
    contactEmail: `${creator.username}@dummy.videoport.ai`,
    phoneNumber: `+628120000${String(index + 1).padStart(3, "0")}`,
    websiteUrl: creator.websiteUrl,
    instagramUrl: creator.instagramUrl,
    youtubeUrl: creator.youtubeUrl,
    facebookUrl: creator.facebookUrl,
    threadsUrl: creator.threadsUrl,
    skills: creator.skills,
    image: creator.avatarUrl,
    coverImageUrl: creator.coverImageUrl,
    birthDate: `199${index % 9}-0${(index % 8) + 1}-15`,
    passwordHash: sharedPasswordHash,
    locale: "id",
    prefersDarkMode: false,
    createdAt: now,
    updatedAt: now,
  }));

  const createdUsers = await db
    .insert(users)
    .values(userRows)
    .returning({ id: users.id, username: users.username });

  const videoRows = createdUsers.flatMap((item, index) =>
    buildVideosForCreator(item.id, item.username || `creator-${index + 1}`, index).map(
      (video) => ({
        ...video,
        createdAt: now,
        updatedAt: now,
      })
    )
  );

  await db.insert(videos).values(videoRows);

  console.log(`Owner preserved: ${owner.email}`);
  console.log(`Inserted dummy creators: ${createdUsers.length}`);
  console.log(`Inserted dummy videos: ${videoRows.length}`);
}

resetAndSeedDummy()
  .catch((error) => {
    console.error("Failed to reset and seed dummy data", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { pool } = await import("@/db");
    await pool.end();
  });
