import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import {
  createLinkItem,
  normalizeOrder,
  normalizeStoredLinks,
  type LinkItem,
} from "@/lib/link-builder";
import { onboardingProgressSchema } from "@/lib/onboarding";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getOrCreateUserOnboarding, updateUserOnboardingProgress } from "@/server/onboarding";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

function mapOnboardingValidationMessage(input?: {
  message?: string;
  path?: PropertyKey[];
}) {
  const rawField = input?.path?.[0];
  const field =
    typeof rawField === "string" || typeof rawField === "number" ? rawField : undefined;
  if (field === "fullName" || field === "profile") {
    return "Data belum lengkap. Pastikan nama dan username sudah benar.";
  }
  if (field === "username") {
    return "Username wajib diisi dan minimal 3 karakter.";
  }
  if (field === "firstLink" || field === "title" || field === "url" || field === "platform") {
    return "Isi judul dan URL jika ingin menambahkan link pertama.";
  }

  const message = (input?.message || "").toLowerCase();
  if (message.includes("too small") || message.includes("expected string")) {
    return "Data belum lengkap. Pastikan nama dan username sudah benar.";
  }

  return input?.message || "Payload onboarding tidak valid.";
}

function hasMinimalPublicProfile(input: {
  fullName?: string;
  username?: string;
  role?: string;
  bio?: string;
}) {
  const fullName = (input.fullName || "").trim();
  const username = (input.username || "").trim();

  return Boolean(fullName && username);
}

function isOnboardingTiktokLink(link: LinkItem) {
  return (
    link.platform === "tiktok" ||
    link.metadata?.onboardingSocialPlatform === "tiktok" ||
    link.metadata?.source === "onboarding_social_tiktok"
  );
}

