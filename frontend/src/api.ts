import {
  UserProfile,
  RecommendationResponse,
  BenchmarkComparisonResponse,
  ABTestSimulationResult,
} from './types';

const API_BASE = '/api/v1';

export async function fetchProfiles(): Promise<UserProfile[]> {
  const res = await fetch(`${API_BASE}/profiles`);
  if (!res.ok) throw new Error('Failed to fetch test profiles');
  return res.json();
}

export async function fetchRecommendations(
  profile: UserProfile,
  topK: number = 5
): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/recommend?top_k=${topK}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to get recommendations');
  return res.json();
}

export async function fetchColdStart(): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/cold-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to get cold start recommendations');
  return res.json();
}

export async function fetchBenchmark(): Promise<BenchmarkComparisonResponse> {
  const res = await fetch(`${API_BASE}/benchmark`);
  if (!res.ok) throw new Error('Failed to run benchmark');
  return res.json();
}

export async function simulateABTest(params: {
  daily_visitors: number;
  baseline_cr_percent: number;
  expected_uplift_percent: number;
  avg_order_value_rub: number;
  test_duration_days: number;
}): Promise<ABTestSimulationResult> {
  const res = await fetch(`${API_BASE}/ab-test-simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to simulate A/B test');
  return res.json();
}
