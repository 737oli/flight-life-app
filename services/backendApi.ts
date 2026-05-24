import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8010";
const DEFAULT_TIMEOUT_MS = 5000;
const BACKEND_BASE_URL_STORAGE_KEY = "flightLife.backendBaseUrl";

export type BackendHealthStatus = "idle" | "checking" | "online" | "offline";

export type BackendHealthResult = {
  ok: boolean;
  baseUrl: string;
  checkedAt: string;
  message?: string;
  status?: number;
};

export type ProviderReadinessStatus = "ready" | "partial" | "not_configured" | string;

export type ProviderReadiness = {
  id: string;
  label: string;
  category: "live_operations" | "decision_context" | string;
  status: ProviderReadinessStatus;
  missing: string[];
  notes: string[];
  model?: string;
};

export type SystemReadinessResponse = {
  status: "ok" | string;
  readiness: "ready" | "attention" | string;
  generated_at: string;
  providers: ProviderReadiness[];
  warnings: string[];
};

export type RosterPeriod = {
  start: string;
  end: string;
};

export type RosterImportSummary = {
  roster_period: RosterPeriod;
  duty_days_parsed: number;
  flight_legs_parsed: number;
  rests_parsed: number;
  taxis_parsed: number;
  hotel_stays_parsed: number;
  parser_warning_count?: number;
  flight_duty_days_without_legs?: number;
  inserted_dates: number;
  updated_dates: number;
  unchanged_dates: number;
  warnings: string[];
  decisions_marked_needs_review: number;
};

export type RosterImportResponse = {
  status: "imported";
  import_id: number;
  source_filename: string;
  summary: RosterImportSummary;
  warnings: string[];
};

export type SourcePdfState = {
  state: "stored_locally" | "deleted" | "not_stored" | string;
  label: string;
  can_delete: boolean;
  deleted_at: string | null;
};

export type RosterImportHistoryItem = {
  id: number;
  source_filename: string;
  created_at: string | null;
  period_start: string | null;
  period_end: string | null;
  duty_days_parsed: number;
  flight_legs_parsed: number;
  inserted_dates: number;
  updated_dates: number;
  unchanged_dates: number;
  parser_warning_count: number;
  warning_preview: string[];
  remaining_warning_count: number;
  flight_duty_days_without_legs: number;
  decisions_marked_needs_review: number;
  source_pdf: SourcePdfState;
};

export type RosterImportHistoryResponse = {
  status: "ok" | "empty" | string;
  current_import: RosterImportHistoryItem | null;
  imports: RosterImportHistoryItem[];
  has_preserved_days_outside_current_period: boolean;
};

export type DeleteRosterImportSourcePdfResponse = {
  status: "ok" | string;
  import: RosterImportHistoryItem;
};

export type RosterImportErrorResponse = {
  status?: "rejected";
  errors?: string[];
  warnings?: string[];
};

export type RosterUploadFile = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: Blob;
};

export type FlightLifePreferences = {
  home_base_airport: string;
  ams_walking_buffer_minutes: number;
  home_commute_minutes: number;
  minimum_useful_home_minutes: number;
  material_change_threshold_minutes: number;
  updated_at: string | null;
};

export type PreferencesResponse = {
  status: "ok";
  preferences: FlightLifePreferences;
};

export type PreferencesUpdate = Partial<Omit<FlightLifePreferences, "updated_at">>;

export type ScheduleFlight = {
  flight_leg_id?: number;
  sequence: number;
  flight_number: string;
  dep_airport: string;
  arr_airport: string;
  scheduled_departure_time: string | null;
  scheduled_arrival_time: string | null;
  aircraft_code: string | null;
};

export type ScheduleDuty = {
  type: string;
  start: string | null;
  end: string | null;
  end_next_day: boolean;
  overnight_station: string | null;
};

export type ScheduleDay = {
  date: string;
  weekday: string;
  kind: "flight_duty" | "off_day" | "other_duty" | "missing_roster" | string;
  duty: ScheduleDuty | null;
  flights: ScheduleFlight[];
  hotel: Record<string, unknown> | null;
  taxis: Record<string, unknown>[];
  warnings: string[];
};

export type LastImportMetadata = {
  id: number;
  source_filename: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string | null;
  summary: RosterImportSummary;
};

