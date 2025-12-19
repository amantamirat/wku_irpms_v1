import { ApiClient } from "@/api/ApiClient";
import { Call, GetCallsOptions, sanitizeCall } from "../models/call.model";

const ENDPOINT = "/calls";

export const CallApi = {
  // ---------------------------
  // Create
  // ---------------------------
  async create(cycle: Partial<Call>): Promise<Call> {
    const sanitized = sanitizeCall(cycle);
    const created = await ApiClient.post(ENDPOINT, sanitized);
    return created as Call;
  },

  // ---------------------------
  // Fetch / Query
  // ---------------------------
  async getCalls(options: GetCallsOptions): Promise<Call[]> {
    const query = new URLSearchParams();
    const sanitized = sanitizeCall(options);
    if (options.calendar) query.append("calendar", sanitized.calendar as string);
    if (options.directorate) query.append("directorate", sanitized.directorate as string);
    //if (options.status) query.append("status", options.status);
    const data = await ApiClient.get(`${ENDPOINT}?${query.toString()}`);
    return data as Call[];
  },

  // ---------------------------
  // Update
  // ---------------------------
  async update(call: Partial<Call>, changeStatus = false): Promise<Call> {
    if (!call._id) throw new Error("_id required.");
    const sanitized = sanitizeCall(call);
    const url = changeStatus
      ? `${ENDPOINT}/${call._id}/status`
      : `${ENDPOINT}/${call._id}`;
    const updated = await ApiClient.put(url, sanitized);
    return updated as Call;
  },
  // ---------------------------
  // Delete
  // ---------------------------
  async delete(call: Partial<Call>): Promise<boolean> {
    if (!call._id) throw new Error("_id required.");
    const response = await ApiClient.delete(`${ENDPOINT}/${call._id}`, call);
    return response;
  }
};
