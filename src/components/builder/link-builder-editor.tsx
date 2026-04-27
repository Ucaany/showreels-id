"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  ExternalLink,
  GripVertical,
  ImageIcon,
  Link2,
  Minus,
  Monitor,
  Music2,
  PlayCircle,
  PencilLine,
  Plus,
  Save,
  Search,
  Share2,
  Smartphone,
  Trash2,
  Type,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import {
  MAX_CUSTOM_LINKS,
  MAX_LINK_DESCRIPTION_LENGTH,
  MAX_LINK_TITLE_LENGTH,
  normalizeCustomLinks,
  normalizeSocialUrl,
  type CustomLinkItem,
} from "@/lib/profile-utils";
import {
  isReservedUsername,
  isUsernameFormatValid,
  sanitizeUsername,
} from "@/lib/username-rules";
import {
  type ExperienceItem,
  parseExperiencePayload,
  serializeExperiencePayload,
} from "@/lib/experience-items";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type MobileTab = "edit" | "preview";
type DeviceMode = "mobile" | "desktop";

type LinkBuilderUser = {
  name: string | null;
  username: string | null;
  role: string;
  bio: string;
  experience: string;
  image: string | null;
  coverImageUrl: string;
  birthDate: string;
  city: string;
  address: string;
  contactEmail: string;
  phoneNumber: string;
  websiteUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  threadsUrl: string;
  linkedinUrl: string;
  skills: string[];
  avatarCropX: number;
  avatarCropY: number;
  avatarCropZoom: number;
  coverCropX: number;
  coverCropY: number;
  coverCropZoom: number;
  customLinks: unknown;
};

type EditableLink = CustomLinkItem & {
  isDirty?: boolean;
};

type ExperienceDraft = Omit<ExperienceItem, "id">;

function SortableLinkItem({
  link,
  index,
  total,
  onMove,
  onDelete,
  onToggle,
  onChange,
  onSave,
}: {
  link: EditableLink;
  index: number;
  total: number;
  onMove: (index: number, delta: -1 | 1) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onChange: (id: string, patch: Partial<EditableLink>) => void;
  onSave: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-2xl border border-[#d6e2f7] bg-white p-3 shadow-sm ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d6ccc6] bg-[#f8f3ef] text-[#4f433d]"
            aria-label="Geser urutan link"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-[#201b18]">Link #{index + 1}</p>
          {link.enabled === false ? (
            <span className="rounded-full bg-[#f3efed] px-2 py-0.5 text-[10px] font-semibold text-[#6e6058]">
              Inactive
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(index, -1)}
            aria-label="Move up"
            disabled={index === 0}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(index, 1)}
            aria-label="Move down"
            disabled={index >= total - 1}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onSave(link.id)}>
            <Save className="h-3.5 w-3.5" />
            Simpan
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(link.id)}>
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Judul tombol</label>
            <Input
              value={link.title}
              maxLength={MAX_LINK_TITLE_LENGTH}
              onChange={(event) => onChange(link.id, { title: event.target.value, isDirty: true })}
              placeholder="Contoh: Portfolio Google Drive"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f524b]">URL</label>
            <Input
              value={link.url}
              onChange={(event) => onChange(link.id, { url: event.target.value, isDirty: true })}
              onBlur={(event) =>
                onChange(link.id, {
                  url: normalizeSocialUrl(event.target.value),
                  isDirty: true,
                })
              }
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Platform / Icon</label>
            <Input
              value={link.platform || ""}
              maxLength={30}
              onChange={(event) => onChange(link.id, { platform: event.target.value, isDirty: true })}
              placeholder="Instagram, Vimeo, YouTube"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Badge highlight</label>
            <Input
              value={link.badge || ""}
              maxLength={30}
              onChange={(event) => onChange(link.id, { badge: event.target.value, isDirty: true })}
              placeholder="New, Featured, Promo"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Deskripsi singkat</label>
          <Textarea
            value={link.description || ""}
            maxLength={MAX_LINK_DESCRIPTION_LENGTH}
            onChange={(event) => onChange(link.id, { description: event.target.value, isDirty: true })}
            className="min-h-20"
            placeholder="Opsional, jelaskan link ini untuk calon klien."
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-[#5f524b]">
          <input
            type="checkbox"
            checked={link.enabled !== false}
            onChange={(event) => onToggle(link.id, event.target.checked)}
            className="h-4 w-4 rounded border-[#ccbfb7] text-[#1f58e3]"
          />
          Tampilkan di halaman publik
        </label>
      </div>
    </div>
  );
}

