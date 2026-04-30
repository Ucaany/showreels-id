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
  ChevronDown,
  Copy,
  Download,
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
  Rocket,
  Save,
  Search,
  Share2,
  Sparkles,
  Smartphone,
  Trash2,
  Type,
  Video,
  X,
} from "lucide-react";
import { AddLinkModal } from "@/components/build-link/add-link-modal/AddLinkModal";
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
type BuilderSection = "edit" | "links" | "design" | "preview";
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
  linkBuilderDraft?: unknown;
  linkBuilderPublishedAt?: Date | string | null;
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
  onDuplicate,
  onToggle,
  onChange,
  onSave,
}: {
  link: EditableLink;
  index: number;
  total: number;
  onMove: (index: number, delta: -1 | 1) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
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
            className="h-9 w-9 p-0"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(index, 1)}
            aria-label="Move down"
            disabled={index >= total - 1}
            className="h-9 w-9 p-0"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onSave(link.id)} className="h-9 px-2">
            <Save className="h-3.5 w-3.5" />
            <span className="hidden min-[430px]:inline">Simpan</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDuplicate(link.id)}
            className="h-9 px-2"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden min-[430px]:inline">Duplicate</span>
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(link.id)} className="h-9 px-2">
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden min-[430px]:inline">Hapus</span>
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
  const [activeSection, setActiveSection] = useState<BuilderSection>("edit");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [blockSearch, setBlockSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSavingNow, setIsSavingNow] = useState(false);
  const [links, setLinks] = useState<EditableLink[]>(() =>
    normalizeCustomLinks(
      normalizeCustomLinks(user.linkBuilderDraft, MAX_CUSTOM_LINKS).length > 0
        ? user.linkBuilderDraft
        : user.customLinks,
      MAX_CUSTOM_LINKS
    ).map((link) => ({ ...link }))
  );
  const [newLink, setNewLink] = useState({
    type: "link",
    title: "",
    url: "",
    value: "",
    description: "",
    platform: "",
    badge: "",
    style: "card",
    iconKey: "link",
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
  const [bioSuggestions, setBioSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkAutoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const linksMountedRef = useRef(false);
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
      return false;
    }

    if (serializedExperience.length > 700) {
      setSaveStatus("error");
      await showFeedbackAlert({
        title: "Experience terlalu panjang",
        text: "Ringkas item experience agar total maksimal 700 karakter.",
        icon: "error",
      });
      return false;
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
      return false;
    }

    setSaveStatus("saved");
    window.setTimeout(() => setSaveStatus("idle"), 1600);
    return true;
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

  useEffect(() => {
    if (!linksMountedRef.current) {
      linksMountedRef.current = true;
      return;
    }

    if (!links.some((link) => link.isDirty)) {
      return;
    }

    if (linkAutoSaveTimerRef.current) {
      clearTimeout(linkAutoSaveTimerRef.current);
    }

    linkAutoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const response = await fetch("/api/link-page/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: links.map((link, order) => ({ ...link, order })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { links?: EditableLink[]; code?: string; error?: string }
        | null;

      if (!response.ok || !payload?.links) {
        setSaveStatus("error");
        if (payload?.code === "LINK_LIMIT_REACHED") {
          await showFreeLimitModal();
        }
        return;
      }

      setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 1600);
    }, 900);

    return () => {
      if (linkAutoSaveTimerRef.current) {
        clearTimeout(linkAutoSaveTimerRef.current);
      }
    };
  }, [links]);

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
    const urlRequired = !["divider", "text"].includes(newLink.type);

    if (isLinkLimitReached) {
      await showFreeLimitModal();
      return false;
    }

    if (!title || (urlRequired && !url)) {
      await showFeedbackAlert({
        title: "Data link belum lengkap",
        text: urlRequired
          ? "Isi judul dan URL valid terlebih dahulu."
          : "Isi judul block terlebih dahulu.",
        icon: "error",
      });
      return;
    }

    const response = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newLink.type,
        title,
        url,
        value: newLink.value || url,
        description: newLink.description,
        platform: newLink.platform,
        badge: newLink.badge,
        style: newLink.style,
        iconKey: newLink.iconKey,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;
      if (payload?.code === "LINK_LIMIT_REACHED") {
        await showFreeLimitModal();
        return;
      }
      await showFeedbackAlert({
        title: "Gagal menambahkan link",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    const payload = (await response.json()) as { links: EditableLink[] };
    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
    setNewLink({
      type: "link",
      title: "",
      url: "",
      value: "",
      description: "",
      platform: "",
      badge: "",
      style: "card",
      iconKey: "link",
    });
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

  const handleDuplicateLink = async (id: string) => {
    if (isLinkLimitReached) {
      await showFreeLimitModal();
      return;
    }

    const source = links.find((link) => link.id === id);
    if (!source) return;

    const nextLinks = [
      ...links,
      {
        ...source,
        id: crypto.randomUUID(),
        title: `${source.title} Copy`.slice(0, MAX_LINK_TITLE_LENGTH),
        order: links.length,
        isDirty: false,
      },
    ].map((link, order) => ({ ...link, order }));

    const response = await fetch("/api/link-page/draft", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: nextLinks }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { links?: EditableLink[]; code?: string; error?: string }
      | null;

    if (!response.ok || !payload?.links) {
      if (payload?.code === "LINK_LIMIT_REACHED") {
        await showFreeLimitModal();
        return;
      }
      await showFeedbackAlert({
        title: "Gagal duplicate block",
        text: payload?.error || "Coba ulang beberapa saat.",
        icon: "error",
      });
      return;
    }

    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
  };

  const handleToggleLink = async (id: string, enabled: boolean) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, enabled } : link)));

    const response = await fetch(`/api/links/${id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { code?: string; error?: string }
        | null;
      if (payload?.code === "LINK_LIMIT_REACHED") {
        await showFreeLimitModal();
        return;
      }
      await showFeedbackAlert({
        title: "Gagal mengubah status link",
        text: payload?.error || "Coba ulang beberapa saat.",
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
        type: current.type || "link",
        title: current.title,
        url: normalizeSocialUrl(current.url),
        value: current.value || current.url,
        description: current.description || "",
        platform: current.platform || "",
        badge: current.badge || "",
        thumbnailUrl: current.thumbnailUrl || "",
        style: current.style || "card",
        iconKey: current.iconKey || current.platform?.toLowerCase().replace(/\s+/g, "") || "link",
        iconUrl: current.iconUrl || "",
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
    typeof linkBuilderMax === "number" &&
    links.filter((item) => item.enabled !== false).length >= linkBuilderMax;
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
  const absolutePublicUrl =
    typeof window === "undefined" ? publicPath : `${window.location.origin}${publicPath}`;
  const portfolioPath = `${publicPath}/portfolio`;
  const quickBlockOptions = [
    { key: "link", type: "link", category: "Basic", label: "Link", helper: "Tambahkan URL", icon: Link2 },
    { key: "portfolio", type: "portfolio", category: "Portfolio", label: "Portfolio", helper: "Link ke portfolio video", icon: Video },
    { key: "text", type: "text", category: "Basic", label: "Text", helper: "Blok teks bebas sebagai link catatan", icon: Type },
    { key: "image", type: "image", category: "Media", label: "Image", helper: "Embed gambar via URL", icon: ImageIcon },
    { key: "youtube", type: "youtube", category: "Media", label: "YouTube", helper: "Embed video via URL", icon: PlayCircle },
    { key: "spotify", type: "spotify", category: "Social", label: "Spotify", helper: "Embed musik via URL", icon: Music2 },
    { key: "divider", type: "divider", category: "Basic", label: "Divider", helper: "Garis pemisah berbentuk block", icon: Minus },
    { key: "shopee", type: "commerce", category: "Commerce", label: "Shopee", helper: "Link toko atau produk", icon: Link2 },
    { key: "tokopedia", type: "commerce", category: "Commerce", label: "Tokopedia", helper: "Link toko atau produk", icon: Link2 },
    { key: "tiktokshop", type: "commerce", category: "Commerce", label: "TikTok Shop", helper: "Link produk TikTok Shop", icon: Link2 },
    { key: "whatsapp", type: "commerce", category: "Commerce", label: "WhatsApp Chat", helper: "Chat order cepat", icon: Link2 },
  ] as const;
  const filteredQuickBlockOptions = quickBlockOptions.filter((item) => {
    const keyword = blockSearch.trim().toLowerCase();
    if (!keyword) return true;
    return `${item.label} ${item.helper}`.toLowerCase().includes(keyword);
  });

  async function showFreeLimitModal() {
    const confirmed = await confirmFeedbackAction({
      title: "Batas 5 link tercapai",
      text: "Upgrade ke Creator untuk menambahkan lebih banyak link dan fitur desain.",
      confirmButtonText: "Upgrade ke Creator",
      cancelButtonText: "Nanti dulu",
    });
    if (confirmed) {
      window.location.assign("/payment?plan=creator&intent=checkout");
    }
  }

  const openAddBlockModal = (option?: (typeof quickBlockOptions)[number]) => {
    if (option) {
      setNewLink((prev) => ({
        ...prev,
        type: option.type,
        platform: option.label === "Portfolio" ? "Portfolio Video" : option.label,
        iconKey: option.key,
        title:
          prev.title || (option.label === "Portfolio" ? "Lihat Portfolio Video" : option.label),
        url: prev.url || (option.label === "Portfolio" ? portfolioPath : prev.url),
        value: prev.value || (option.label === "Portfolio" ? portfolioPath : prev.value),
      }));
    }
    setIsAddBlockOpen(true);
  };

  const handleCopyPublicLink = async () => {
    await navigator.clipboard.writeText(absolutePublicUrl);
    await showFeedbackAlert({
      title: "Link profile berhasil disalin",
      icon: "success",
      timer: 1100,
    });
  };

  const handlePublish = async () => {
    const profileSaved = await saveProfileNow();
    if (profileSaved === false) return;
    setIsSavingNow(true);
    const response = await fetch("/api/link-page/publish", { method: "POST" });
    const payload = (await response.json().catch(() => null)) as
      | { links?: EditableLink[]; error?: string; code?: string; message?: string }
      | null;
    setIsSavingNow(false);

    if (!response.ok || !payload?.links) {
      if (payload?.code === "LINK_LIMIT_REACHED") {
        await showFreeLimitModal();
        return;
      }
      await showFeedbackAlert({
        title: "Publish gagal",
        text: payload?.error || payload?.message || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    setLinks(payload.links.map((link) => ({ ...link, isDirty: false })));
    await showFeedbackAlert({
      title: "Build Link dipublish",
      text: "Draft kamu sekarang tampil di halaman publik.",
      icon: "success",
      timer: 1400,
    });
  };

  const handleGenerateBio = async () => {
    if (!profileFields.role.trim() && experienceItems.length === 0) {
      await showFeedbackAlert({
        title: "Lengkapi role atau experience",
        text: "Isi role/profesi atau experience dulu agar Gemini bisa membuat bio yang relevan.",
        icon: "info",
      });
      return;
    }

    const socialLinks = [
      profileFields.websiteUrl,
      profileFields.instagramUrl,
      profileFields.youtubeUrl,
      profileFields.facebookUrl,
      profileFields.threadsUrl,
      profileFields.linkedinUrl,
    ].filter(Boolean);

    setAiLoading(true);
    const response = await fetch("/api/ai/generate-bio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: profileFields.fullName,
        displayName: profileFields.fullName,
        role: profileFields.role,
        experience: experienceItems.map((item) =>
          [item.title, item.organization, item.description].filter(Boolean).join(" - ")
        ),
        existingBio: profileFields.bio,
        tone: "professional",
        maxLength: 700,
        socialLinks,
        skills: user.skills || [],
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { bio?: string; suggestions?: string[]; error?: string; provider?: "gemini" | "fallback" }
      | null;
    setAiLoading(false);

    if (!response.ok || (!payload?.bio && !payload?.suggestions?.length)) {
      await showFeedbackAlert({
        title: "Gagal membuat bio",
        text: payload?.error || "Coba ulang beberapa saat.",
        icon: "error",
      });
      return;
    }

    setBioSuggestions(payload.suggestions?.length ? payload.suggestions : payload.bio ? [payload.bio] : []);
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <Card className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-7 lg:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              <Link2 className="h-3.5 w-3.5" />
              Build Link
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                {profileFields.fullName || "Creator"}
              </h1>
              <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white">
                LIVE
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Atur profil, social link, custom link, dan preview bio link dalam layout Bento yang compact.
            </p>
            <span className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {publicPath}
            </span>
            {saveStatus === "saving" || saveStatus === "error" ? (
              <p className="text-xs font-semibold text-[#5d5049]">
                {saveStatus === "saving" ? "Menyimpan..." : "Gagal menyimpan"}
              </p>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
            <p className="mt-2 text-sm text-slate-600">Pilih panel editor. Preview tetap tersedia dari tab Preview dan mobile bottom nav.</p>
            <div className="mt-5 grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              className={`flex h-11 items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition ${
                activeSection === "edit"
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setActiveSection("edit")}
            >
              <PencilLine className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              type="button"
              className={`flex h-11 items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition ${
                activeSection === "links"
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setActiveSection("links")}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tambah Link</span>
            </button>
            <button
              type="button"
              className={`flex h-11 items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition ${
                activeSection === "design"
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setActiveSection("design")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Design</span>
            </button>
            <button
              type="button"
              className={`flex h-11 items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition ${
                activeSection === "preview"
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setActiveSection("preview")}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            </div>
          </div>
        </div>
      </Card>

      {activeSection === "edit" ? (
        <div className="space-y-4">
          <Card className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <PencilLine className="h-4 w-4 text-slate-900" />
                <h2 className="text-lg font-semibold text-slate-950">Bio & Experience</h2>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleGenerateBio}
                disabled={aiLoading}
                className="w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                <span className="truncate">{aiLoading ? "Generating..." : "Generate Bio with Gemini"}</span>
              </Button>
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
                maxLength={700}
                value={profileFields.bio}
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, bio: event.target.value }))
                }
                placeholder="Ceritakan profil singkat kamu. Maksimal 700 karakter."
              />
              <p className="mt-1 text-right text-xs font-medium text-slate-500">
                {profileFields.bio.length}/700
              </p>
            </div>
            {bioSuggestions.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {bioSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      setProfileFields((prev) => ({
                        ...prev,
                        bio: suggestion.slice(0, 700),
                      }))
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <details
              className="mt-3 rounded-2xl border border-[#d6e2f7] bg-[#f7fbff] p-3"
              open={experienceItems.length === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3f5f93]">
                  Experience ({experienceItems.length})
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-[#5b7198]">
                  {serializedExperience.length}/700
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </summary>

              <div className="mt-3 grid gap-2 rounded-xl border border-dashed border-[#c9dbf6] bg-white p-3">
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
            </details>

            <details className="mt-4 rounded-2xl border border-[#d6e2f7] bg-[#f7fbff] p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3f5f93]">
                  Social Links
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#5b7198]" />
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            </details>
          </Card>
        </div>
      ) : null}

      {activeSection === "links" ? (
        <div className="space-y-4">
          <Card className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f73ff]">
                  Custom Link
                </p>
                <h2 className="text-lg font-semibold text-[#201b18]">
                  Tambah Link (maks {maxLinksLabel})
                </h2>
              </div>
              <Button
                size="sm"
                className="bg-zinc-950 text-white hover:bg-black"
                onClick={() => (isLinkLimitReached ? void showFreeLimitModal() : openAddBlockModal())}
              >
                <Plus className="h-4 w-4" />
                Tambah Link
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
                          onDuplicate={handleDuplicateLink}
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
      ) : null}

      {activeSection === "design" ? (
        <Card className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2f73ff]" />
            <h2 className="text-lg font-semibold text-[#201b18]">Design</h2>
          </div>
          <div className="rounded-2xl border border-dashed border-[#d6e2f7] bg-[#f7fbff] p-4">
            <p className="text-sm font-semibold text-[#244064]">Theme selector akan ditingkatkan.</p>
            <p className="mt-1 text-sm text-[#5b7198]">
              Untuk saat ini, style publik mengikuti tema clean default showreels. Kontrol design lanjutan segera hadir.
            </p>
          </div>
        </Card>
      ) : null}

      {activeSection === "preview" ? (
        <div className="space-y-4">
          <Card className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#201b18]">Live Preview</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-[#d7cec7] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setDeviceMode("mobile")}
                    className={`dashboard-tap-target inline-flex items-center gap-1 rounded-full px-3 text-xs font-semibold transition ${
                      deviceMode === "mobile"
                        ? "bg-zinc-950 text-white"
                        : "text-slate-700 hover:bg-slate-100"
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
                        ? "bg-zinc-950 text-white"
                        : "text-slate-700 hover:bg-slate-100"
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
                <div className="relative rounded-[36px] border-[7px] border-[#0c121d] bg-[#111827] p-2 shadow-[0_24px_48px_rgba(16,29,55,0.3)]">
                  <div className="absolute left-1/2 top-1.5 h-4 w-24 -translate-x-1/2 rounded-full bg-[#05080d]" />
                  <div className="h-[620px] overflow-y-auto rounded-[28px] bg-[#f8fbff] px-5 pb-6 pt-12 text-center">
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
                        previewLinks.map((link) =>
                          link.type === "divider" ? (
                            <div
                              key={link.id}
                              className={`my-3 border-[#cfe0fa] ${
                                link.style === "dashed"
                                  ? "border-t border-dashed"
                                  : link.style === "solid"
                                    ? "border-t-2"
                                    : "border-t"
                              }`}
                            />
                          ) : (
                            <div
                              key={link.id}
                              className="flex items-center gap-2 rounded-xl border border-[#dce7f8] bg-white px-3 py-2"
                            >
                              <span className="h-4 w-4 rounded-[5px] bg-[#5f6cff]" />
                              <p className="truncate text-sm font-medium text-[#1f2a44]">{link.title}</p>
                            </div>
                          )
                        )
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
            </div>
          </Card>
        </div>
      ) : null}

      {false ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-[#0f2347]/55 p-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close add block modal backdrop"
            onClick={() => setIsAddBlockOpen(false)}
          />
          <div className="relative z-[96] max-h-[92vh] w-full max-w-[860px] overflow-hidden rounded-t-[1.4rem] border border-[#c8d9f4] bg-white shadow-xl sm:rounded-[1.4rem]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#d6e2f7] bg-white p-4 sm:p-5">
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

            <div className="max-h-[calc(92vh-76px)] overflow-y-auto p-4 sm:p-5">
            <div className="relative">
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
                      onClick={() => openAddBlockModal(item)}
                      className="rounded-xl border border-[#d8e5fa] bg-[#f7fbff] px-3 py-3 text-left transition hover:border-[#aac7f5] hover:bg-[#edf4ff]"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2f73ff]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="mt-2 inline-flex rounded-full border border-[#d6e4fb] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6078a2]">
                        {item.category}
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
                <select
                  value={newLink.iconKey}
                  onChange={(event) =>
                    setNewLink((prev) => ({ ...prev, iconKey: event.target.value }))
                  }
                  className="h-11 rounded-xl border border-[#d6e2f7] bg-white px-3 text-sm text-[#1f2a44]"
                >
                  {[
                    "link",
                    "website",
                    "instagram",
                    "tiktok",
                    "youtube",
                    "facebook",
                    "threads",
                    "x",
                    "linkedin",
                    "whatsapp",
                    "telegram",
                    "discord",
                    "spotify",
                    "github",
                    "gdrive",
                    "maps",
                    "shopee",
                    "tokopedia",
                    "tiktokshop",
                    "email",
                    "phone",
                    "portfolio",
                    "video",
                    "divider",
                    "image",
                    "text",
                  ].map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
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

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddBlockOpen(false)}
                  className="h-10 w-full px-3 text-xs font-semibold sm:h-9 sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="h-10 w-full bg-[#2f73ff] px-3 text-xs font-semibold hover:bg-[#225fe0] sm:h-9 sm:w-auto"
                  onClick={handleAddLink}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Block
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      ) : null}

      <AddLinkModal
        open={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        onCreated={(nextLinks) => {
          setLinks(nextLinks.map((link) => ({ ...link, isDirty: false })));
          setIsAddBlockOpen(false);
          setSaveStatus("saved");
          window.setTimeout(() => setSaveStatus("idle"), 1400);
        }}
        isLimitReached={isLinkLimitReached}
        maxLinksLabel={maxLinksLabel}
        planName={planName}
      />
 
      {isShareOpen ? (
        <div className="fixed inset-0 z-[98] flex items-end justify-center bg-[#0f2347]/55 p-2 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close share modal backdrop"
            onClick={() => setIsShareOpen(false)}
          />
          <div className="relative z-[99] max-h-[88vh] w-full max-w-[560px] overflow-hidden rounded-t-[1.4rem] border border-[#c8d9f4] bg-white shadow-xl sm:rounded-[1.4rem]">
            <div className="flex items-start justify-between gap-3 border-b border-[#d6e2f7] bg-white p-4">
              <div>
                <h3 className="text-xl font-semibold text-[#142033]">Share Build Link</h3>
                <p className="text-xs text-[#6078a2]">Copy, social share, dan QR disatukan di sini.</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfdcf2] text-[#44608d] hover:bg-[#eff5ff]"
                onClick={() => setIsShareOpen(false)}
                aria-label="Close share modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(88vh-76px)] overflow-y-auto p-4">
              <div className="rounded-2xl border border-[#d6e2f7] bg-[#f7fbff] p-3">
                <p className="truncate text-sm font-semibold text-[#142033]">{absolutePublicUrl}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Button type="button" size="sm" onClick={handleCopyPublicLink}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Link href={publicPath} target="_blank">
                    <Button type="button" size="sm" variant="secondary" className="w-full">
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      if (navigator.share) {
                        await navigator.share({
                          title: profileFields.fullName || "Showreels",
                          url: absolutePublicUrl,
                        });
                      } else {
                        await handleCopyPublicLink();
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Native
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
                <div className="rounded-2xl border border-[#d6e2f7] bg-white p-3 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
                      absolutePublicUrl
                    )}`}
                    alt="QR code"
                    className="mx-auto h-36 w-36 rounded-xl"
                  />
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(
                      absolutePublicUrl
                    )}`}
                    download="showreels-qr.png"
                    className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-[#d6e2f7] bg-[#f7fbff] px-3 text-xs font-semibold text-[#2f73ff]"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Download QR
                  </a>
                </div>
                <div className="grid gap-2">
                  {[
                    ["WhatsApp", `https://wa.me/?text=${encodeURIComponent(absolutePublicUrl)}`],
                    ["Telegram", `https://t.me/share/url?url=${encodeURIComponent(absolutePublicUrl)}`],
                    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absolutePublicUrl)}`],
                    ["X/Twitter", `https://twitter.com/intent/tweet?url=${encodeURIComponent(absolutePublicUrl)}`],
                    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absolutePublicUrl)}`],
                  ].map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d6e2f7] bg-white px-3 text-sm font-semibold text-[#244064] hover:border-[#2f73ff] hover:bg-[#f7fbff]"
                    >
                      <Share2 className="h-4 w-4 text-[#2f73ff]" />
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-3 z-20 px-3 md:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-2 rounded-[1.25rem] border border-[#cfe0ff] bg-white/95 p-2 shadow-[0_18px_42px_rgba(24,58,115,0.22)] backdrop-blur">
          <Link
            href={publicPath}
            target="_blank"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#edf4ff] text-[#2f73ff]"
            aria-label="Preview"
          >
            <Eye className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2f73ff] text-white disabled:opacity-50"
            aria-label="Publish"
            onClick={handlePublish}
            disabled={isSavingNow}
          >
            <Rocket className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#edf4ff] text-[#2f73ff]"
            aria-label="Share"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

