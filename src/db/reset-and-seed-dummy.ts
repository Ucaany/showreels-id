import { config } from "dotenv";
import { ne, sql } from "drizzle-orm";
import { users, videos } from "@/db/schema";
import { ensureAuthUser, upsertOwnerAccount } from "@/db/owner-utils";

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
];

function buildVideosForCreator(userId: string, username: string, index: number) {
  const first = sourcePool[index % sourcePool.length];
  const second = sourcePool[(index + 1) % sourcePool.length];

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
      visibility: "draft" as const,
      source: second.source,
      sourceUrl: second.sourceUrl,
      thumbnailUrl: second.thumbnailUrl,
      aspectRatio: second.aspectRatio,
      outputType: "Reels",
      durationLabel: "00:45",
      publicSlug: `${username}-campaign-draft-2026`,
      imageUrls: [`https://picsum.photos/seed/${username}-img-2/1200/800`],
      extraVideoUrls: [],
    },
  ];
}

async function resetAndSeedDummy() {
  const { db } = await import("@/db");
  const { ensureUniqueUsername } = await import("@/lib/username");
  const owner = await upsertOwnerAccount();
  const now = new Date();

  await db.delete(videos);
  await db.delete(users).where(ne(users.id, owner.id));
  await db.execute(
    sql`delete from auth.users where email like '%@dummy.showreels.id' and id <> ${owner.id}::uuid`
  );

  for (const creator of dummyCreators) {
    const email = `${creator.username}@dummy.showreels.id`;
    const authUser = await ensureAuthUser({
      email,
      password: "masuk123",
      name: creator.fullName,
      username: creator.username,
    });

    const username = await ensureUniqueUsername(creator.username);
    await db
      .insert(users)
      .values({
        id: authUser.id,
        email,
        name: creator.fullName,
        username,
        role: creator.role,
        bio: creator.bio,
        experience: creator.experience,
        city: creator.city,
        address: `${creator.city}, Indonesia`,
        contactEmail: email,
        phoneNumber: "+628120000001",
        websiteUrl: creator.websiteUrl,
        instagramUrl: creator.instagramUrl,
        youtubeUrl: creator.youtubeUrl,
        facebookUrl: creator.facebookUrl,
        threadsUrl: creator.threadsUrl,
        skills: creator.skills,
        image: creator.avatarUrl,
        coverImageUrl: creator.coverImageUrl,
        birthDate: "1995-01-15",
        locale: "id",
        prefersDarkMode: false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          name: creator.fullName,
          username,
          role: creator.role,
          bio: creator.bio,
          experience: creator.experience,
          city: creator.city,
          address: `${creator.city}, Indonesia`,
          contactEmail: email,
          phoneNumber: "+628120000001",
          websiteUrl: creator.websiteUrl,
          instagramUrl: creator.instagramUrl,
          youtubeUrl: creator.youtubeUrl,
          facebookUrl: creator.facebookUrl,
          threadsUrl: creator.threadsUrl,
          skills: creator.skills,
          image: creator.avatarUrl,
          coverImageUrl: creator.coverImageUrl,
          birthDate: "1995-01-15",
          locale: "id",
          prefersDarkMode: false,
          updatedAt: now,
        },
      });

    await db.insert(videos).values(
      buildVideosForCreator(authUser.id, username, 0).map((video) => ({
        ...video,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }

  console.log(`Owner preserved: ${owner.email}`);
  console.log(`Inserted dummy creators: ${dummyCreators.length}`);
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
