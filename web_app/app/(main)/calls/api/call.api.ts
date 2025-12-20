import { ApiClient } from "@/api/ApiClient";
import { Call, CallStatus, GetCallsOptions, sanitizeCall } from "../models/call.model";

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
  async update(call: Partial<Call>): Promise<Call> {
    if (!call._id) throw new Error("_id required.");
    const query = new URLSearchParams();
    query.append("id", call._id);
    const sanitized = sanitizeCall(call);
    const updated = await ApiClient.put(`${ENDPOINT}?${query.toString()}`, sanitized);
    return updated as Call;
  },


  async updateStatus(id: string, status: CallStatus): Promise<Call> {
    const query = new URLSearchParams();
    query.append("id", id);
    const url = `${ENDPOINT}/${status}`;
    const updated = await ApiClient.put(`${url}?${query.toString()}`);
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
