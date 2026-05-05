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
  linkedinUrl: string;
  avatarUrl: string;
  coverImageUrl: string;
  skills: string[];
};

function createDummyCreator(
  fullName: string,
  username: string,
  role: string,
  city: string,
  bio: string,
  experience: string,
  skills: string[],
  avatarUrl: string,
  coverImageUrl: string
): DummyCreatorSeed {
  return {
    fullName,
    username,
    role,
    city,
    bio,
    experience,
    websiteUrl: `https://${username}.showreels.example.com`,
    instagramUrl: `https://instagram.com/${username}edit`,
    youtubeUrl: `https://youtube.com/@${username}edit`,
    facebookUrl: `https://facebook.com/${username}edit`,
    threadsUrl: `https://threads.net/@${username}edit`,
    linkedinUrl: `https://linkedin.com/in/${username}edit`,
    avatarUrl,
    coverImageUrl,
    skills,
  };
}

const dummyCreators: DummyCreatorSeed[] = [
  createDummyCreator(
    "Raka Mahendra",
    "raka",
    "Video Editor",
    "Jakarta",
    "Editor konten edukasi dan teknologi dengan style clean dan cepat.",
    "5 tahun menangani konten edukasi, launch produk, dan corporate social media.",
    ["Video Editing", "Color Grading", "Sound Design"],
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Nadia Pratiwi",
    "nadia",
    "Videografer",
    "Bandung",
    "Videografer wedding dan event dengan pendekatan cinematic ringan.",
    "4 tahun menangani wedding, event kampus, dan dokumentasi komunitas.",
    ["Videography", "Direction", "Storyboarding"],
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Dimas Pratama",
    "dimas",
    "Content Creator",
    "Yogyakarta",
    "Creator travel dan lifestyle, fokus visual storytelling personal brand.",
    "3 tahun membuat konten travel komersial untuk hotel, F&B, dan tourism board.",
    ["Content Strategy", "Scripting", "Editing"],
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Salsa Aulia",
    "salsa",
    "Motion Designer",
    "Surabaya",
    "Mengerjakan social ads dan motion reel dengan pacing cepat dan tegas.",
    "4 tahun mengembangkan motion campaign untuk brand retail dan SaaS lokal.",
    ["Motion Graphics", "Editing", "Brand Ads"],
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Farhan Akbar",
    "farhan",
    "Video Editor",
    "Semarang",
    "Spesialis edit talking head, course, dan launch product video.",
    "6 tahun mengelola edit funnel video untuk creator education dan startup.",
    ["Talking Head", "Launch Video", "Audio Cleanup"],
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Mira Lestari",
    "mira",
    "Creative Producer",
    "Denpasar",
    "Mengkurasi konten brand hospitality dan lifestyle dengan visual lembut.",
    "5 tahun memimpin produksi konten hotel, villa, dan travel destination.",
    ["Creative Direction", "Hospitality Content", "Production"],
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Yoga Saputra",
    "yoga",
    "Cinematographer",
    "Malang",
    "Fokus pada video otomotif dan produk dengan framing dinamis.",
    "4 tahun menangani automotive commercial dan product showcase.",
    ["Cinematography", "Product Video", "Drone"],
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43f?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Tiara Putri",
    "tiara",
    "Reels Specialist",
    "Makassar",
    "Membuat reels komersial yang tajam untuk fashion dan beauty.",
    "3 tahun fokus di vertical video performance content untuk UMKM dan brand lokal.",
    ["Vertical Video", "Beauty Ads", "Hooks"],
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Bagas Wibowo",
    "bagas",
    "Post Producer",
    "Medan",
    "Mengolah footage interview dan corporate recap supaya ringkas dan kuat.",
    "5 tahun mengerjakan corporate recap, event highlight, dan testimonial.",
    ["Interview Edit", "Corporate Video", "Subtitles"],
    "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80"
  ),
  createDummyCreator(
    "Keisha Ramadhani",
    "keisha",
    "Visual Storyteller",
    "Bekasi",
    "Menggabungkan visual brand, dokumentasi event, dan story arc yang mudah dipahami.",
    "4 tahun membangun portfolio untuk event, personal brand, dan short campaign.",
    ["Storytelling", "Event Video", "Brand Narrative"],
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1600&q=80"
  ),
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
    source: "facebook" as const,
    sourceUrl: "https://www.facebook.com/watch/?v=10153231379946729",
    thumbnailUrl: "https://picsum.photos/seed/fb-video/1280/720",
    aspectRatio: "landscape" as const,
  },
  {
    source: "gdrive" as const,
    sourceUrl: "https://drive.google.com/file/d/1E6oJ0v6QYQ2qVz4QdN2s8y4Yz9kLmN8T/view?usp=sharing",
    thumbnailUrl: "https://picsum.photos/seed/gdrive-video/1280/720",
    aspectRatio: "landscape" as const,
  },
];

function buildVideosForCreator(userId: string, username: string, index: number) {
  const first = sourcePool[index % sourcePool.length];
  const second = sourcePool[(index + 1) % sourcePool.length];
  const third = sourcePool[(index + 2) % sourcePool.length];
  const fourth = sourcePool[(index + 3) % sourcePool.length];

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
      title: `Brand Reel ${username}`,
      description:
        "Highlight video brand dengan hook cepat, visual konsisten, dan closing CTA yang rapi.",
      tags: ["brand", "reels", "campaign"],
      visibility: "public" as const,
      source: second.source,
      sourceUrl: second.sourceUrl,
      thumbnailUrl: second.thumbnailUrl,
      aspectRatio: second.aspectRatio,
      outputType: "Instagram Reels",
      durationLabel: "00:38",
      publicSlug: `${username}-brand-reel-2026`,
      imageUrls: [`https://picsum.photos/seed/${username}-img-2/1200/800`],
      extraVideoUrls: [],
    },
    {
      userId,
      title: `Client Review ${username}`,
      description:
        "Versi semi-private untuk client review, masih terbuka untuk revisi minor dan approval final.",
      tags: ["review", "client", "semi-private"],
      visibility: "semi_private" as const,
      source: third.source,
      sourceUrl: third.sourceUrl,
      thumbnailUrl: third.thumbnailUrl,
      aspectRatio: third.aspectRatio,
      outputType: "Review Cut",
      durationLabel: "00:52",
      publicSlug: `${username}-client-review-2026`,
      imageUrls: [`https://picsum.photos/seed/${username}-img-3/1200/800`],
      extraVideoUrls: [],
    },
    {
      userId,
      title: `Campaign Draft ${username}`,
      description:
        "Draft campaign untuk revisi internal, masih dalam tahap penyempurnaan pacing dan CTA.",
      tags: ["draft", "campaign"],
      visibility: "draft" as const,
      source: fourth.source,
      sourceUrl: fourth.sourceUrl,
      thumbnailUrl: fourth.thumbnailUrl,
      aspectRatio: fourth.aspectRatio,
      outputType: "Reels",
      durationLabel: "00:45",
      publicSlug: `${username}-campaign-draft-2026`,
      imageUrls: [`https://picsum.photos/seed/${username}-img-4/1200/800`],
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

  for (const [index, creator] of dummyCreators.entries()) {
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
        linkedinUrl: creator.linkedinUrl,
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
          linkedinUrl: creator.linkedinUrl,
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
      buildVideosForCreator(authUser.id, username, index).map((video) => ({
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
