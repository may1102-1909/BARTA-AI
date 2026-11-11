// Shared in-memory simulation sessions
export interface SimSessionData {
  contact_name: string;
  preferred_language: string;
  transcript: Array<{
    speaker: string;
    text: string;
    thought?: string;
    intent?: string;
    timestamp: string;
  }>;
  call_id: string;
}

const globalForSim = globalThis as unknown as {
  simSessions: Map<string, SimSessionData> | undefined;
};

export const simSessions = globalForSim.simSessions ?? new Map<string, SimSessionData>();
if (process.env.NODE_ENV !== "production") globalForSim.simSessions = simSessions;

