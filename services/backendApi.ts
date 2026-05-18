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

export type NextSevenDaysSchedule = {
  status: "ok" | "empty" | string;
  generated_at: string;
  start_date: string;
  end_date: string;
  last_import: LastImportMetadata | null;
  days: ScheduleDay[];
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
