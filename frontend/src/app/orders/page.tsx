"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  Copy,
  Check
} from "lucide-react";
import { api } from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders({
        status: statusFilter || undefined,
      });
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase">Paid (Online)</span>;
      case "cod":
        return <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase">Cash on Delivery</span>;
      case "details_received":
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase">Details Received</span>;
      case "awaiting_details":
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase">Awaiting Details</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Orders Pipeline
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Voice-confirmed orders for CURATED India, address capture, and payment statuses.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Order Statuses</option>
            <option value="awaiting_details">Awaiting Details</option>
            <option value="details_received">Details Received</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="paid">Paid (Test Mode)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product & Qty</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Delivery Address</th>
                <th className="py-3 px-4">Form Link / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No orders recorded yet. Confirm an order via voice call or simulator to watch it populate here live!
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {ord.customer_name}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {ord.customer_email || ord.customer_phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {ord.product_name}
                      <span className="text-slate-400 font-normal block text-[11px]">Qty: {ord.quantity}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      ₹{ord.total_price}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-600">
                      {ord.delivery_address ? (
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{ord.delivery_address}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 italic text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Link dispatched by email
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={ord.form_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition"
                        >
                          <span>Open Form</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(ord.form_url, ord.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Copy form link"
                        >
                          {copiedId === ord.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
