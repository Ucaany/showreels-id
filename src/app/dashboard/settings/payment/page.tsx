"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type PaymentState = {
  billingEmail: string;
  paymentMethod: string;
  taxInfo: string;
  invoiceNotes: string;
};

export default function SettingsPaymentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<PaymentState>({
    billingEmail: "",
    paymentMethod: "midtrans",
    taxInfo: "",
    invoiceNotes: "",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const response = await fetch("/api/settings/payment");
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as PaymentState;
      if (cancelled) return;
      setState(payload);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const response = await fetch("/api/settings/payment", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menyimpan payment settings",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }
    await showFeedbackAlert({
      title: "Payment settings tersimpan",
      icon: "success",
      timer: 1100,
    });
  };

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <Link href="/dashboard/settings" className="inline-flex w-full sm:w-auto">
          <Button size="sm" variant="secondary" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Settings
          </Button>
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Payment
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
          Billing email & invoice preferences
        </h1>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-[#5f524b]">Memuat payment settings...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4f433d]">Billing Email</label>
              <input
                value={state.billingEmail}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, billingEmail: event.target.value }))
                }
                className="h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4f433d]">Payment Method</label>
              <Select
                value={state.paymentMethod}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, paymentMethod: event.target.value }))
                }
              >
                <option value="midtrans">Gateway Pembayaran</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="manual">Manual</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4f433d]">Tax Info</label>
              <input
                value={state.taxInfo}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, taxInfo: event.target.value }))
                }
                placeholder="NPWP / VAT / Tax Notes"
                className="h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4f433d]">Invoice Notes</label>
              <textarea
                value={state.invoiceNotes}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, invoiceNotes: event.target.value }))
                }
                rows={4}
                className="w-full rounded-xl border border-[#d7cec7] bg-white px-3 py-2 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? "Menyimpan..." : "Simpan Payment Settings"}
              </Button>
              <Link href="/dashboard/billing" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Buka Billing
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
