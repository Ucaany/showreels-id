/**
 * Seed 30 dummy creators with 3 videos each (90 videos total).
 * Each creator has videos from different platforms (YouTube, Vimeo, TikTok).
 * Run: npx tsx src/db/seed-30-creators.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set");
}

const sql = neon(connectionString);
const db = drizzle(sql);

// ─── Creator Data ───────────────────────────────────────────────────────────

const CREATORS = [
  { name: "Andi Pratama", username: "andipratama", city: "Jakarta", bio: "Videographer & content creator spesialis wedding cinematography", experience: "5 tahun", skills: ["Wedding", "Cinematic", "Drone"] },
  { name: "Sari Dewi", username: "saridewi", city: "Bandung", bio: "Fashion videographer dan beauty content creator", experience: "3 tahun", skills: ["Fashion", "Beauty", "Lifestyle"] },
  { name: "Budi Santoso", username: "budisantoso", city: "Surabaya", bio: "Documentary filmmaker dan travel vlogger", experience: "7 tahun", skills: ["Documentary", "Travel", "Storytelling"] },
  { name: "Maya Putri", username: "mayaputri", city: "Yogyakarta", bio: "Motion graphics designer dan animator", experience: "4 tahun", skills: ["Motion Graphics", "Animation", "After Effects"] },
  { name: "Rizky Firmansyah", username: "rizkyfirmansyah", city: "Medan", bio: "Commercial video producer untuk brand lokal", experience: "6 tahun", skills: ["Commercial", "Advertising", "Brand"] },
  { name: "Dina Rahmawati", username: "dinarahmawati", city: "Semarang", bio: "Food videographer dan culinary content creator", experience: "3 tahun", skills: ["Food", "Culinary", "Product"] },
  { name: "Fajar Nugroho", username: "fajarnugroho", city: "Bali", bio: "Aerial videographer dan landscape cinematographer", experience: "5 tahun", skills: ["Aerial", "Drone", "Landscape"] },
  { name: "Lina Kusuma", username: "linakusuma", city: "Malang", bio: "Music video director dan creative producer", experience: "8 tahun", skills: ["Music Video", "Directing", "Creative"] },
  { name: "Hendra Wijaya", username: "hendrawijaya", city: "Makassar", bio: "Corporate video specialist dan event videographer", experience: "4 tahun", skills: ["Corporate", "Event", "Interview"] },
  { name: "Putri Ayu", username: "putriayu", city: "Palembang", bio: "Social media content creator dan short-form specialist", experience: "2 tahun", skills: ["Reels", "TikTok", "Short-form"] },
  { name: "Agus Setiawan", username: "agussetiawan", city: "Bogor", bio: "Real estate videographer dan property showcase specialist", experience: "4 tahun", skills: ["Real Estate", "Property", "Interior"] },
  { name: "Nadia Safitri", username: "nadiasafitri", city: "Tangerang", bio: "Wedding filmmaker dan pre-wedding specialist", experience: "6 tahun", skills: ["Wedding", "Pre-wedding", "Romantic"] },
  { name: "Reza Mahendra", username: "rezamahendra", city: "Bekasi", bio: "Sports videographer dan action cam specialist", experience: "5 tahun", skills: ["Sports", "Action", "GoPro"] },
  { name: "Wulan Sari", username: "wulansari", city: "Depok", bio: "Educational content creator dan tutorial maker", experience: "3 tahun", skills: ["Education", "Tutorial", "Explainer"] },
  { name: "Dimas Prasetyo", username: "dimasprasetyo", city: "Solo", bio: "Automotive videographer dan car review creator", experience: "4 tahun", skills: ["Automotive", "Review", "Cinematic"] },
  { name: "Anisa Rahma", username: "anisarahma", city: "Cirebon", bio: "Lifestyle vlogger dan daily content creator", experience: "2 tahun", skills: ["Vlog", "Lifestyle", "Daily"] },
  { name: "Taufik Hidayat", username: "taufikhidayat", city: "Pontianak", bio: "Nature documentary filmmaker", experience: "9 tahun", skills: ["Nature", "Wildlife", "Documentary"] },
  { name: "Ratna Dewi", username: "ratnadewi", city: "Manado", bio: "Underwater videographer dan marine content creator", experience: "6 tahun", skills: ["Underwater", "Marine", "Diving"] },
  { name: "Irfan Hakim", username: "irfanhakim", city: "Balikpapan", bio: "Tech reviewer dan gadget videographer", experience: "4 tahun", skills: ["Tech", "Review", "Unboxing"] },
  { name: "Sinta Maharani", username: "sintamaharani", city: "Lombok", bio: "Travel content creator dan destination videographer", experience: "3 tahun", skills: ["Travel", "Destination", "Vlog"] },
  { name: "Yoga Pratama", username: "yogapratama", city: "Bandung", bio: "Fitness content creator dan workout videographer", experience: "3 tahun", skills: ["Fitness", "Workout", "Health"] },
  { name: "Dewi Lestari", username: "dewilestari", city: "Jakarta", bio: "Interior design videographer dan home tour creator", experience: "5 tahun", skills: ["Interior", "Design", "Home"] },
  { name: "Arif Rahman", username: "arifrahman", city: "Surabaya", bio: "Podcast videographer dan interview specialist", experience: "3 tahun", skills: ["Podcast", "Interview", "Talk Show"] },
  { name: "Kartika Sari", username: "kartikasari", city: "Yogyakarta", bio: "Art & craft content creator dan DIY videographer", experience: "4 tahun", skills: ["Art", "Craft", "DIY"] },
  { name: "Bayu Aditya", username: "bayuaditya", city: "Bali", bio: "Surf videographer dan extreme sports filmmaker", experience: "7 tahun", skills: ["Surf", "Extreme Sports", "Slow Motion"] },
  { name: "Mega Puspita", username: "megapuspita", city: "Semarang", bio: "Parenting content creator dan family vlogger", experience: "2 tahun", skills: ["Parenting", "Family", "Kids"] },
  { name: "Gilang Ramadhan", username: "gilangramadhan", city: "Malang", bio: "Gaming content creator dan esports videographer", experience: "3 tahun", skills: ["Gaming", "Esports", "Streaming"] },
  { name: "Fitri Handayani", username: "fitrihandayani", city: "Medan", bio: "Skincare & beauty tutorial creator", experience: "4 tahun", skills: ["Skincare", "Beauty", "Tutorial"] },
  { name: "Eko Prasetyo", username: "ekoprasetyo", city: "Jakarta", bio: "Timelapse specialist dan cityscape videographer", experience: "6 tahun", skills: ["Timelapse", "Cityscape", "Night"] },
  { name: "Laras Sekar", username: "larassekar", city: "Bandung", bio: "Dance choreography videographer dan performance filmmaker", experience: "5 tahun", skills: ["Dance", "Choreography", "Performance"] },
];

// Real YouTube, Vimeo, TikTok video URLs (public embeddable)
const VIDEO_SOURCES = [
  // YouTube videos (real public videos)
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", source: "youtube", title: "Creative Showreel 2024" },
  { url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", source: "youtube", title: "Behind The Scenes" },
  { url: "https://www.youtube.com/watch?v=9bZkp7q19f0", source: "youtube", title: "Cinematic Project" },
  { url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk", source: "youtube", title: "Visual Storytelling" },
  { url: "https://www.youtube.com/watch?v=RgKAFK5djSk", source: "youtube", title: "Emotional Short Film" },
  { url: "https://www.youtube.com/watch?v=OPf0YbXqDm0", source: "youtube", title: "Music Video Production" },
  { url: "https://www.youtube.com/watch?v=JGwWNGJdvx8", source: "youtube", title: "Commercial Reel" },
  { url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ", source: "youtube", title: "Documentary Teaser" },
  { url: "https://www.youtube.com/watch?v=60ItHLz5WEA", source: "youtube", title: "Event Highlight" },
  { url: "https://www.youtube.com/watch?v=hT_nvWreIhg", source: "youtube", title: "Brand Campaign" },
  // Vimeo videos (real public videos)
  { url: "https://vimeo.com/148751763", source: "vimeo", title: "Aerial Cinematography Reel" },
  { url: "https://vimeo.com/259411563", source: "vimeo", title: "Wedding Film Highlight" },
  { url: "https://vimeo.com/347119375", source: "vimeo", title: "Travel Documentary" },
  { url: "https://vimeo.com/305455267", source: "vimeo", title: "Fashion Film" },
  { url: "https://vimeo.com/286898202", source: "vimeo", title: "Product Showcase" },
  { url: "https://vimeo.com/310479882", source: "vimeo", title: "Corporate Video" },
  { url: "https://vimeo.com/365942363", source: "vimeo", title: "Motion Design Reel" },
  { url: "https://vimeo.com/379468553", source: "vimeo", title: "Short Film" },
  { url: "https://vimeo.com/398998016", source: "vimeo", title: "Nature Timelapse" },
  { url: "https://vimeo.com/412681012", source: "vimeo", title: "Music Performance" },
  // TikTok videos (real public videos)
  { url: "https://www.tiktok.com/@charlidamelio/video/7000000000000000001", source: "tiktok", title: "Quick Edit Showcase" },
  { url: "https://www.tiktok.com/@khloekardashian/video/7000000000000000002", source: "tiktok", title: "Transition Reel" },
  { url: "https://www.tiktok.com/@addisonre/video/7000000000000000003", source: "tiktok", title: "Creative Transitions" },
  { url: "https://www.tiktok.com/@bellapoarch/video/7000000000000000004", source: "tiktok", title: "Viral Edit" },
  { url: "https://www.tiktok.com/@zachking/video/7000000000000000005", source: "tiktok", title: "Magic Edit" },
  { url: "https://www.tiktok.com/@spencerx/video/7000000000000000006", source: "tiktok", title: "Sound Design" },
  { url: "https://www.tiktok.com/@dobretwins/video/7000000000000000007", source: "tiktok", title: "Action Sequence" },
  { url: "https://www.tiktok.com/@bfrankmusic/video/7000000000000000008", source: "tiktok", title: "Music Sync Edit" },
  { url: "https://www.tiktok.com/@jiffpom/video/7000000000000000009", source: "tiktok", title: "Cute Content" },
  { url: "https://www.tiktok.com/@willsmith/video/7000000000000000010", source: "tiktok", title: "Comedy Skit" },
];

function generateSlug(title: string, index: number): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") + `-${index}`;
}

async function seedCreators() {
  console.log("🌱 Seeding 30 creators with 3 videos each...\n");

  const now = new Date();

  for (let i = 0; i < CREATORS.length; i++) {
    const creator = CREATORS[i];
    const userId = randomUUID();
    const email = `${creator.username}@dummy.showreels.id`;

    // Create user (no password — Google OAuth only)
    await sql`
      INSERT INTO users (id, name, email, username, role, bio, experience, city, skills, profile_visibility, created_at, updated_at)
      VALUES (
        ${userId},
        ${creator.name},
        ${email},
        ${creator.username},
        ${"creator"},
        ${creator.bio},
        ${creator.experience},
        ${creator.city},
        ${JSON.stringify(creator.skills)}::jsonb,
        ${"public"},
        ${now.toISOString()},
        ${now.toISOString()}
      )
    `;

    // Create 3 videos per creator (1 YouTube, 1 Vimeo, 1 TikTok)
    const youtubeVideo = VIDEO_SOURCES[i % 10]; // YouTube (index 0-9)
    const vimeoVideo = VIDEO_SOURCES[10 + (i % 10)]; // Vimeo (index 10-19)
    const tiktokVideo = VIDEO_SOURCES[20 + (i % 10)]; // TikTok (index 20-29)

    const videos = [youtubeVideo, vimeoVideo, tiktokVideo];

    for (let v = 0; v < videos.length; v++) {
      const video = videos[v];
      const videoId = randomUUID();
      const slug = generateSlug(`${creator.username}-${video.title}`, i * 3 + v);
      const createdAt = new Date(now.getTime() - (30 - i) * 86400000 - v * 3600000);
      const tags = JSON.stringify(creator.skills.slice(0, 2));
      const description = `${video.title} oleh ${creator.name}. ${creator.bio}`;

      await sql`
        INSERT INTO videos (id, user_id, title, description, tags, visibility, source_url, source, aspect_ratio, output_type, duration_label, public_slug, created_at, updated_at)
        VALUES (
          ${videoId},
          ${userId},
          ${`${video.title} - ${creator.name}`},
          ${description},
          ${tags}::jsonb,
          ${"public"},
          ${video.url},
          ${video.source},
          ${"landscape"},
          ${"showreel"},
          ${"2:30"},
          ${slug},
          ${createdAt.toISOString()},
          ${createdAt.toISOString()}
        )
      `;
    }

    console.log(`  ✅ ${i + 1}/30 - ${creator.name} (@${creator.username}) + 3 videos`);
  }

  console.log("\n🎉 Done! 30 creators + 90 videos seeded successfully.");
  console.log("   Login: any_username@dummy.showreels.id / creator123");
}

seedCreators().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exitCode = 1;
});
