"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Square,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState<string | null>(null); // campaignId
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState("Festive Kurta Sales Drive");
  const [goal, setGoal] = useState("Introduce CURATED Minimalist Linen Kurta with festive ₹400 discount and book orders.");
  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [windowStart, setWindowStart] = useState("09:00");
  const [windowEnd, setWindowEnd] = useState("20:00");
  const [retryLimit, setRetryLimit] = useState(2);

  const loadCampaigns = async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCampaign({
        name,
        goal,
        max_concurrent: Number(maxConcurrent),
        window_start: windowStart,
        window_end: windowEnd,
        retry_limit: Number(retryLimit),
        product_id: "curated-linen-kurta-01"
      });
      setShowCreateModal(false);
      loadCampaigns();
    } catch (err: any) {
      alert("Error creating campaign: " + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !showImportModal) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await api.importContactsCsv(showImportModal, file);
      setImportResult(res);
      loadCampaigns();
    } catch (err: any) {
      setImportResult({ status: "error", error: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      "name,phone,language,email,notes\n" +
      "Aarav Sharma,+919876543210,hinglish,aarav.sharma@example.com,Interested in olive kurta\n" +
      "Priya Patel,+919876543211,hindi,priya.patel@example.com,Requested morning window\n" +
      "Rohan Mehta,+919876543212,english,rohan.mehta@example.com,Repeat customer\n" +
      "Ananya Iyer,+919876543213,hinglish,ananya.iyer@example.com,Looking for size M\n" +
      "Vikram Singh,+919876543214,hindi,vikram.singh@example.com,Cash on delivery preference\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "barta_sample_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Campaigns & Contact Lists
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure concurrency (1 to 5 calls), set calling windows, and upload customer CSVs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-lg transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 text-xs font-semibold bg-navy-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition shadow-subtle"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaign List */}
      <div className="grid grid-cols-1 gap-5">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between gap-6"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-slate-900">{camp.name}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      camp.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : camp.status === "paused"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{camp.goal}</p>

                {/* Configuration Specs */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Calling Window: <strong className="text-slate-800">{camp.window_start} - {camp.window_end} IST</strong></span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Concurrency: <strong className="text-slate-800">{camp.max_concurrent} call{camp.max_concurrent > 1 ? "s" : ""} at once</strong></span>
                  </div>
                  <span>·</span>
                  <span>Retries: <strong className="text-slate-800">{camp.retry_limit}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setShowImportModal(camp.id);
                    setImportResult(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-lg transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Import CSV</span>
                </button>

                {camp.status === "active" ? (
                  <button
                    onClick={async () => {
                      await api.pauseCampaign(camp.id);
                      loadCampaigns();
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-3.5 py-2 rounded-lg transition"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await api.startCampaign(camp.id);
                      loadCampaigns();
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Calling</span>
                  </button>
                )}

                {camp.status !== "draft" && (
                  <button
                    onClick={async () => {
                      await api.stopCampaign(camp.id);
                      loadCampaigns();
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Stop Campaign"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Campaign Stats Mini Bar */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-slate-400 font-medium">Total Contacts</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">{camp.total_contacts || 0}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-slate-400 font-medium">Calls Placed</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">{camp.total_calls || 0}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-slate-400 font-medium">Orders Confirmed</span>
                <div className="text-base font-bold text-indigo-600 mt-0.5">{camp.orders_count || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sales Goal Prompt</label>
                <textarea
                  rows={2}
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Concurrent Calls</label>
                  <select
                    value={maxConcurrent}
                    onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
                  >
                    <option value={1}>1 call (Default test / trial)</option>
                    <option value={2}>2 calls</option>
                    <option value={3}>3 calls (Scale mode)</option>
                    <option value={5}>5 calls (Scale mode)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retry Limit</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={retryLimit}
                    onChange={(e) => setRetryLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Window Start (IST)</label>
                  <input
                    type="time"
                    value={windowStart}
                    onChange={(e) => setWindowStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Window End (IST)</label>
                  <input
                    type="time"
                    value={windowEnd}
                    onChange={(e) => setWindowEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Upload Contact List (CSV)
              </h3>
              <button
                onClick={() => setShowImportModal(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a CSV file containing contact records. Supported headers: <code>name</code>, <code>phone</code> (E.164), <code>language</code>, <code>email</code>, <code>notes</code>.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50/50"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800">
                {isImporting ? "Processing CSV..." : "Click to select CSV file"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">.csv files up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Validation Feedback */}
            {importResult && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                  importResult.status === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {importResult.status === "success" ? (
                  <>
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Imported {importResult.imported_count} valid contacts!
                    </div>
                    {importResult.rejected_count > 0 && (
                      <p className="text-[11px] text-amber-700">
                        {importResult.rejected_count} invalid rows rejected (invalid phone or missing name).
                      </p>
                    )}
                  </>
                ) : (
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    {importResult.error || "Failed to parse CSV"}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={handleDownloadSample}
                className="text-indigo-600 hover:underline font-medium"
              >
                Download Sample CSV
              </button>
              <button
                onClick={() => setShowImportModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
