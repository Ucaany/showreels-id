"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  ChevronRight,
  FileText,
  Heart,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlayCircle,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ADD_LINK_CATEGORIES,
  ADD_LINK_ITEMS,
  getItemsForCategory,
  type AddLinkCategoryId,
  type AddLinkItem,
} from "@/lib/add-link-catalog";
import { buildFinalLink, detectPlatformFromUrl, validateBuiltLink } from "@/lib/add-link-url";
import { cn } from "@/lib/cn";
import type { CustomLinkItem } from "@/lib/profile-utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (links: CustomLinkItem[]) => void;
  isLimitReached: boolean;
  maxLinksLabel: string;
  planName: "free" | "creator" | "business";
};

type FormState = {
  label: string;
  inputValue: string;
  url: string;
  description: string;
  badge: string;
  subject: string;
  body: string;
  message: string;
  status: "idle" | "saving" | "success" | "error";
  error: string;
};

const initialForm: FormState = {
  label: "",
  inputValue: "",
  url: "",
  description: "",
  badge: "",
  subject: "",
  body: "",
  message: "",
  status: "idle",
  error: "",
};

const categoryIcons = {
  suggested: Sparkles,
  social: Heart,
  media: PlayCircle,
  commerce: Store,
  event: CalendarDays,
  form: FileText,
  contact: MessageCircle,
  portfolio: Briefcase,
  utility: Type,
};

const itemIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  link: Link2,
  website: Link2,
  whatsapp: MessageCircle,
  email: Mail,
  phone: Phone,
  maps: MapPin,
  calendar: CalendarDays,
  form: FileText,
  briefcase: Briefcase,
  video: PlayCircle,
  store: ShoppingBag,
  text: Type,
};

function trackAddLinkEvent(event: string, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("showreels:add-link-analytics", { detail: { event, metadata } }));
}

function BrandIcon({ item, large = false }: { item: AddLinkItem; large?: boolean }) {
  const Icon = itemIconMap[item.iconKey] || itemIconMap[item.platform] || Link2;
  const isBrand = !itemIconMap[item.iconKey] && !itemIconMap[item.platform];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-sm",
        large ? "h-12 w-12 text-base" : "h-10 w-10 text-sm"
      )}
    >
      {isBrand ? <span className="font-black uppercase">{item.label.slice(0, 2)}</span> : <Icon className={large ? "h-5 w-5" : "h-4 w-4"} />}
    </span>
  );
}

function LimitReachedCard({ maxLinksLabel }: { maxLinksLabel: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
      <p className="text-sm font-semibold">Limit paket Free tercapai</p>
      <p className="mt-1 text-sm text-zinc-300">
        Kamu sudah menggunakan {maxLinksLabel} link aktif. Upgrade untuk menambahkan lebih banyak link.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button className="bg-white text-zinc-950 hover:bg-zinc-100" onClick={() => window.location.assign("/payment?plan=creator&intent=checkout")}>
          Upgrade ke Creator
        </Button>
        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
          Nanti
        </Button>
      </div>
    </div>
  );
}