export type ScheduleResponse = {
  status: "ok" | "empty" | string;
  generated_at: string;
  start_date: string;
  end_date: string;
  last_import: LastImportMetadata | null;
  days: ScheduleDay[];
};

export type NextSevenDaysSchedule = ScheduleResponse;

export type OperationsScheduledFlight = {
  flight_number: string;
  dep_airport: string;
  arr_airport: string;
  departure_date: string;
  departure_time: string | null;
  arrival_time: string | null;
  departure_at: string | null;
  aircraft_code: string | null;
};

export type OperationsWalkingStart = {
  time: string | null;
  at: string | null;
  buffer_minutes: number;
};

export type OperationsLiveData = {
  flight_number: string | null;
  carrier_code: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  scheduled_departure: string | null;
  latest_departure: string | null;
  scheduled_arrival: string | null;
  latest_arrival: string | null;
  delay_minutes: number | null;
  parking_position: string | null;
  ctot: string | null;
  tsat: string | null;
  previous_flight_arrival: string | null;
  aircraft_registration: string | null;
  aircraft_type: string | null;
  status: string | null;
};

export type FlightOperationsResponse = {
  flight_leg_id: number;
  status: "scheduled_only" | "ok" | "live_unavailable" | string;
  eligibility: "outside_window" | "eligible" | "not_eligible" | string;
  operations_window_minutes: number;
  minutes_until_departure: number | null;
  scheduled: OperationsScheduledFlight;
  walking_start: OperationsWalkingStart;
  live: OperationsLiveData | null;
  warnings: string[];
};

export type StayVsHomeChoice = "go_home" | "stay_outstation";
export type StayVsHomeRecommendation = StayVsHomeChoice | "needs_review";
export type StayVsHomeState = "recommended" | "overridden" | "needs_review" | string;

export type StayVsHomeManualOverride = {
  choice: StayVsHomeChoice;
  status: "confirmed" | "needs_review" | string;
};

export type StayVsHomeReasoning = {
  arrival_station?: string | null;
  home_base_airport?: string | null;
  next_duty_date?: string | null;
  next_duty_start?: string | null;
  current_duty_end?: string | null;
  time_between_duties_minutes?: number | null;
  home_commute_minutes_each_way?: number | null;
  minimum_useful_home_minutes?: number | null;
  useful_home_minutes?: number | null;
  hotel_available?: boolean | null;
  manual_review_reason?: string | null;
  [key: string]: unknown;
};

export type StayVsHomeDecision = {
  decision_key: string;
  decision_date: string;
  decision_type: "stay_vs_home" | string;
  state: StayVsHomeState;
  recommendation: StayVsHomeRecommendation;
  system_recommendation: StayVsHomeRecommendation;
  manual_override: StayVsHomeManualOverride | null;
  missing_inputs: string[];
  reasoning: StayVsHomeReasoning;
};

export type StayVsHomeDecisionResponse = {
  status: "ok";
  decision: StayVsHomeDecision;
};

export type AiAdvisorResult = {
  recommendation: StayVsHomeRecommendation;
  confidence: "low" | "medium" | "high" | string;
  summary: string;
  reasoning_points: string[];
  risks: string[];
  missing_inputs: string[];
  facts_used: string[];
};

export type AiAdvisorResponse = {
  status: "ok" | "unavailable" | "not_applicable" | string;
  decision_date: string;
  context_hash?: string | null;
  cache_status?: "hit" | "miss" | string;
  provider?: string;
  model?: string;
  created_at?: string;
  expires_at?: string;
  usage?: {
    input_tokens?: number | null;
    output_tokens?: number | null;
    total_tokens?: number | null;
  };
  rule_recommendation?: StayVsHomeRecommendation | null;
  advisor: AiAdvisorResult | null;
  agreement?: "agrees" | "disagrees" | "not_comparable" | string;
  decision_state?: "advisor_ready" | "advisor_unavailable" | "needs_review" | string;
  warnings: string[];
  reason?: string;
};

export class BackendApiError extends Error {
  status?: number;
  errors: string[];
  warnings: string[];

  constructor(message: string, options: { status?: number; errors?: string[]; warnings?: string[] } = {}) {
    super(message);
    this.name = "BackendApiError";
    this.status = options.status;
    this.errors = options.errors ?? [];
    this.warnings = options.warnings ?? [];
  }
}

export const normalizeBackendBaseUrl = (baseUrl: string): string =>
  baseUrl.trim().replace(/\/+$/, "");