function syncOnboardingTiktokLink(links: LinkItem[], url: string) {
  const existingIndex = links.findIndex(isOnboardingTiktokLink);
  if (!url) {
    if (existingIndex < 0) {
      return { links, changed: false, added: false };
    }
    return {
      links: normalizeOrder(links.filter((_, index) => index !== existingIndex)),
      changed: true,
      added: false,
    };
  }

  if (existingIndex >= 0) {
    const existing = links[existingIndex];
    if (existing.url === url && existing.enabled !== false) {
      return { links, changed: false, added: false };
    }

    return {
      links: normalizeOrder(
        links.map((link, index) =>
          index === existingIndex
            ? {
                ...link,
                title: "TikTok",
                url,
                value: url,
                finalUrl: url,
                platform: "tiktok",
                enabled: true,
                metadata: {
                  ...(link.metadata || {}),
                  onboardingSocialPlatform: "tiktok",
                  source: "onboarding_social_tiktok",
                },
              }
            : link
        )
      ),
      changed: true,
      added: false,
    };
  }

  return {
    links: normalizeOrder([
      ...links,
      {
        id: crypto.randomUUID(),
        type: "social",
        title: "TikTok",
        url,
        value: url,
        platform: "tiktok",
        inputValue: url,
        finalUrl: url,
        enabled: true,
        order: links.length,
        metadata: {
          onboardingSocialPlatform: "tiktok",
          source: "onboarding_social_tiktok",
        },
      },
    ]),
    changed: true,
    added: true,
  };
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan onboarding creator." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = onboardingProgressSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: mapOnboardingValidationMessage({
          message: issue?.message,
          path: issue?.path,
        }),
      },
      { status: 400 }
    );
  }

  const onboarding = await getOrCreateUserOnboarding({
    userId: currentUser.id,
    customLinks: currentUser.customLinks,
    createdAt: currentUser.createdAt,
    profile: {
      fullName: currentUser.name,
      username: currentUser.username,
      role: currentUser.role,
      bio: currentUser.bio,
    },
  });
  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const linkBuilderMax = entitlementState.entitlements.linkBuilderMax;

  let latestLinks =
    typeof linkBuilderMax === "number"
      ? normalizeStoredLinks(currentUser.customLinks, linkBuilderMax)
      : normalizeStoredLinks(currentUser.customLinks);
  let firstLinkCreated = onboarding.firstLinkCreated || latestLinks.length > 0;
  const wantsToAddFirstLink = parsed.data.wantsToAddFirstLink ?? parsed.data.createFirstLink;
  let profilePatchApplied = false;

  const profile = parsed.data.profile;
  if (profile && Object.keys(profile).length > 0) {
    const updatePayload: Partial<typeof users.$inferInsert> = {};

    if (typeof profile.fullName === "string") {
      updatePayload.name = profile.fullName.trim();
    }
    if (typeof profile.role === "string") {
      updatePayload.role = profile.role.trim();
    }
    if (typeof profile.bio === "string") {
      updatePayload.bio = profile.bio.trim();
    }
    if (typeof profile.image === "string") {
      updatePayload.image = profile.image.trim();
    }
    if (typeof profile.coverImageUrl === "string") {
      updatePayload.coverImageUrl = profile.coverImageUrl.trim();
    }

    if (isDatabaseConfigured) {
      if (typeof profile.username === "string" && profile.username !== currentUser.username) {
        const existingUser = await db.query.users.findFirst({
          where: and(eq(users.username, profile.username), ne(users.id, currentUser.id)),
          columns: { id: true },
        });
        if (existingUser) {
          return NextResponse.json(
            { error: "Username sudah dipakai user lain.", code: "username_taken" },
            { status: 409 }
          );
        }
        updatePayload.username = profile.username;
      }

      if (Object.keys(updatePayload).length > 0) {
        profilePatchApplied = true;
        const [updatedUser] = await db
          .update(users)
          .set({
            ...updatePayload,
            updatedAt: new Date(),
          })
          .where(eq(users.id, currentUser.id))
          .returning({
            customLinks: users.customLinks,
          });

        latestLinks =
          typeof linkBuilderMax === "number"
            ? normalizeStoredLinks(updatedUser?.customLinks ?? latestLinks, linkBuilderMax)
            : normalizeStoredLinks(updatedUser?.customLinks ?? latestLinks);
      }
    } else if (process.env.NODE_ENV !== "production") {
      if (typeof profile.username === "string") {
        updatePayload.username = profile.username;
      }
      profilePatchApplied = Object.keys(updatePayload).length > 0;
    }
  }

  const socialLinks = parsed.data.socialLinks;
  if (socialLinks && Object.keys(socialLinks).length > 0) {
    const socialPatch: Partial<typeof users.$inferInsert> = {};
    if (typeof socialLinks.instagram === "string") {
      socialPatch.instagramUrl = socialLinks.instagram;
    }
    if (typeof socialLinks.youtube === "string") {
      socialPatch.youtubeUrl = socialLinks.youtube;
    }
    if (typeof socialLinks.website === "string") {
      socialPatch.websiteUrl = socialLinks.website;
    }

    const tiktokSync = syncOnboardingTiktokLink(latestLinks, socialLinks.tiktok || "");
    if (tiktokSync.added && typeof linkBuilderMax === "number") {
      const activeCount = latestLinks.filter((item) => item.enabled !== false).length;
      if (activeCount + 1 > linkBuilderMax) {
        return NextResponse.json(
          {
            error:
              linkBuilderMax === 5
                ? "Batas 5 link tercapai. Upgrade ke Creator untuk menambah link TikTok."
                : `Batas ${linkBuilderMax} link tercapai.`,
            code: "link_limit_exceeded",
          },
          { status: 403 }
        );
      }
    }

    if (isDatabaseConfigured && (Object.keys(socialPatch).length > 0 || tiktokSync.changed)) {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...socialPatch,
          ...(tiktokSync.changed ? { customLinks: tiktokSync.links } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id))
        .returning({
          customLinks: users.customLinks,
        });

      latestLinks =
        typeof linkBuilderMax === "number"
          ? normalizeStoredLinks(updatedUser?.customLinks ?? tiktokSync.links, linkBuilderMax)
          : normalizeStoredLinks(updatedUser?.customLinks ?? tiktokSync.links);
      profilePatchApplied = true;
    } else if (!isDatabaseConfigured && process.env.NODE_ENV !== "production") {
      latestLinks = tiktokSync.links;
      profilePatchApplied = true;
    }

    const hasAnySocial = Boolean(
      socialLinks.instagram || socialLinks.tiktok || socialLinks.youtube || socialLinks.website
    );
    firstLinkCreated = firstLinkCreated || hasAnySocial || latestLinks.length > 0;
  }

  if (parsed.data.createFirstLink && wantsToAddFirstLink) {
    const requestedLinks = parsed.data.links?.length ? parsed.data.links : parsed.data.firstLink ? [parsed.data.firstLink] : [];
    if (!requestedLinks.length) {
      return NextResponse.json(
        { error: "Isi minimal satu link terlebih dahulu." },
        { status: 400 }
      );
    }

    if (!firstLinkCreated && !isDatabaseConfigured && process.env.NODE_ENV !== "production") {
      firstLinkCreated = true;
    } else if (!firstLinkCreated) {
      const activeCount = latestLinks.filter((item) => item.enabled !== false).length;
      const enabledIncomingCount = requestedLinks.filter((item) => item.enabled !== false).length;
      if (typeof linkBuilderMax === "number" && activeCount + enabledIncomingCount > linkBuilderMax) {
        return NextResponse.json(
          {
            error:
              linkBuilderMax === 5
                ? "Batas 5 link tercapai. Upgrade ke Creator untuk menambah link."
                : `Batas ${linkBuilderMax} link tercapai.`,
            code: "link_limit_exceeded",
          },
          { status: 403 }
        );
      }

      const createdLinks = requestedLinks.reduce((items, link) => {
        const createdLink = createLinkItem(
          {
            type: "link",
            title: link.title,
            url: link.url,
            value: "",
            platform: link.platform || "",
            description: "",
            badge: "",
            thumbnailUrl: "",
            style: "",
            iconKey: "",
            iconUrl: "",
            enabled: link.enabled !== false,
          },
          items
        );
        return [...items, createdLink];
      }, latestLinks);

      const nextLinks = normalizeOrder(createdLinks);
      const [updated] = await db
        .update(users)
        .set({
          customLinks: nextLinks,
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id))
        .returning({
          customLinks: users.customLinks,
        });

      latestLinks =
        typeof linkBuilderMax === "number"
          ? normalizeStoredLinks(updated?.customLinks ?? nextLinks, linkBuilderMax)
          : normalizeStoredLinks(updated?.customLinks ?? nextLinks);
    }
    firstLinkCreated = true;
  }

  const existingPayload =
    onboarding.progressPayload && typeof onboarding.progressPayload === "object"
      ? onboarding.progressPayload
      : {};

  const progressPayload = {
    ...existingPayload,
    ...(parsed.data.progressPayload || {}),
    ...(profile ? { profile } : {}),
    ...(socialLinks ? { socialLinks } : {}),
    ...(parsed.data.firstLink ? { firstLink: parsed.data.firstLink } : {}),
    ...(parsed.data.links ? { links: parsed.data.links } : {}),
  };

  const status = await updateUserOnboardingProgress({
    userId: currentUser.id,
    currentStep: parsed.data.currentStep ?? onboarding.currentStep,
    onboardingSkipped: false,
    firstLinkCreated,
    hasPublicProfile: hasMinimalPublicProfile({
      fullName: profile?.fullName ?? (typeof currentUser.name === "string" ? currentUser.name : ""),
      username: profile?.username ?? (typeof currentUser.username === "string" ? currentUser.username : ""),
      role: profile?.role ?? (typeof currentUser.role === "string" ? currentUser.role : ""),
      bio: profile?.bio ?? (typeof currentUser.bio === "string" ? currentUser.bio : ""),
    }),
    progressPayload,
  });

  return NextResponse.json({
    status,
    links: latestLinks,
    profilePatched: profilePatchApplied,
    linkBuilderMax,
    planName: entitlementState.effectivePlan.planName,
  });
}