export function AddLinkModal({ open, onClose, onCreated, isLimitReached, maxLinksLabel, planName }: Props) {
  const [activeCategory, setActiveCategory] = useState<AddLinkCategoryId>("suggested");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<AddLinkItem | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    trackAddLinkEvent("add_link_modal_opened");
    const timer = window.setTimeout(() => searchRef.current?.focus(), 120);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedItem) setSelectedItem(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, selectedItem]);

  const searchedItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const detected = detectPlatformFromUrl(search);
    if (detected?.platform) {
      return ADD_LINK_ITEMS.filter((item) => item.platform === detected.platform);
    }
    const base = getItemsForCategory(activeCategory);
    if (!keyword) return base;
    trackAddLinkEvent("add_link_search_used", { keyword });
    return ADD_LINK_ITEMS.filter((item) =>
      `${item.label} ${item.platform} ${item.category} ${item.description}`.toLowerCase().includes(keyword)
    );
  }, [activeCategory, search]);

  const featured = searchedItems.filter((item) => item.featured).slice(0, 6);

  if (!open) return null;

  const chooseItem = (item: AddLinkItem) => {
    trackAddLinkEvent("add_link_type_selected", { id: item.id, platform: item.platform });
    const detected = detectPlatformFromUrl(search);
    const detectedValue = detected?.platform === item.platform ? detected.username : "";
    setSelectedItem(item);
    setForm({
      ...initialForm,
      label: item.label,
      inputValue: detectedValue,
      url: item.formType === "custom" && search.startsWith("http") ? search : "",
    });
  };

  const updateForm = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch, error: "", status: "idle" }));

  const submit = async () => {
    if (!selectedItem) return;
    if (isLimitReached) {
      trackAddLinkEvent("plan_limit_reached");
      setForm((prev) => ({ ...prev, error: "Kamu sudah mencapai batas link aktif paket Free." }));
      return;
    }

    const built = buildFinalLink({
      linkType: selectedItem.formType,
      platform: selectedItem.platform,
      label: form.label,
      inputValue: form.inputValue,
      url: form.url,
      subject: form.subject,
      body: form.body,
      message: form.message,
    });
    const error = validateBuiltLink(built);
    if (error) {
      setForm((prev) => ({ ...prev, error }));
      return;
    }

    setForm((prev) => ({ ...prev, status: "saving" }));
    const response = await fetch("/api/creator-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: built.type,
        title: built.label,
        url: built.finalUrl,
        value: built.inputValue || built.finalUrl,
        inputValue: built.inputValue,
        finalUrl: built.finalUrl,
        description: form.description,
        platform: built.platform,
        badge: form.badge || selectedItem.badge || "",
        iconKey: built.iconKey,
        metadata: {
          show_icon: true,
          open_new_tab: true,
          source: "add_link_modal",
          subject: form.subject,
          body: form.body,
          message: form.message,
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as { links?: CustomLinkItem[]; error?: string; code?: string } | null;
    if (!response.ok || !payload?.links) {
      if (payload?.code === "LINK_LIMIT_REACHED") trackAddLinkEvent("plan_limit_reached");
      trackAddLinkEvent("add_link_failed", { platform: selectedItem.platform });
      setForm((prev) => ({ ...prev, status: "error", error: payload?.error || "Gagal menambahkan link." }));
      return;
    }

    trackAddLinkEvent(selectedItem.formType === "social" ? "social_username_submitted" : "custom_link_submitted", {
      platform: selectedItem.platform,
    });
    trackAddLinkEvent("add_link_success", { platform: selectedItem.platform });
    onCreated(payload.links);
    setForm((prev) => ({ ...prev, status: "success" }));
    window.setTimeout(() => {
      setSelectedItem(null);
      setForm(initialForm);
    }, 800);
  };

  const formType = selectedItem?.formType;
  const inputLabel = formType === "social" ? "Username / handle" : formType === "whatsapp" ? "Nomor WhatsApp" : formType === "email" ? "Email address" : formType === "phone" ? "Nomor telepon" : "URL tujuan";
  const inputPlaceholder = selectedItem?.placeholder || (formType === "social" ? "ucaanystore" : "https://...");

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-zinc-950/55 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="Close add link modal backdrop" onClick={onClose} />
      <div className="relative z-[96] flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-zinc-200 bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100vh-48px)] sm:max-w-[1080px] sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 sm:p-7">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-zinc-950">Add Link</h3>
            <p className="mt-1 text-sm text-zinc-500">Pilih jenis tombol yang ingin ditambahkan ke halaman Bio Link kamu.</p>
            {planName === "free" ? <p className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">Free Plan · limit {maxLinksLabel} link aktif</p> : null}
          </div>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200" aria-label="Close add link modal" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 p-4 backdrop-blur sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari platform, kategori, atau paste link..." className="h-14 rounded-2xl border-zinc-200 bg-zinc-50 pl-12 text-base" />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden border-r border-zinc-200 p-4 md:block">
            <div className="grid gap-1">
              {ADD_LINK_CATEGORIES.map((category) => {
                const Icon = categoryIcons[category.id];
                const active = activeCategory === category.id;
                return (
                  <button key={category.id} type="button" onClick={() => { setActiveCategory(category.id); trackAddLinkEvent("add_link_category_selected", { category: category.id }); }} className={cn("flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition", active ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950")}>
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-4 sm:p-5">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
              {ADD_LINK_CATEGORIES.map((category) => (
                <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold", activeCategory === category.id ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-600")}>{category.label}</button>
              ))}
            </div>

            {isLimitReached ? <LimitReachedCard maxLinksLabel={maxLinksLabel} /> : null}

            {selectedItem ? (
              <section className="mt-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <BrandIcon item={selectedItem} large />
                  <div>
                    <p className="text-lg font-black text-zinc-950">{selectedItem.label}</p>
                    <p className="text-sm text-zinc-500">{selectedItem.description}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-600">Display label</label>
                    <Input value={form.label} onChange={(event) => updateForm({ label: event.target.value })} placeholder="Judul tombol" />
                  </div>
                  {formType !== "utility" ? (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-600">{inputLabel}</label>
                      <Input value={formType === "custom" || formType === "media" || formType === "event" || formType === "form" || formType === "portfolio" ? form.url : form.inputValue} onChange={(event) => (formType === "custom" || formType === "media" || formType === "event" || formType === "form" || formType === "portfolio" ? updateForm({ url: event.target.value }) : updateForm({ inputValue: event.target.value }))} placeholder={inputPlaceholder} />
                    </div>
                  ) : null}
                  {formType === "whatsapp" ? <Input value={form.message} onChange={(event) => updateForm({ message: event.target.value })} placeholder="Pesan default opsional" /> : null}
                  {formType === "email" ? <Input value={form.subject} onChange={(event) => updateForm({ subject: event.target.value })} placeholder="Subject opsional" /> : null}
                  <div className="sm:col-span-2">
                    <Textarea value={form.description} onChange={(event) => updateForm({ description: event.target.value })} placeholder="Deskripsi singkat (opsional)" className="min-h-20" />
                  </div>
                </div>
                {form.error ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{form.error}</p> : null}
                {form.status === "success" ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Link berhasil ditambahkan.</p> : null}
                <div className="sticky bottom-0 mt-5 flex flex-col-reverse gap-2 bg-zinc-50 pt-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={() => setSelectedItem(null)}>Kembali</Button>
                  <Button onClick={submit} disabled={form.status === "saving"}>{form.status === "saving" ? "Menyimpan..." : "Simpan Link"}</Button>
                </div>
              </section>
            ) : (
              <>
                {featured.length > 0 ? (
                  <section className="mt-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Quick Add</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
                      {featured.map((item) => (
                        <button key={item.id} type="button" onClick={() => chooseItem(item)} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-sm">
                          <BrandIcon item={item} large />
                          <p className="mt-3 font-black text-zinc-950">{item.label}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{item.description}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="mt-6">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{search.trim() ? "Search Result" : ADD_LINK_CATEGORIES.find((cat) => cat.id === activeCategory)?.label}</p>
                  <div className="mt-3 grid gap-2">
                    {searchedItems.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                        <p className="font-black text-zinc-950">Tidak ada hasil ditemukan</p>
                        <p className="mt-1 text-sm text-zinc-500">Coba kata kunci lain atau buat Custom Link.</p>
                        <Button className="mt-4" onClick={() => chooseItem(ADD_LINK_ITEMS[0])}>Tambah Custom Link</Button>
                      </div>
                    ) : searchedItems.map((item) => (
                      <button key={item.id} type="button" onClick={() => chooseItem(item)} className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white p-3 text-left transition hover:bg-zinc-50">
                        <BrandIcon item={item} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-black text-zinc-950">{item.label}</span>
                          <span className="block truncate text-sm text-zinc-500">{item.description}</span>
                        </span>
                        {item.badge ? <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 sm:inline-flex">{item.badge}</span> : null}
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