export const getBackendBaseUrl = (): string =>
  normalizeBackendBaseUrl(
    process.env.EXPO_PUBLIC_FLIGHT_LIFE_API_URL ?? DEFAULT_BACKEND_BASE_URL
  );

export const getConfiguredBackendBaseUrl = async (): Promise<string> => {
  const storedValue = await AsyncStorage.getItem(BACKEND_BASE_URL_STORAGE_KEY);
  return normalizeBackendBaseUrl(storedValue || getBackendBaseUrl());
};

export const saveBackendBaseUrl = async (baseUrl: string): Promise<string> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl);
  await AsyncStorage.setItem(BACKEND_BASE_URL_STORAGE_KEY, normalizedBaseUrl);
  return normalizedBaseUrl;
};

export const fetchBackendHealth = async (
  baseUrl?: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<BackendHealthResult> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${normalizedBaseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        baseUrl: normalizedBaseUrl,
        checkedAt,
        status: response.status,
        message: `HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as { message?: string; status?: string };
    return {
      ok: true,
      baseUrl: normalizedBaseUrl,
      checkedAt,
      status: response.status,
      message: data.message ?? (data.status === "ok" ? "Connected" : "Backend responded"),
    };
  } catch {
    return {
      ok: false,
      baseUrl: normalizedBaseUrl,
      checkedAt,
      message: "Backend unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchSystemReadiness = async (baseUrl?: string): Promise<SystemReadinessResponse> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/system/readiness`);

  if (!response.ok) {
    throw new BackendApiError(`Readiness unavailable: HTTP ${response.status}`, {
      status: response.status,
      errors: [`HTTP ${response.status}`],
    });
  }

  return (await response.json()) as SystemReadinessResponse;
};

export const importRosterPdf = async (
  uploadFile: RosterUploadFile,
  baseUrl?: string
): Promise<RosterImportResponse> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const formData = new FormData();

  if (uploadFile.file) {
    formData.append("file", uploadFile.file, uploadFile.name);
  } else {
    formData.append("file", {
      uri: uploadFile.uri,
      name: uploadFile.name,
      type: uploadFile.mimeType ?? "application/pdf",
    } as unknown as Blob);
  }

  const response = await fetch(`${normalizedBaseUrl}/rosters/import`, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();

  if (!response.ok) {
    const detail = payload?.detail as RosterImportErrorResponse | undefined;
    const errors = detail?.errors ?? [payload?.message ?? `HTTP ${response.status}`];
    const warnings = detail?.warnings ?? [];
    throw new BackendApiError(errors[0] ?? "Import failed", {
      status: response.status,
      errors,
      warnings,
    });
  }

  return payload as RosterImportResponse;
};

export const fetchRosterImportHistory = async (
  options: { limit?: number; baseUrl?: string } = {}
): Promise<RosterImportHistoryResponse> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(options.baseUrl || await getConfiguredBackendBaseUrl());
  const params = new URLSearchParams();
  params.set("limit", String(options.limit ?? 10));
  const response = await fetch(`${normalizedBaseUrl}/rosters/imports?${params.toString()}`);

  if (!response.ok) {
    throw new BackendApiError(`Import history unavailable: HTTP ${response.status}`, {
      status: response.status,
      errors: [`HTTP ${response.status}`],
    });
  }

  return (await response.json()) as RosterImportHistoryResponse;
};

export const deleteRosterImportSourcePdf = async (
  importId: number,
  baseUrl?: string
): Promise<DeleteRosterImportSourcePdfResponse> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/rosters/imports/${importId}/source-pdf`, {
    method: "DELETE",
  });
  const payload = await response.json();

  if (!response.ok) {
    const detail = payload?.detail as string | { errors?: string[] } | undefined;
    const errors = typeof detail === "object" ? detail.errors ?? [] : [];
    throw new BackendApiError(
      errors[0] ?? (typeof detail === "string" ? detail : `HTTP ${response.status}`),
      {
        status: response.status,
        errors: errors.length > 0 ? errors : [typeof detail === "string" ? detail : `HTTP ${response.status}`],
      }
    );
  }

  return payload as DeleteRosterImportSourcePdfResponse;
};

export const fetchPreferences = async (baseUrl?: string): Promise<FlightLifePreferences> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/preferences`);

  if (!response.ok) {
    throw new BackendApiError(`Preferences unavailable: HTTP ${response.status}`, {
      status: response.status,
      errors: [`HTTP ${response.status}`],
    });
  }

  const payload = (await response.json()) as PreferencesResponse;
  return payload.preferences;
};