export function LinkBuilderEditor({
  user,
  linkBuilderMax,
  planName,
}: {
  user: LinkBuilderUser;
  linkBuilderMax: number | null;
  planName: "free" | "creator" | "business";
}) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [blockSearch, setBlockSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSavingNow, setIsSavingNow] = useState(false);
  const [links, setLinks] = useState<EditableLink[]>(() =>
    normalizeCustomLinks(user.customLinks, linkBuilderMax ?? MAX_CUSTOM_LINKS).map((link) => ({
      ...link,
    }))
  );
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    description: "",
    platform: "",
    badge: "",
  });
  const [linkSearch, setLinkSearch] = useState("");
  const [profileFields, setProfileFields] = useState({
    fullName: user.name || "",
    username: user.username || "",
    role: user.role || "",
    bio: user.bio || "",
    websiteUrl: user.websiteUrl || "",
    instagramUrl: user.instagramUrl || "",
    youtubeUrl: user.youtubeUrl || "",
    facebookUrl: user.facebookUrl || "",
    threadsUrl: user.threadsUrl || "",
    linkedinUrl: user.linkedinUrl || "",
  });
  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>(() =>
    parseExperiencePayload(user.experience || "")
  );
  const [newExperience, setNewExperience] = useState<ExperienceDraft>({
    title: "",
    organization: "",
    period: "",
    description: "",
    skills: "",
  });
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const serializedExperience = useMemo(
    () => serializeExperiencePayload(experienceItems),
    [experienceItems]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const saveProfileNow = async () => {
    const normalizedUsername = sanitizeUsername(profileFields.username);
    if (!isUsernameFormatValid(normalizedUsername) || isReservedUsername(normalizedUsername)) {
      setSaveStatus("error");
      return;
    }

    if (serializedExperience.length > 700) {
      setSaveStatus("error");
      await showFeedbackAlert({
        title: "Experience terlalu panjang",
        text: "Ringkas item experience agar total maksimal 700 karakter.",
        icon: "error",
      });
      return;
    }

    setIsSavingNow(true);
    setSaveStatus("saving");

    const payload = {
      fullName: profileFields.fullName,
      username: normalizedUsername,
      role: profileFields.role,
      avatarUrl: user.image || "",
      coverImageUrl: user.coverImageUrl || "",
      bio: profileFields.bio,
      experience: serializedExperience,
      birthDate: user.birthDate || "",
      city: user.city || "",
      address: user.address || "",
      contactEmail: user.contactEmail || "",
      phoneNumber: user.phoneNumber || "",
      websiteUrl: normalizeSocialUrl(profileFields.websiteUrl || ""),
      instagramUrl: normalizeSocialUrl(profileFields.instagramUrl || ""),
      youtubeUrl: normalizeSocialUrl(profileFields.youtubeUrl || ""),
      facebookUrl: normalizeSocialUrl(profileFields.facebookUrl || ""),
      threadsUrl: normalizeSocialUrl(profileFields.threadsUrl || ""),
      linkedinUrl: normalizeSocialUrl(profileFields.linkedinUrl || ""),
      customLinks: links.map((link, index) => ({
        ...link,
        order: index,
      })),
      skills: user.skills || [],
      avatarCropX: user.avatarCropX || 0,
      avatarCropY: user.avatarCropY || 0,
      avatarCropZoom: user.avatarCropZoom || 100,
      coverCropX: user.coverCropX || 0,
      coverCropY: user.coverCropY || 0,
      coverCropZoom: user.coverCropZoom || 100,
    };

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSavingNow(false);

    if (!response.ok) {
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saved");
    window.setTimeout(() => setSaveStatus("idle"), 1600);
  };

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(() => {
      void saveProfileNow();
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profileFields.fullName,
    profileFields.username,
    profileFields.role,
    profileFields.bio,
    serializedExperience,
    profileFields.websiteUrl,
    profileFields.instagramUrl,
    profileFields.youtubeUrl,
    profileFields.facebookUrl,
    profileFields.threadsUrl,
    profileFields.linkedinUrl,
  ]);

  const handleAddExperience = () => {
    if (
      !newExperience.title.trim() &&
      !newExperience.organization.trim() &&
      !newExperience.period.trim() &&
      !newExperience.description.trim() &&
      !newExperience.skills.trim()
    ) {
      return;
    }

    const nextItem: ExperienceItem = {
      id: `exp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: newExperience.title.trim().slice(0, 70),
      organization: newExperience.organization.trim().slice(0, 70),
      period: newExperience.period.trim().slice(0, 40),
      description: newExperience.description.trim().slice(0, 220),
      skills: newExperience.skills.trim().slice(0, 120),
    };

    setExperienceItems((prev) => [...prev, nextItem]);
    setNewExperience({
      title: "",
      organization: "",
      period: "",
      description: "",
      skills: "",
    });
  };

  const updateExperienceItem = (
    id: string,
    patch: Partial<Omit<ExperienceItem, "id">>
  ) => {
    setExperienceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleDeleteExperience = (id: string) => {
    setExperienceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddLink = async () => {
    const title = newLink.title.trim();
    const url = normalizeSocialUrl(newLink.url);

    if (!title || !url) {
      await showFeedbackAlert({
        title: "Data link belum lengkap",
        text: "Isi judul dan URL valid terlebih dahulu.",
        icon: "error",
      });
      return;
    }

    const response = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        url,
        description: newLink.description,
        platform: newLink.platform,
        badge: newLink.badge,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menambahkan link",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    const payload = (await response.json()) as { links: EditableLink[] };
    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
    setNewLink({ title: "", url: "", description: "", platform: "", badge: "" });
    setBlockSearch("");
    setIsAddBlockOpen(false);
    await showFeedbackAlert({
      title: "Berhasil disimpan!",
      text: "Perubahan kamu sudah tampil di halaman Showreels.",
      icon: "success",
      timer: 1400,
    });
  };

  const handleDeleteLink = async (id: string) => {
    const confirmed = await confirmFeedbackAction({
      title: "Hapus link ini?",
      text: "Link yang dihapus tidak akan tampil lagi di halaman publikmu.",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!confirmed) return;

    const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menghapus link",
        text: payload?.error || "Coba ulang beberapa saat.",
        icon: "error",
      });
      return;
    }

    const payload = (await response.json()) as { links: EditableLink[] };
    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
    await showFeedbackAlert({
      title: "Link berhasil dihapus",
      icon: "success",
      timer: 1200,
    });
  };

  const handleToggleLink = async (id: string, enabled: boolean) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, enabled } : link)));

    const response = await fetch(`/api/links/${id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Gagal mengubah status link",
        text: "Coba ulang beberapa saat.",
        icon: "error",
      });
      return;
    }

    const payload = (await response.json()) as { links: EditableLink[] };
    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
  };

  const handleSaveLink = async (id: string) => {
    const current = links.find((link) => link.id === id);
    if (!current) return;

    const response = await fetch(`/api/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: current.title,
        url: normalizeSocialUrl(current.url),
        description: current.description || "",
        platform: current.platform || "",
        badge: current.badge || "",
        thumbnailUrl: current.thumbnailUrl || "",
        enabled: current.enabled !== false,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menyimpan perubahan link",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    const payload = (await response.json()) as { links: EditableLink[] };
    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
    await showFeedbackAlert({
      title: "Perubahan berhasil disimpan.",
      icon: "success",
      timer: 1100,
    });
  };

  const handleLocalMove = async (index: number, delta: -1 | 1) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= links.length) return;

    const reordered = arrayMove(links, index, nextIndex).map((item, order) => ({
      ...item,
      order,
    }));
    setLinks(reordered);
    await persistReorder(reordered);
  };

  const persistReorder = async (reordered: EditableLink[]) => {
    const response = await fetch("/api/links/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: reordered.map((link) => link.id),
      }),
    });

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Gagal menyimpan urutan link",
        text: "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    const payload = (await response.json()) as { links: EditableLink[] };
    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((item) => item.id === String(active.id));
    const newIndex = links.findIndex((item) => item.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(links, oldIndex, newIndex).map((item, order) => ({
      ...item,
      order,
    }));
    setLinks(reordered);
    await persistReorder(reordered);
  };

  const previewLinks = useMemo(
    () => links.filter((item) => item.enabled !== false).slice(0, 8),
    [links]
  );
  const previewExperiences = useMemo(
    () =>
      experienceItems
        .filter(
          (item) =>
            item.title || item.organization || item.period || item.description || item.skills
        )
        .slice(0, 2),
    [experienceItems]
  );
  const isLinkLimitReached =
    typeof linkBuilderMax === "number" && links.length >= linkBuilderMax;
  const maxLinksLabel =
    typeof linkBuilderMax === "number" ? String(linkBuilderMax) : "Unlimited";
  const filteredLinks = useMemo(() => {
    const keyword = linkSearch.trim().toLowerCase();
    if (!keyword) return links;

    return links.filter((item) =>
      [item.title, item.url, item.platform || "", item.description || ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [links, linkSearch]);
  const publicPath = `/creator/${sanitizeUsername(profileFields.username || "creator")}`;
  const portfolioPath = `${publicPath}/portfolio`;
  const quickBlockOptions = [
    { key: "link", label: "Link", helper: "Tambahkan URL", icon: Link2 },
    { key: "portfolio", label: "Portfolio", helper: "Link ke portfolio video", icon: Video },
    { key: "text", label: "Text", helper: "Blok teks bebas", icon: Type },
    { key: "image", label: "Image", helper: "Embed gambar", icon: ImageIcon },
    { key: "youtube", label: "YouTube", helper: "Embed video", icon: PlayCircle },
    { key: "spotify", label: "Spotify", helper: "Embed musik", icon: Music2 },
    { key: "divider", label: "Divider", helper: "Garis pemisah", icon: Minus },
  ] as const;
  const filteredQuickBlockOptions = quickBlockOptions.filter((item) => {
    const keyword = blockSearch.trim().toLowerCase();
    if (!keyword) return true;
    return `${item.label} ${item.helper}`.toLowerCase().includes(keyword);
  });

  const openAddBlockModal = (platform?: string) => {
    if (platform) {
      setNewLink((prev) => ({
        ...prev,
        platform: platform === "Portfolio" ? "Portfolio Video" : platform,
        title:
          prev.title || (platform === "Portfolio" ? "Lihat Portfolio Video" : platform),
        url: prev.url || (platform === "Portfolio" ? portfolioPath : prev.url),
      }));
    }
    setIsAddBlockOpen(true);
  };

  const handleCopyPublicLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
    await showFeedbackAlert({
      title: "Link profile berhasil disalin",
      icon: "success",
      timer: 1100,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="dashboard-clean-card border-[#d6e2f7] bg-white/90 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f73ff]">
              showreels.id
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-[#201b18]">
                {profileFields.fullName || "Creator"}
              </h1>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                LIVE
              </span>
              <span className="inline-flex max-w-full items-center rounded-full border border-[#d4e3fb] bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#2f73ff]">
                {publicPath}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="dashboard-tap-target inline-flex h-8 items-center justify-center rounded-lg border border-[#d6e2f7] bg-white px-2.5 text-xs font-semibold text-[#32558a] hover:bg-[#f6faff]"
              >
                <Copy className="mr-1 h-3.5 w-3.5" />
                Copy
              </button>
              <Link
                href={publicPath}
                target="_blank"
                className="dashboard-tap-target inline-flex h-8 items-center justify-center rounded-lg border border-[#d6e2f7] bg-white px-2.5 text-xs font-semibold text-[#32558a] hover:bg-[#f6faff]"
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Open
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={publicPath} target="_blank">
              <Button size="sm" variant="secondary" className="h-9 px-3 text-xs font-semibold">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </Link>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 px-3 text-xs font-semibold"
              onClick={handleCopyPublicLink}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <div className="rounded-full border border-[#d8ccc4] bg-white px-3 py-2 text-xs font-semibold text-[#5d5049]">
              {saveStatus === "saving"
                ? "Menyimpan..."
                : saveStatus === "saved"
                  ? "Tersimpan"
                  : saveStatus === "error"
                    ? "Gagal menyimpan"
                    : "Saved"}
            </div>
          </div>
        </div>
      </Card>

      <div className="md:hidden">
        <div className="inline-flex rounded-full border border-[#d7cec7] bg-white p-1">
          <button
            type="button"
            className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
              mobileTab === "edit"
                ? "bg-[#2f73ff] text-white"
                : "text-[#5e514b] hover:bg-[#edf4ff]"
            }`}
            onClick={() => setMobileTab("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
              mobileTab === "preview"
                ? "bg-[#2f73ff] text-white"
                : "text-[#5e514b] hover:bg-[#edf4ff]"
            }`}
            onClick={() => setMobileTab("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className={`${mobileTab === "edit" ? "block" : "hidden"} space-y-4 md:block`}>
          <Card className="dashboard-clean-card border-[#d6e2f7] bg-white/90 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <PencilLine className="h-4 w-4 text-[#2f73ff]" />
              <h2 className="text-lg font-semibold text-[#201b18]">Bio & Experience</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Display Name</label>
                <Input
                  value={profileFields.fullName}
                  onChange={(event) =>
                    setProfileFields((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Role / Profession</label>
                <Input
                  value={profileFields.role}
                  onChange={(event) =>
                    setProfileFields((prev) => ({ ...prev, role: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Username / Slug</label>
              <Input
                value={profileFields.username}
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, username: event.target.value.toLowerCase() }))
                }
                placeholder="username-kamu"
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Bio</label>
              <Textarea
                maxLength={240}
                value={profileFields.bio}
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, bio: event.target.value }))
                }
                placeholder="Ceritakan profil singkat kamu."
              />
            </div>

            <div className="mt-3 rounded-2xl border border-[#d6e2f7] bg-[#f7fbff] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#3f5f93]">
                  Experience
                </label>
                <span className="text-xs font-medium text-[#5b7198]">
                  {serializedExperience.length}/700
                </span>
              </div>

              <div className="grid gap-2 rounded-xl border border-dashed border-[#c9dbf6] bg-white p-3">
                <Input
                  value={newExperience.title}
                  onChange={(event) =>
                    setNewExperience((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Judul role / pengalaman"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={newExperience.organization}
                    onChange={(event) =>
                      setNewExperience((prev) => ({
                        ...prev,
                        organization: event.target.value,
                      }))
                    }
                    placeholder="Project / perusahaan / klien"
                  />
                  <Input
                    value={newExperience.period}
                    onChange={(event) =>
                      setNewExperience((prev) => ({ ...prev, period: event.target.value }))
                    }
                    placeholder="Periode (contoh: 2024 - sekarang)"
                  />
                </div>
                <Textarea
                  value={newExperience.description}
                  onChange={(event) =>
                    setNewExperience((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Deskripsi singkat pengalaman"
                  className="min-h-20"
                />
                <Input
                  value={newExperience.skills}
                  onChange={(event) =>
                    setNewExperience((prev) => ({ ...prev, skills: event.target.value }))
                  }
                  placeholder="Skill/tag (contoh: Editing, Motion, Color Grading)"
                />
                <div>
                  <Button size="sm" type="button" onClick={handleAddExperience}>
                    <Plus className="h-4 w-4" />
                    Tambah Experience
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {experienceItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#c9dbf6] bg-white px-3 py-2 text-sm text-[#5b7198]">
                    Belum ada experience. Tambahkan minimal satu item agar profil lebih kuat.
                  </p>
                ) : (
                  experienceItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#dce7f8] bg-white p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1b2e4f]">
                          {item.title || "Experience"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteExperience(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={item.title}
                          onChange={(event) =>
                            updateExperienceItem(item.id, {
                              title: event.target.value.slice(0, 70),
                            })
                          }
                          placeholder="Judul role"
                        />
                        <Input
                          value={item.organization}
                          onChange={(event) =>
                            updateExperienceItem(item.id, {
                              organization: event.target.value.slice(0, 70),
                            })
                          }
                          placeholder="Project / perusahaan"
                        />
                        <Input
                          value={item.period}
                          onChange={(event) =>
                            updateExperienceItem(item.id, {
                              period: event.target.value.slice(0, 40),
                            })
                          }
                          placeholder="Periode"
                        />
                        <Input
                          value={item.skills}
                          onChange={(event) =>
                            updateExperienceItem(item.id, {
                              skills: event.target.value.slice(0, 120),
                            })
                          }
                          placeholder="Skill/tag"
                        />
                      </div>
                      <Textarea
                        value={item.description}
                        onChange={(event) =>
                          updateExperienceItem(item.id, {
                            description: event.target.value.slice(0, 220),
                          })
                        }
                        placeholder="Deskripsi pengalaman"
                        className="mt-2 min-h-20"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                value={profileFields.websiteUrl}
                onBlur={(event) =>
                  setProfileFields((prev) => ({
                    ...prev,
                    websiteUrl: normalizeSocialUrl(event.target.value),
                  }))
                }
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, websiteUrl: event.target.value }))
                }
                placeholder="Website"
              />
              <Input
                value={profileFields.instagramUrl}
                onBlur={(event) =>
                  setProfileFields((prev) => ({
                    ...prev,
                    instagramUrl: normalizeSocialUrl(event.target.value),
                  }))
                }
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, instagramUrl: event.target.value }))
                }
                placeholder="Instagram"
              />
              <Input
                value={profileFields.youtubeUrl}
                onBlur={(event) =>
                  setProfileFields((prev) => ({
                    ...prev,
                    youtubeUrl: normalizeSocialUrl(event.target.value),
                  }))
                }
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, youtubeUrl: event.target.value }))
                }
                placeholder="YouTube"
              />
              <Input
                value={profileFields.threadsUrl}
                onBlur={(event) =>
                  setProfileFields((prev) => ({
                    ...prev,
                    threadsUrl: normalizeSocialUrl(event.target.value),
                  }))
                }
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, threadsUrl: event.target.value }))
                }
                placeholder="Threads"
              />
              <Input
                value={profileFields.linkedinUrl}
                onBlur={(event) =>
                  setProfileFields((prev) => ({
                    ...prev,
                    linkedinUrl: normalizeSocialUrl(event.target.value),
                  }))
                }
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, linkedinUrl: event.target.value }))
                }
                placeholder="LinkedIn"
              />
            </div>
          </Card>

          <Card className="dashboard-clean-card border-[#d6e2f7] bg-white/90 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f73ff]">
                  Custom Link
                </p>
                <h2 className="text-lg font-semibold text-[#201b18]">
                  Tambah Block (maks {maxLinksLabel})
                </h2>
              </div>
              <Button
                size="sm"
                className="bg-[#2f73ff] hover:bg-[#225fe0]"
                onClick={() => openAddBlockModal()}
                disabled={isLinkLimitReached}
              >
                <Plus className="h-4 w-4" />
                Tambah Block
              </Button>
            </div>

            <p className="mb-4 rounded-2xl border border-dashed border-[#d6e2f7] bg-[#f7fbff] px-3 py-2 text-xs text-[#5b7198]">
              Tambahkan block dari popup agar tampilan editor lebih ringkas dan fokus.
            </p>

            <div className="mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5b7198]">
                  {links.length} Blocks
                </p>
                <span className="rounded-full border border-[#e0d4ce] bg-white px-2.5 py-1 text-xs font-semibold text-[#5b7198]">
                  {previewLinks.length} active - Plan {planName.toUpperCase()}
                </span>
              </div>
              <div className="mb-3">
                <Input
                  value={linkSearch}
                  onChange={(event) => setLinkSearch(event.target.value)}
                  placeholder="Cari block..."
                />
              </div>

              {links.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d6e2f7] bg-[#f7fbff] px-4 py-3 text-sm text-[#5b7198]">
                  Belum ada link. Tambahkan link pertama untuk mulai membangun halaman Showreels kamu.
                </p>
              ) : null}

              {links.length > 0 && filteredLinks.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d6e2f7] bg-[#f7fbff] px-4 py-3 text-sm text-[#5b7198]">
                  Tidak ada block yang cocok dengan kata kunci pencarian.
                </p>
              ) : null}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredLinks.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {filteredLinks.map((link) => {
                      const originalIndex = links.findIndex((item) => item.id === link.id);
                      if (originalIndex < 0) return null;

                      return (
                        <SortableLinkItem
                          key={link.id}
                          link={link}
                          index={originalIndex}
                          total={links.length}
                          onMove={handleLocalMove}
                          onDelete={handleDeleteLink}
                          onToggle={handleToggleLink}
                          onSave={handleSaveLink}
                          onChange={(id, patch) =>
                            setLinks((prev) =>
                              prev.map((item) =>
                                item.id === id ? { ...item, ...patch } : item
                              )
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </Card>
        </div>

        <div className={`${mobileTab === "preview" ? "block" : "hidden"} space-y-4 md:block`}>
          <Card className="dashboard-clean-card border-[#d6e2f7] bg-white/90 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#201b18]">Live Preview</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-[#d7cec7] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setDeviceMode("mobile")}
                    className={`dashboard-tap-target inline-flex items-center gap-1 rounded-full px-3 text-xs font-semibold transition ${
                      deviceMode === "mobile"
                        ? "bg-[#2f73ff] text-white"
                        : "text-[#5e514b] hover:bg-[#edf4ff]"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceMode("desktop")}
                    className={`dashboard-tap-target inline-flex items-center gap-1 rounded-full px-3 text-xs font-semibold transition ${
                      deviceMode === "desktop"
                        ? "bg-[#2f73ff] text-white"
                        : "text-[#5e514b] hover:bg-[#edf4ff]"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop
                  </button>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Live
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-[26px] border border-[#e2d7d1] bg-[radial-gradient(circle_at_1px_1px,#eadfd8_1px,transparent_0)] [background-size:16px_16px] p-4">
              <div
                className={`mx-auto transition-all ${
                  deviceMode === "desktop" ? "max-w-[380px]" : "max-w-[340px]"
                }`}
              >
                <div className="relative rounded-[42px] border-[10px] border-[#0c121d] bg-[#111827] p-3 shadow-[0_24px_48px_rgba(16,29,55,0.3)]">
                  <div className="absolute left-1/2 top-2 h-6 w-32 -translate-x-1/2 rounded-full bg-[#05080d]" />
                  <div className="rounded-[30px] bg-[#f8fbff] px-5 pb-6 pt-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#2f73ff] to-[#5b8dff] text-2xl font-semibold text-white shadow">
                      {(profileFields.fullName || "C").slice(0, 1).toUpperCase()}
                    </div>
                    <p className="mt-4 text-[32px] font-semibold leading-none text-[#1f2a44]">
                      {profileFields.fullName || "Display Name"}
                    </p>
                    <p className="mt-2 text-sm text-[#6a7da3]">
                      {profileFields.role || "Deskripsi singkat tentang Anda"}
                    </p>
                    <div className="mt-5 space-y-2 text-left">
                      {previewLinks.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-[#cfe0fa] bg-white px-3 py-2 text-xs text-[#5b7198]">
                          Belum ada link aktif.
                        </p>
                      ) : (
                        previewLinks.slice(0, 4).map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center gap-2 rounded-xl border border-[#dce7f8] bg-white px-3 py-2"
                          >
                            <span className="h-4 w-4 rounded-[5px] bg-[#5f6cff]" />
                            <p className="truncate text-sm font-medium text-[#1f2a44]">{link.title}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {previewExperiences.length > 0 ? (
                      <p className="mt-4 text-left text-xs text-[#6b7ca1]">
                        {previewExperiences[0]?.title}
                        {previewExperiences[0]?.organization
                          ? ` - ${previewExperiences[0].organization}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#e0d5ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#5e514b]">
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                {publicPath}
              </span>
              <Button size="sm" variant="secondary" onClick={handleCopyPublicLink}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Link href={publicPath} target="_blank">
                <Button size="sm" variant="secondary">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {isAddBlockOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0f2347]/55 p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close add block modal backdrop"
            onClick={() => setIsAddBlockOpen(false)}
          />
          <div className="relative z-[96] w-full max-w-[860px] rounded-[1.4rem] border border-[#c8d9f4] bg-white p-4 shadow-xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-2xl font-semibold text-[#1a2b48]">Add a block</h3>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfdcf2] text-[#44608d] hover:bg-[#eff5ff]"
                aria-label="Close add block modal"
                onClick={() => setIsAddBlockOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa2c8]" />
              <Input
                value={blockSearch}
                onChange={(event) => setBlockSearch(event.target.value)}
                placeholder="Search blocks..."
                className="h-12 pl-10 text-base"
              />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5b7198]">
                Quick Add
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
                {filteredQuickBlockOptions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => openAddBlockModal(item.label)}
                      className="rounded-xl border border-[#d8e5fa] bg-[#f7fbff] px-3 py-3 text-left transition hover:border-[#aac7f5] hover:bg-[#edf4ff]"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2f73ff]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-2 text-sm font-semibold text-[#1f2a44]">{item.label}</p>
                      <p className="text-xs text-[#6b7ca1]">{item.helper}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#d6e2f7] bg-[#f7fbff] p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f73ff]">
                Custom Link
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  value={newLink.title}
                  maxLength={MAX_LINK_TITLE_LENGTH}
                  onChange={(event) => setNewLink((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Judul tombol"
                />
                <Input
                  value={newLink.url}
                  onChange={(event) => setNewLink((prev) => ({ ...prev, url: event.target.value }))}
                  placeholder="https://..."
                />
                <Input
                  value={newLink.platform}
                  onChange={(event) =>
                    setNewLink((prev) => ({ ...prev, platform: event.target.value }))
                  }
                  placeholder="Platform"
                />
                <Input
                  value={newLink.badge}
                  onChange={(event) => setNewLink((prev) => ({ ...prev, badge: event.target.value }))}
                  placeholder="Badge (opsional)"
                />
                <div className="sm:col-span-2">
                  <Textarea
                    value={newLink.description}
                    maxLength={MAX_LINK_DESCRIPTION_LENGTH}
                    onChange={(event) =>
                      setNewLink((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="min-h-20"
                    placeholder="Deskripsi singkat (opsional)"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddBlockOpen(false)}
                  className="h-9 px-3 text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="h-9 bg-[#2f73ff] px-3 text-xs font-semibold hover:bg-[#225fe0]"
                  onClick={handleAddLink}
                  disabled={isLinkLimitReached}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Block
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-3 z-20 px-3 md:hidden">
        <Button className="w-full" onClick={saveProfileNow} disabled={isSavingNow}>
          {isSavingNow ? "Menyimpan..." : "Simpan Sekarang"}
        </Button>
      </div>
    </div>
  );
}

