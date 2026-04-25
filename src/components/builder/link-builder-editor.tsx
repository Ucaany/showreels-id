"use client";

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
  GripVertical,
  Link2,
  Monitor,
  PencilLine,
  Plus,
  Save,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import {
  MAX_CUSTOM_LINKS_FREE_PLAN,
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

type SaveStatus = "idle" | "saving" | "saved" | "error";
type MobileTab = "edit" | "preview";
type DeviceMode = "desktop" | "android";

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
      className={`rounded-2xl border border-[#ddd3cd] bg-white p-3 shadow-sm ${
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
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(index, 1)}
            aria-label="Move down"
            disabled={index >= total - 1}
          >
            ↓
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

export function LinkBuilderEditor({ user }: { user: LinkBuilderUser }) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSavingNow, setIsSavingNow] = useState(false);
  const [links, setLinks] = useState<EditableLink[]>(() =>
    normalizeCustomLinks(user.customLinks).map((link) => ({ ...link }))
  );
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    description: "",
    platform: "",
    badge: "",
  });
  const [profileFields, setProfileFields] = useState({
    fullName: user.name || "",
    username: user.username || "",
    role: user.role || "",
    bio: user.bio || "",
    experience: user.experience || "",
    websiteUrl: user.websiteUrl || "",
    instagramUrl: user.instagramUrl || "",
    youtubeUrl: user.youtubeUrl || "",
    facebookUrl: user.facebookUrl || "",
    threadsUrl: user.threadsUrl || "",
  });
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);

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

    setIsSavingNow(true);
    setSaveStatus("saving");

    const payload = {
      fullName: profileFields.fullName,
      username: normalizedUsername,
      role: profileFields.role,
      avatarUrl: user.image || "",
      coverImageUrl: user.coverImageUrl || "",
      bio: profileFields.bio,
      experience: profileFields.experience,
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
    profileFields.experience,
    profileFields.websiteUrl,
    profileFields.instagramUrl,
    profileFields.youtubeUrl,
    profileFields.facebookUrl,
    profileFields.threadsUrl,
  ]);

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

  return (
    <div className="space-y-4">
      <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
              Link Builder
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
              Atur bio, social, dan custom link
            </h1>
          </div>
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
      </Card>

      <div className="md:hidden">
        <div className="inline-flex rounded-full border border-[#d7cec7] bg-white p-1">
          <button
            type="button"
            className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
              mobileTab === "edit"
                ? "bg-[#1a1412] text-white"
                : "text-[#5e514b] hover:bg-[#f2ebe7]"
            }`}
            onClick={() => setMobileTab("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
              mobileTab === "preview"
                ? "bg-[#1a1412] text-white"
                : "text-[#5e514b] hover:bg-[#f2ebe7]"
            }`}
            onClick={() => setMobileTab("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className={`${mobileTab === "edit" ? "block" : "hidden"} space-y-4 md:block`}>
          <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <PencilLine className="h-4 w-4 text-[#e24f3b]" />
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
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#5f524b]">Experience highlight</label>
              <Textarea
                value={profileFields.experience}
                onChange={(event) =>
                  setProfileFields((prev) => ({ ...prev, experience: event.target.value }))
                }
                placeholder="Tulis pengalaman utama, skill, dan fokus layanan."
              />
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
            </div>
          </Card>

          <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e24f3b]">
                  Custom Link
                </p>
                <h2 className="text-lg font-semibold text-[#201b18]">
                  + Tambah Link (maks {MAX_CUSTOM_LINKS_FREE_PLAN})
                </h2>
              </div>
              <Button size="sm" onClick={handleAddLink} disabled={links.length >= MAX_CUSTOM_LINKS_FREE_PLAN}>
                <Plus className="h-4 w-4" />
                Tambah Link
              </Button>
            </div>

            <div className="grid gap-3 rounded-2xl border border-dashed border-[#d9cec7] bg-[#faf6f3] p-3">
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
                onChange={(event) => setNewLink((prev) => ({ ...prev, platform: event.target.value }))}
                placeholder="Platform"
              />
              <Textarea
                value={newLink.description}
                maxLength={MAX_LINK_DESCRIPTION_LENGTH}
                onChange={(event) => setNewLink((prev) => ({ ...prev, description: event.target.value }))}
                className="min-h-20"
                placeholder="Deskripsi singkat (opsional)"
              />
            </div>

            <div className="mt-4">
              {links.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d9cec7] bg-[#f7f3f0] px-4 py-3 text-sm text-[#6b5e56]">
                  Belum ada link. Tambahkan link pertama untuk mulai membangun halaman Showreels kamu.
                </p>
              ) : null}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={links.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {links.map((link, index) => (
                      <SortableLinkItem
                        key={link.id}
                        link={link}
                        index={index}
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
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </Card>
        </div>

        <div className={`${mobileTab === "preview" ? "block" : "hidden"} space-y-4 md:block`}>
          <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#201b18]">Live Preview</h2>
              <div className="inline-flex rounded-full border border-[#d7cec7] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setDeviceMode("desktop")}
                  className={`inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold transition ${
                    deviceMode === "desktop"
                      ? "bg-[#1a1412] text-white"
                      : "text-[#5e514b] hover:bg-[#f2ebe7]"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode("android")}
                  className={`inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold transition ${
                    deviceMode === "android"
                      ? "bg-[#1a1412] text-white"
                      : "text-[#5e514b] hover:bg-[#f2ebe7]"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Android
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div
                className={`mx-auto rounded-[30px] border border-[#d8cec8] bg-gradient-to-br from-[#ffffff] via-[#f6f2ef] to-[#f2eae5] p-4 shadow-sm ${
                  deviceMode === "android" ? "max-w-[390px]" : "max-w-full"
                }`}
              >
                <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
                  <p className="text-base font-semibold text-[#201b18]">
                    {profileFields.fullName || "Display Name"}
                  </p>
                  <p className="mt-1 text-sm text-[#6a5d56]">
                    {profileFields.role || "Role / Profession"}
                  </p>
                  <p className="mt-3 max-h-[4.5rem] overflow-hidden text-sm leading-6 text-[#4f433d]">
                    {profileFields.bio || "Bio akan muncul di sini saat kamu mengetik."}
                  </p>

                  <div className="mt-4 space-y-2">
                    {previewLinks.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[#d9cec7] bg-[#f8f4f1] px-3 py-2 text-xs text-[#6c6059]">
                        Belum ada link aktif.
                      </p>
                    ) : (
                      previewLinks.map((link) => (
                        <div
                          key={link.id}
                          className="rounded-xl border border-[#e2d8d1] bg-[#fffaf8] px-3 py-2"
                        >
                          <p className="text-sm font-semibold text-[#2b241f]">{link.title}</p>
                          {link.description ? (
                            <p className="mt-0.5 text-xs text-[#6b5e56]">{link.description}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link2 className="inline h-4 w-4 text-[#5e514b]" />{" "}
              <span className="text-xs text-[#5e514b]">{`/creator/${sanitizeUsername(
                profileFields.username || "creator"
              )}`}</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-3 z-20 px-3 md:hidden">
        <Button className="w-full" onClick={saveProfileNow} disabled={isSavingNow}>
          {isSavingNow ? "Menyimpan..." : "Simpan Sekarang"}
        </Button>
      </div>
    </div>
  );
}
