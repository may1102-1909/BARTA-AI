"use client";

import React, { useRef, useState } from "react";
import { Plus, Play, Pause, Square, Upload, Download, CheckCircle2, AlertCircle, Megaphone } from "lucide-react";
import { api } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import type { Campaign, CampaignCreateInput, ImportResult } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Status";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";

const CSV_HEADERS = "name,phone,language,email,notes";

const DEFAULT_FORM: CampaignCreateInput = {
  name: "",
  goal: "",
  max_concurrent: 1,
  window_start: "09:00",
  window_end: "20:00",
  retry_limit: 2,
};

function downloadCsvTemplate() {
  const blob = new Blob([`${CSV_HEADERS}\n`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "contacts_template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function CampaignsPage() {
  const { data, loading, error, refresh } = usePolling(() => api.getCampaigns(), [], { intervalMs: 8000 });
  const campaigns = data ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CampaignCreateInput>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [importTarget, setImportTarget] = useState<Campaign | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof CampaignCreateInput>(key: K, value: CampaignCreateInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.createCampaign(form);
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importTarget) return;
    setImporting(true);
    setImportResult(null);
    try {
      setImportResult(await api.importContactsCsv(importTarget.id, file));
      refresh();
    } catch (err) {
      setImportResult({ status: "error", error: err instanceof Error ? err.message : "Import failed" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    await fn();
    refresh();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Campaigns"
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={downloadCsvTemplate}>
              CSV template
            </Button>
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowCreate(true)}>
              New campaign
            </Button>
          </>
        }
      />

      <ErrorBanner message={error} />

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Card key={i} className="space-y-4 p-6">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-xl" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No campaigns yet"
          action={
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowCreate(true)}>
              New campaign
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => (
            <Card key={camp.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-navy-900">{camp.name}</h3>
                    <StatusChip status={camp.status} />
                  </div>
                  <p className="text-xs text-slate-500">{camp.goal}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] font-medium text-slate-500">
                    <span>
                      Window <strong className="text-navy-900">{camp.window_start}–{camp.window_end} IST</strong>
                    </span>
                    <span>
                      Concurrency <strong className="text-navy-900">{camp.max_concurrent}</strong>
                    </span>
                    <span>
                      Retries <strong className="text-navy-900">{camp.retry_limit}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Upload className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setImportTarget(camp);
                      setImportResult(null);
                    }}
                  >
                    Import CSV
                  </Button>
                  {camp.status === "active" ? (
                    <Button variant="secondary" size="sm" icon={<Pause className="h-3.5 w-3.5" />} onClick={() => act(() => api.pauseCampaign(camp.id))}>
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" icon={<Play className="h-3.5 w-3.5 fill-current" />} onClick={() => act(() => api.startCampaign(camp.id))}>
                      Start
                    </Button>
                  )}
                  {camp.status !== "draft" && (
                    <Button variant="ghost" size="sm" title="Stop campaign" aria-label="Stop campaign" onClick={() => act(() => api.stopCampaign(camp.id))}>
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200/80 pt-4">
                {[
                  ["Contacts", camp.total_contacts ?? 0],
                  ["Calls", camp.total_calls ?? 0],
                  ["Orders", camp.orders_count ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200/80 bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                    <div className="mt-0.5 text-lg font-bold tabular-nums text-navy-900">{value}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New campaign">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Name">
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Campaign name" />
          </Field>
          <Field label="Goal">
            <Textarea
              rows={3}
              required
              value={form.goal}
              onChange={(e) => update("goal", e.target.value)}
              placeholder="What should the agent achieve on each call?"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Concurrent calls">
              <Select value={form.max_concurrent} onChange={(e) => update("max_concurrent", Number(e.target.value))}>
                {[1, 2, 3, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Retry limit">
              <Input type="number" min={0} max={5} value={form.retry_limit} onChange={(e) => update("retry_limit", Number(e.target.value))} />
            </Field>
            <Field label="Window start (IST)">
              <Input type="time" value={form.window_start} onChange={(e) => update("window_start", e.target.value)} />
            </Field>
            <Field label="Window end (IST)">
              <Input type="time" value={form.window_end} onChange={(e) => update("window_end", e.target.value)} />
            </Field>
          </div>
          <ErrorBanner message={formError} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!importTarget} onClose={() => setImportTarget(null)} title={`Import contacts · ${importTarget?.name ?? ""}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Headers: <code className="font-mono text-navy-900">{CSV_HEADERS}</code>. Phone in E.164.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-navy-900 disabled:opacity-60"
          >
            <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
            <div className="text-xs font-semibold text-navy-900">{importing ? "Uploading…" : "Choose CSV file"}</div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </button>

          {importResult && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
                importResult.status === "success" ? "border-slate-200/80 bg-white text-navy-900" : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {importResult.status === "success" ? (
                <>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-semibold">{importResult.imported_count ?? 0} contacts imported</div>
                    {!!importResult.rejected_count && (
                      <div className="text-slate-500">{importResult.rejected_count} rows rejected</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="font-semibold">{importResult.error || "Import failed"}</span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={downloadCsvTemplate} className="text-xs font-semibold text-slate-500 hover:text-navy-900">
              Download template
            </button>
            <Button variant="secondary" onClick={() => setImportTarget(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
