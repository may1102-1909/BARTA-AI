const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorDetail = "API Request Failed";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Campaigns
  getCampaigns: () => fetchApi<any[]>("/campaigns"),
  getCampaign: (id: string) => fetchApi<any>(`/campaigns/${id}`),
  createCampaign: (data: any) =>
    fetchApi<any>("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  startCampaign: (id: string) =>
    fetchApi<any>(`/campaigns/${id}/start`, { method: "POST" }),
  pauseCampaign: (id: string) =>
    fetchApi<any>(`/campaigns/${id}/pause`, { method: "POST" }),
  stopCampaign: (id: string) =>
    fetchApi<any>(`/campaigns/${id}/stop`, { method: "POST" }),
  getCampaignStats: (id: string) => fetchApi<any>(`/campaigns/${id}/stats`),

  importContactsCsv: async (campaignId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}/contacts/import`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Import failed");
    }
    return res.json();
  },

  // Calls
  getCalls: (params?: { campaign_id?: string; outcome?: string; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.campaign_id) search.append("campaign_id", params.campaign_id);
    if (params?.outcome) search.append("outcome", params.outcome);
    if (params?.limit) search.append("limit", params.limit.toString());
    return fetchApi<any[]>(`/calls?${search.toString()}`);
  },
  getCallDetail: (id: string) => fetchApi<any>(`/calls/${id}`),

  // Orders
  getOrders: (params?: { status?: string; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.status) search.append("status", params.status);
    if (params?.limit) search.append("limit", params.limit.toString());
    if (params?.offset) search.append("offset", params.offset.toString());
    return fetchApi<any[]>(`/orders?${search.toString()}`);
  },
  getOrderDetail: (id: string) => fetchApi<any>(`/orders/${id}`),

  // Callbacks
  getCallbacks: (params?: { status?: string; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.status) search.append("status", params.status);
    if (params?.limit) search.append("limit", params.limit.toString());
    if (params?.offset) search.append("offset", params.offset.toString());
    return fetchApi<any[]>(`/callbacks?${search.toString()}`);
  },
  rescheduleCallback: (id: string, newDueAtIso: string) =>
    fetchApi<any>(`/callbacks/${id}/reschedule`, {
      method: "POST",
      body: JSON.stringify({ new_due_at_iso: newDueAtIso }),
    }),
  cancelCallback: (id: string) =>
    fetchApi<any>(`/callbacks/${id}/cancel`, { method: "POST" }),

  // Public Order Form
  getOrderForm: (token: string) => fetchApi<any>(`/order-form/${token}`),
  submitOrderForm: (token: string, data: any) =>
    fetchApi<any>(`/order-form/${token}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Simulator
  startSimulation: (data: any) =>
    fetchApi<any>("/simulator/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendSimTurn: (sessionId: string, transcript: string) =>
    fetchApi<any>("/simulator/turn", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, user_transcript: transcript }),
    }),

  // System
  getHealth: () => fetchApi<any>("/health"),
};
