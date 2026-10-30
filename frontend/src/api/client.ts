import {
  AIClassifyResponse,
  CategoryMaterial,
  CenterSearchResult,
  GeocodeResult,
  CommunityDashboard,
  DeviceCategory,
  ImpactSummaryReport,
  LeaderboardEntry,
  PersonalDashboard,
  PointsLedgerEntry,
  Receipt,
  RecyclingRecord,
  Redemption,
  RedemptionResponse,
  Reward,
  RewardRule,
  RewardsOverview,
  User,
  UserBadge,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-admin-override', 'true');

  // Include credentials for server-side HttpOnly session cookies
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      // fallback to statusText
    }
    const err = new Error(errorDetail);
    (err as any).status = response.status;
    throw err;
  }

  // Handle empty 204 or void responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; db_mode: string; mongo_mode: string; postgres_connected: boolean }>('/api/health'),

  // Auth
  register: (data: { email: string; password: string; full_name: string; role_id?: number; phone?: string }) =>
    request<User>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<User>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request<{ success: boolean; message: string }>('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }),

  getMe: () => request<User>('/api/v1/auth/me'),

  // Catalog
  getCategories: () => request<DeviceCategory[]>('/api/v1/categories'),
  getCategoryMaterials: (id: string) => request<CategoryMaterial[]>(`/api/v1/categories/${id}/materials`),

  // Centers
  searchNearbyCenters: (lat: number, lng: number, radiusKm: number = 25, categoryId?: string, verifiedOnly: boolean = true) => {
    let query = `/api/v1/centers/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&verified_only=${verifiedOnly}`;
    if (categoryId) query += `&category_id=${categoryId}`;
    return request<CenterSearchResult[]>(query);
  },
  geocodeLocation: (query: string) =>
    request<GeocodeResult>(`/api/v1/centers/geocode?query=${encodeURIComponent(query)}`),
  getAllCenters: () => request<any[]>('/api/v1/centers'),
  createCenter: (data: any) => request<any>('/api/v1/centers', { method: 'POST', body: JSON.stringify(data) }),
  verifyCenter: (centerId: string, data: { status: string; valid_until?: string; rejection_reason?: string }) =>
    request<any>(`/api/v1/admin/centers/${centerId}/verify`, { method: 'POST', body: JSON.stringify(data) }),

  // AI Classification
  classifyDevicePhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<AIClassifyResponse>('/api/v1/ai/classify-device', {
      method: 'POST',
      body: formData,
    });
  },

  // Records & Submissions
  submitRecord: (data: {
    center_id: string;
    category_id: string;
    weight_kg: number;
    estimated_units?: number;
    receipt_number?: string;
    notes?: string;
    photo_id?: string;
  }) => request<RecyclingRecord>('/api/v1/records', { method: 'POST', body: JSON.stringify(data) }),

  getMyRecords: () => request<RecyclingRecord[]>('/api/v1/records/my'),
  getRecord: (id: string) => request<RecyclingRecord>(`/api/v1/records/${id}`),
  getReceipt: (recordId: string) => request<Receipt>(`/api/v1/records/${recordId}/receipt`),
  getAdminRecordQueue: () => request<RecyclingRecord[]>('/api/v1/admin/records/queue'),
  reviewRecord: (recordId: string, data: { decision: 'approved' | 'rejected'; rejection_reason?: string; receipt_reference?: string }) =>
    request<any>(`/api/v1/admin/records/${recordId}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Rewards & Admin Dashboard
  getRewards: () => request<Reward[]>('/api/v1/rewards'),
  getAllAdminRewards: () => request<Reward[]>('/api/v1/rewards/admin/all'),
  getMyBalance: () => request<{ user_id: string; current_balance: number }>('/api/v1/rewards/my-balance'),
  getMyRedemptions: () => request<Redemption[]>('/api/v1/rewards/my-redemptions'),
  getMyLedger: () => request<PointsLedgerEntry[]>('/api/v1/rewards/my-ledger'),
  redeemReward: (data: { reward_id: string; idempotency_key: string }) =>
    request<RedemptionResponse>('/api/v1/rewards/redeem', { method: 'POST', body: JSON.stringify(data) }),
  createReward: (data: { title: string; description?: string; points_cost: number; stock_quantity: number; is_active?: boolean }) =>
    request<Reward>('/api/v1/rewards', { method: 'POST', body: JSON.stringify(data) }),
  updateReward: (rewardId: string, data: { title?: string; description?: string; points_cost?: number; stock_quantity?: number; is_active?: boolean }) =>
    request<Reward>(`/api/v1/rewards/${rewardId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReward: (rewardId: string) =>
    request<{ success: boolean; message: string }>(`/api/v1/rewards/${rewardId}`, { method: 'DELETE' }),
  getRewardsOverview: () => request<RewardsOverview>('/api/v1/rewards/admin/overview'),
  getRewardRules: () => request<RewardRule[]>('/api/v1/rewards/rules'),
  updateRewardRule: (categoryId: string, data: { base_points: number; points_per_kg: number }) =>
    request<RewardRule>(`/api/v1/rewards/rules/${categoryId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLeaderboard: (limit: number = 10) => request<LeaderboardEntry[]>(`/api/v1/rewards/leaderboard?limit=${limit}`),
  getMyBadges: () => request<UserBadge[]>('/api/v1/rewards/my-badges'),

  // Analytics
  getPersonalDashboard: () => request<PersonalDashboard>('/api/v1/analytics/personal'),
  getCommunityDashboard: () => request<CommunityDashboard>('/api/v1/analytics/community'),
  getSummaryReport: () => request<ImpactSummaryReport>('/api/v1/analytics/summary-report'),
};
