export interface User {
  id: string;
  email: string;
  full_name: string;
  role_id: number;
  role: 'admin' | 'user' | 'center_representative';
  phone?: string;
  is_active: boolean;
}

export interface DeviceCategory {
  category_id: string;
  code: string;
  name: string;
  description?: string;
  handling_priority: 'hazardous' | 'secure_data_wipe' | 'standard';
  base_points: number;
  points_per_kg: number;
  is_active: boolean;
}

export interface CategoryMaterial {
  material_id: string;
  material_code: string;
  material_name: string;
  unit: string;
  default_impact_factor: number;
  estimated_percentage: number;
}

export interface CenterSearchResult {
  center_id: string;
  name: string;
  address: string;
  contact_phone?: string;
  contact_email?: string;
  latitude: number;
  longitude: number;
  operational_hours: Record<string, string>;
  distance_meters: number;
  distance_km: number;
  verification_status: 'verified' | 'pending' | 'rejected' | 'expired';
  accepted_categories: string[];
}

export interface CenterVerification {
  verification_id: string;
  center_id: string;
  status: string;
  reviewer_id?: string;
  valid_from?: string;
  valid_until?: string;
  rejection_reason?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface CenterStatusHistory {
  history_id: string;
  center_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  reason?: string;
  changed_at: string;
}

export interface AIClassifyResponse {
  photo_id: string;
  predicted_category_code: string;
  confidence: number;
  is_low_confidence: boolean;
  top_predictions: Array<{ category_code: string; confidence: number }>;
  storage_url: string;
  disclaimer: string;
  is_pdf?: boolean;
  page_count?: number;
  images_detected?: number;
}

export interface RecyclingRecord {
  record_id: string;
  user_id: string;
  center_id: string;
  category_id: string;
  weight_kg: number;
  estimated_units: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  photo_id?: string;
  receipt_reference?: string;
  created_at: string;
  category_name?: string;
  category_code?: string;
  center_name?: string;
}

export interface Receipt {
  receipt_id: string;
  record_id: string;
  receipt_reference: string;
  center_name?: string;
  center_address?: string;
  weight_kg?: number;
  issuance_date: string;
  verification_code: string;
  created_at: string;
}

export interface Reward {
  reward_id: string;
  title: string;
  description?: string;
  points_cost: number;
  stock_quantity: number;
  is_active: boolean;
}

export interface RedemptionResponse {
  redemption_id: string;
  reward_title: string;
  points_spent: number;
  remaining_balance: number;
  status: string;
  idempotent_replay: boolean;
  message: string;
}

export interface Redemption {
  redemption_id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  idempotency_key: string;
  redeemed_at: string;
  reward_title?: string;
  reward_description?: string;
}

export interface RewardsOverview {
  total_points_awarded: number;
  total_points_redeemed: number;
  total_redemptions_count: number;
  active_rewards_count: number;
  pending_records_count: number;
}

export interface RewardRule {
  category_id: string;
  code: string;
  name: string;
  description?: string;
  base_points: number;
  points_per_kg: number;
  is_active: boolean;
}

export interface PointsLedgerEntry {
  ledger_id: string;
  user_id: string;
  record_id?: string;
  transaction_type: string;
  points: number;
  idempotency_key: string;
  notes?: string;
  created_at: string;
}

export interface Badge {
  badge_id: string;
  code: string;
  name: string;
  description?: string;
  icon_name?: string;
  threshold_points: number;
}

export interface UserBadge {
  user_badge_id: string;
  badge_id: string;
  badge_code: string;
  badge_name: string;
  badge_description?: string;
  awarded_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  total_points: number;
  total_kg_recycled: number;
  total_records_approved: number;
}

export interface PersonalDashboard {
  user_id: string;
  current_points_balance: number;
  total_records_submitted: number;
  approved_records: number;
  pending_records: number;
  measured_weight_kg: number;
  estimated_co2_kg_saved: number;
  badges_count: number;
  recent_submissions: RecyclingRecord[];
  measurement_disclaimer: string;
}

export interface CommunityDashboard {
  total_citizens: number;
  total_verified_centers: number;
  total_recycling_records: number;
  total_approved_records: number;
  total_measured_kg_recycled: number;
  total_estimated_co2_kg_saved: number;
  total_points_distributed: number;
  total_rewards_redeemed: number;
  category_breakdown: Array<{ category_code: string; total_weight_kg: number; record_count: number }>;
  measurement_disclaimer: string;
}

export interface ImpactSummaryReport {
  title: string;
  generated_at: string;
  scope: string;
  key_metrics: {
    measured_kg_diverted: number;
    estimated_co2_kg_saved: number;
    approved_submissions: number;
    active_recyclers: number;
  };
  narrative_summary: string;
  transparency_note: string;
}
