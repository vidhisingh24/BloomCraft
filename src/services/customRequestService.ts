import type { CustomRequest } from '../types';
import { INITIAL_CUSTOM_REQUESTS } from '../data/mock/customRequests';
import { storage, STORAGE_KEYS } from './storage';
import { generateCustomRequestId } from '../utils/ids';
import { siteConfig } from '../config/site.config';

function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStoredCustomRequests(): CustomRequest[] {
  const reqs = storage.get<CustomRequest[]>(STORAGE_KEYS.CUSTOM_REQUESTS, []);
  if (!reqs || reqs.length === 0) {
    storage.set(STORAGE_KEYS.CUSTOM_REQUESTS, INITIAL_CUSTOM_REQUESTS);
    return INITIAL_CUSTOM_REQUESTS;
  }
  return reqs;
}

export const customRequestService = {
  /**
   * Creates and persists a custom crochet inquiry
   */
  async create(
    payload: Omit<CustomRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<CustomRequest> {
    await delay(400);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/custom-requests`, {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify(payload),
       * });
       * return await res.json();
       */
    }

    const id = generateCustomRequestId();
    const newRequest: CustomRequest = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
      status: 'received',
    };

    const current = getStoredCustomRequests();
    const updated = [newRequest, ...current];
    storage.set(STORAGE_KEYS.CUSTOM_REQUESTS, updated);

    return newRequest;
  },

  /**
   * Fetches all custom requests
   */
  async getAll(): Promise<CustomRequest[]> {
    await delay(250);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/custom-requests`);
       * return await res.json();
       */
    }

    const reqs = getStoredCustomRequests();
    return [...reqs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Fetches a custom request by ID
   */
  async getById(id: string): Promise<CustomRequest | null> {
    await delay(150);
    const reqs = getStoredCustomRequests();
    return reqs.find((r) => r.id.toUpperCase() === id.trim().toUpperCase()) || null;
  },

  /**
   * Updates status of custom request
   */
  async updateStatus(
    id: string,
    status: CustomRequest['status']
  ): Promise<CustomRequest> {
    await delay(300);

    const reqs = getStoredCustomRequests();
    const index = reqs.findIndex((r) => r.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) throw new Error(`Custom Request ${id} not found`);

    reqs[index] = { ...reqs[index], status };
    storage.set(STORAGE_KEYS.CUSTOM_REQUESTS, reqs);
    return reqs[index];
  },

  /**
   * Updates maker quote price and notes
   */
  async updateQuote(
    id: string,
    quotedPrice: number,
    notes?: string
  ): Promise<CustomRequest> {
    await delay(300);

    const reqs = getStoredCustomRequests();
    const index = reqs.findIndex((r) => r.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) throw new Error(`Custom Request ${id} not found`);

    reqs[index] = {
      ...reqs[index],
      quotedPrice,
      notes: notes || reqs[index].notes,
      status: 'quoted',
    };
    storage.set(STORAGE_KEYS.CUSTOM_REQUESTS, reqs);
    return reqs[index];
  },
};
