import { ApiClient } from "@/api/ApiClient";
import { Cycle, CycleStatus, CycleType, sanitizeCycle } from "../models/cycle.model";

const ENDPOINT = "/cycles";

export interface GetCyclesOptions {
  user?: boolean;
  calendar?: string;
  grant?: string;
  type?: CycleType;
  status?: CycleStatus;
}

export const CycleApi = {
  // ---------------------------
  // Create
  // ---------------------------
  async createCycle(cycle: Partial<Cycle>): Promise<Cycle> {
    const sanitized = sanitizeCycle(cycle);
    const created = await ApiClient.post(ENDPOINT, sanitized);
    return created as Cycle;
  },

  // ---------------------------
  // Fetch / Query
  // ---------------------------
  async getCycles(options: GetCyclesOptions): Promise<Cycle[]> {
    const query = new URLSearchParams();
    if (options.user) query.append("user", "true");
    if (options.calendar) query.append("calendar", options.calendar);
    if (options.grant) query.append("grant", options.grant);
    if (options.type) query.append("type", options.type);
    if (options.status) query.append("status", options.status);
    const data = await ApiClient.get(`${ENDPOINT}?${query.toString()}`);
    return data as Cycle[];
  },

  // ---------------------------
  // Update
  // ---------------------------
  async updateCycle(cycle: Partial<Cycle>): Promise<Cycle> {
    if (!cycle._id) throw new Error("_id required.");
    const sanitized = sanitizeCycle(cycle);
    const updated = await ApiClient.put(`${ENDPOINT}/${cycle._id}`, sanitized);
    return updated as Cycle;
  },

  // ---------------------------
  // Delete
  // ---------------------------
  async deleteCycle(cycle: Partial<Cycle>): Promise<boolean> {
    if (!cycle._id) throw new Error("_id required.");
    const payload = { type: cycle.type };
    const response = await ApiClient.delete(`${ENDPOINT}/${cycle._id}`, payload);
    return response;
  }
};
