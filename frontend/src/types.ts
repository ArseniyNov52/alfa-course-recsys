export type BusinessStage = 'idea_and_launch' | 'early_stage' | 'growth_and_scaling' | 'crisis_and_turnaround';
export type BusinessDomain = 'all' | 'retail' | 'services' | 'horeca' | 'ecommerce' | 'it_and_digital' | 'production';
export type MaterialFormat = 'checklist' | 'template' | 'guide' | 'video_intensive' | 'deep_course';
export type PriceType = 'free' | 'paid';

export interface Material {
  id: string;
  title: string;
  description: string;
  format: MaterialFormat;
  price_type: PriceType;
  price_rub: number;
  effort_minutes: number;
  target_stages: BusinessStage[];
  target_domains: BusinessDomain[];
  topics: string[];
  prerequisites: string[];
  next_material_ids: string[];
  key_takeaways: string[];
  alfa_link: string;
  rating: number;
  popularity_score: number;
}

export interface UserProfile {
  user_id: string;
  name: string;
  stage: BusinessStage | null;
  domain: BusinessDomain | null;
  current_task: string;
  experience_years: number;
  view_history: string[];
  completed_materials: string[];
}

export interface RecommendationExplanation {
  why_recommended: string;
  fit_factors: string[];
  next_step: string;
  suggested_next_material_id: string | null;
}

export interface ScoredRecommendation {
  material: Material;
  score: number;
  relevance_score: number;
  stage_fit_score: number;
  funnel_score: number;
  explanation: RecommendationExplanation;
}

export interface RecommendationResponse {
  profile_summary: string;
  is_cold_start: boolean;
  recommendations: ScoredRecommendation[];
  total_found: number;
}

export interface ProfileBenchmarkResult {
  profile_id: string;
  profile_name: string;
  task_description: string;
  stage: string;
  baseline_recommendations: string[];
  model_recommendations: string[];
  baseline_stage_match_rate: number;
  model_stage_match_rate: number;
  baseline_ndcg_at_5: number;
  model_ndcg_at_5: number;
  baseline_precision_at_5: number;
  model_precision_at_5: number;
  baseline_issues: string[];
  model_advantages: string[];
}

export interface BenchmarkComparisonResponse {
  summary: {
    total_profiles_evaluated: number;
    average_baseline_ndcg_at_5: number;
    average_model_ndcg_at_5: number;
    ndcg_uplift_percent: string;
    average_baseline_stage_match_rate: string;
    average_model_stage_match_rate: string;
    stage_match_uplift_percent: string;
    key_finding: string;
  };
  profiles: ProfileBenchmarkResult[];
}

export interface ABTestSimulationResult {
  traffic: {
    total_visitors: number;
    control_group_size: number;
    test_group_size: number;
    duration_days: number;
  };
  conversion_rates: {
    baseline_cr: string;
    expected_test_cr: string;
    relative_uplift: string;
  };
  statistical_design: {
    alpha: number;
    power: number;
    min_detectable_effect: string;
    stat_significance_reached: boolean;
    recommendation: string;
  };
  business_impact: {
    test_incremental_orders: number;
    test_incremental_revenue_rub: number;
    annual_projected_revenue_gain_rub: number;
  };
}
