"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

export default function PublicOrderFormPage() {
  const params = useParams();
  const token = params?.token as string;

  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod or razorpay
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getOrderForm(token)
      .then((data) => {
        setOrderData(data);
        if (data.customer_name) setName(data.customer_name);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired order link");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) {
      alert("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setSubmitting(true);
    try {
      await api.submitOrderForm(token, {
        customer_name: name,
        address,
        city,
        state,
        pincode,
        payment_method: paymentMethod,
      });
      setIsSuccess(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit delivery details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying order token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Link Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          <div className="pt-2">
            <a
              href="https://curatedindia.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800"
            >
              Visit CURATED India
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Order Confirmed!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Thank you, {name}! Your delivery details have been recorded.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left border border-slate-100 space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Item Reserved</span>
              <span className="font-semibold text-slate-900">{orderData.product_name}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Amount</span>
              <span className="font-bold text-slate-900 font-mono">₹{orderData.price}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Payment Mode</span>
              <span className="font-semibold text-indigo-600 uppercase">
                {paymentMethod === "cod" ? "Cash on Delivery" : "Online UPI (Test Mode)"}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200/60">
              <span>Delivery To</span>
              <span className="text-slate-800 text-right truncate max-w-[200px]">
                {address}, {city} - {pincode}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Express shipping via BlueDart / Delhivery. Estimated delivery: 3 to 5 business days.
          </p>

          <a
            href="https://curatedindia.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="block text-xs font-semibold bg-navy-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition"
          >
            Explore CURATED India Store
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-slate-50 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 md:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1 pb-4 border-b border-slate-100">
          <div className="text-xs tracking-widest font-semibold uppercase text-slate-400">
            CURATED INDIA
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Complete Delivery Details
          </h2>
          <p className="text-xs text-slate-500">
            Reserved via your conversation with <strong>BARTA ai</strong>.
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">{orderData.product_name}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Quantity: {orderData.quantity} · Free Express Shipping</div>
          </div>
          <div className="text-right">
            <div className="text-base font-extrabold text-slate-900 font-mono">₹{orderData.price}</div>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Festival Offer
            </span>
          </div>
        </div>

        {/* Delivery Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Delivery Address (Street / Flat / House No.)</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat 402, Green Glen Layout, Bellandur"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bengaluru"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Karnataka"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PIN Code (6 digits)</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="560103"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Payment Choice */}
          <div className="pt-2">
            <label className="block font-semibold text-slate-700 mb-2">Payment Option</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "cod"
                    ? "border-navy-900 bg-slate-50 ring-2 ring-navy-900/10"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="hidden"
                />
                <Banknote className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Cash on Delivery</div>
                  <div className="text-[10px] text-slate-400">Pay cash or UPI at delivery</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "razorpay"
                    ? "border-navy-900 bg-slate-50 ring-2 ring-navy-900/10"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  className="hidden"
                />
                <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Pay Online</div>
                  <div className="text-[10px] text-slate-400">UPI / Card (Test Mode)</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-navy-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-subtle flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>{submitting ? "Confirming Order..." : "Confirm & Ship My Order"}</span>
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>72-hour secure token · Encrypted end-to-end</span>
        </div>
      </div>
    </div>
  );
}