export const updatePreferences = async (
  preferences: PreferencesUpdate,
  baseUrl?: string
): Promise<FlightLifePreferences> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });
  const payload = await response.json();

  if (!response.ok) {
    const detail = payload?.detail as { errors?: string[] } | undefined;
    const errors = detail?.errors ?? [payload?.message ?? `HTTP ${response.status}`];
    throw new BackendApiError(errors[0] ?? "Preferences update failed", {
      status: response.status,
      errors,
    });
  }

  return (payload as PreferencesResponse).preferences;
};

export const fetchNextSevenDaysSchedule = async (
  options: { startDate?: string; baseUrl?: string } = {}
): Promise<NextSevenDaysSchedule> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(options.baseUrl || await getConfiguredBackendBaseUrl());
  const params = new URLSearchParams();
  if (options.startDate) {
    params.set("start_date", options.startDate);
  }
  const queryString = params.toString();
  const url = `${normalizedBaseUrl}/schedule/next-7-days${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new BackendApiError(`Schedule unavailable: HTTP ${response.status}`, {
      status: response.status,
      errors: [`HTTP ${response.status}`],
    });
  }

  return (await response.json()) as NextSevenDaysSchedule;
};

export const fetchScheduleRange = async (
  options: { startDate: string; endDate: string; baseUrl?: string }
): Promise<ScheduleResponse> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(options.baseUrl || await getConfiguredBackendBaseUrl());
  const params = new URLSearchParams();
  params.set("start_date", options.startDate);
  params.set("end_date", options.endDate);

  const response = await fetch(`${normalizedBaseUrl}/schedule?${params.toString()}`);

  if (!response.ok) {
    throw new BackendApiError(`Schedule unavailable: HTTP ${response.status}`, {
      status: response.status,
      errors: [`HTTP ${response.status}`],
    });
  }

  return (await response.json()) as ScheduleResponse;
};

export const fetchFlightOperations = async (
  flightLegId: number,
  baseUrl?: string
): Promise<FlightOperationsResponse> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/operations/flights/${flightLegId}`);

  if (!response.ok) {
    throw new BackendApiError(`Operations unavailable: HTTP ${response.status}`, {
      status: response.status,
      errors: [`HTTP ${response.status}`],
    });
  }

  return (await response.json()) as FlightOperationsResponse;
};

export const fetchStayVsHomeDecision = async (
  decisionDate: string,
  baseUrl?: string
): Promise<StayVsHomeDecision> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/decisions/stay-vs-home/${decisionDate}`);

  if (!response.ok) {
    throw new BackendApiError(`Decision unavailable: HTTP ${response.status}`, {
      status: response.status,
      errors: [`HTTP ${response.status}`],
    });
  }

  return ((await response.json()) as StayVsHomeDecisionResponse).decision;
};

export const overrideStayVsHomeDecision = async (
  decisionDate: string,
  choice: StayVsHomeChoice,
  baseUrl?: string
): Promise<StayVsHomeDecision> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/decisions/stay-vs-home/${decisionDate}/override`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ choice }),
  });
  const payload = await response.json();

  if (!response.ok) {
    const detail = payload?.detail as { errors?: string[] } | undefined;
    const errors = detail?.errors ?? [payload?.message ?? `HTTP ${response.status}`];
    throw new BackendApiError(errors[0] ?? "Decision override failed", {
      status: response.status,
      errors,
    });
  }

  return (payload as StayVsHomeDecisionResponse).decision;
};

export const fetchStayVsHomeAdvisor = async (
  decisionDate: string,
  baseUrl?: string
): Promise<AiAdvisorResponse> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl || await getConfiguredBackendBaseUrl());
  const response = await fetch(`${normalizedBaseUrl}/decisions/stay-vs-home/${decisionDate}/advisor`, {
    method: "POST",
  });
  const payload = await response.json();

  if (!response.ok) {
    const detail = payload?.detail as { errors?: string[] } | undefined;
    const errors = detail?.errors ?? [payload?.message ?? `HTTP ${response.status}`];
    throw new BackendApiError(errors[0] ?? "AI advisor unavailable", {
      status: response.status,
      errors,
    });
  }

  return payload as AiAdvisorResponse;
};
