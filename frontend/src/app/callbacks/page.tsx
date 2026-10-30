"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarClock,
  Clock,
  User,
  Phone,
  AlertCircle,
  Calendar,
  X,
  CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";

export default function CallbacksPage() {
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [rescheduleModal, setRescheduleModal] = useState<string | null>(null); // callbackId
  const [newDateTime, setNewDateTime] = useState<string>("");

  const loadCallbacks = async () => {
    try {
      const data = await api.getCallbacks({
        status: statusFilter || undefined,
      });
      setCallbacks(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCallbacks();
  }, [statusFilter]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModal || !newDateTime) return;
    try {
      await api.rescheduleCallback(rescheduleModal, new Date(newDateTime).toISOString());
      setRescheduleModal(null);
      loadCallbacks();
    } catch (e: any) {
      alert("Error rescheduling callback: " + e.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled callback?")) return;
    try {
      await api.cancelCallback(id);
      loadCallbacks();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase">Pending</span>;
      case "in_progress":
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase">In Progress</span>;
      case "done":
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase">Completed</span>;
      case "cancelled":
        return <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Scheduled Callbacks
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Honoring promises automatically (“call me in 2 days”) inside the allowed calling window.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Callbacks</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Callbacks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {callbacks.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No scheduled callbacks found.</p>
          </div>
        ) : (
          callbacks.map((cb) => (
            <div
              key={cb.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">{cb.contact_name}</h3>
                  {getStatusBadge(cb.status)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3" /> {cb.contact_phone}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900 text-[11px] mb-1 uppercase tracking-wider text-slate-400">
                    Spoken Context / Reason
                  </div>
                  <p className="italic">“{cb.reason}”</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{cb.due_at_ist}</span>
                </div>

                {cb.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRescheduleModal(cb.id);
                        setNewDateTime("");
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(cb.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Reschedule Callback</h3>
              <button
                onClick={() => setRescheduleModal(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReschedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Date & Time (IST)</label>
                <input
                  type="datetime-local"
                  required
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

