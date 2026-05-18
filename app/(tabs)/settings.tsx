import Colors from "@/constants/Colors";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileUp,
  RefreshCw,
  Save,
  Server,
  SlidersHorizontal,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BackendApiError,
  FlightLifePreferences,
  BackendHealthResult,
  BackendHealthStatus,
  RosterImportResponse,
  fetchBackendHealth,
  fetchPreferences,
  getBackendBaseUrl,
  getConfiguredBackendBaseUrl,
  importRosterPdf,
  normalizeBackendBaseUrl,
  saveBackendBaseUrl,
  updatePreferences,
} from "@/services/backendApi";

type StatusDetails = {
  label: string;
  color: string;
  backgroundColor: string;
  icon: typeof Wifi;
};

type PreferenceDraft = {
  home_base_airport: string;
  ams_walking_buffer_minutes: string;
  home_commute_minutes: string;
  minimum_useful_home_minutes: string;
  material_change_threshold_minutes: string;
};

const statusDetailsByStatus: Record<BackendHealthStatus, StatusDetails> = {
  idle: {
    label: "Not checked",
    color: Colors.light.secondary,
    backgroundColor: Colors.light.border,
    icon: Server,
  },
  checking: {
    label: "Checking",
    color: Colors.light.tint,
    backgroundColor: `${Colors.light.tint}1A`,
    icon: RefreshCw,
  },
  online: {
    label: "Online",
    color: Colors.light.success,
    backgroundColor: `${Colors.light.success}20`,
    icon: Wifi,
  },
  offline: {
    label: "Offline",
    color: Colors.light.danger,
    backgroundColor: `${Colors.light.danger}20`,
    icon: WifiOff,
  },
};

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState(getBackendBaseUrl());
  const [status, setStatus] = useState<BackendHealthStatus>("idle");
  const [healthResult, setHealthResult] = useState<BackendHealthResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<RosterImportResponse | null>(null);
  const [importError, setImportError] = useState<BackendApiError | null>(null);
  const [preferences, setPreferences] = useState<FlightLifePreferences | null>(null);
  const [preferenceDraft, setPreferenceDraft] = useState<PreferenceDraft>(emptyPreferenceDraft);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  const statusDetails = statusDetailsByStatus[status];
  const StatusIcon = statusDetails.icon;

  const loadPreferencesForUrl = useCallback(async (baseUrl: string) => {
    const normalizedUrl = normalizeBackendBaseUrl(baseUrl);
    if (!normalizedUrl) {
      return;
    }

    setPreferencesLoading(true);
    setPreferencesError(null);
    try {
      const loadedPreferences = await fetchPreferences(normalizedUrl);
      setPreferences(loadedPreferences);
      setPreferenceDraft(toPreferenceDraft(loadedPreferences));
    } catch {
      setPreferencesError("Preferences unavailable");
    } finally {
      setPreferencesLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getConfiguredBackendBaseUrl().then((configuredUrl) => {
      if (!mounted) {
        return;
      }
      setApiUrl(configuredUrl);
      void loadPreferencesForUrl(configuredUrl);
    });
    return () => {
      mounted = false;
    };
  }, [loadPreferencesForUrl]);

  const checkedAtText = useMemo(() => {
    if (!healthResult?.checkedAt) {
      return null;
    }

    return new Date(healthResult.checkedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [healthResult?.checkedAt]);

  const checkConnection = useCallback(async () => {
    const normalizedUrl = normalizeBackendBaseUrl(apiUrl);
    if (!normalizedUrl) {
      setStatus("offline");
      setHealthResult({
        ok: false,
        baseUrl: "",
        checkedAt: new Date().toISOString(),
        message: "API URL required",
      });
      return;
    }

    setStatus("checking");
    await saveBackendBaseUrl(normalizedUrl);
    const result = await fetchBackendHealth(normalizedUrl);
    setApiUrl(result.baseUrl);
    setHealthResult(result);
    setStatus(result.ok ? "online" : "offline");
    if (result.ok) {
      void loadPreferencesForUrl(result.baseUrl);
    }
  }, [apiUrl, loadPreferencesForUrl]);

  const handleApiUrlChange = (value: string) => {
    setApiUrl(value);
    if (status !== "checking") {
      setStatus("idle");
    }
  };

  const updatePreferenceDraft = (key: keyof PreferenceDraft, value: string) => {
    setPreferenceDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
    setPreferencesSaved(false);
  };

  const savePreferences = useCallback(async () => {
    const parsedDraft = parsePreferenceDraft(preferenceDraft);
    if (!parsedDraft) {
      setPreferencesError("Check preference values");
      return;
    }

    setPreferencesSaving(true);
    setPreferencesError(null);
    setPreferencesSaved(false);
    try {
      const normalizedUrl = await saveBackendBaseUrl(apiUrl);
      const savedPreferences = await updatePreferences(parsedDraft, normalizedUrl);
      setApiUrl(normalizedUrl);
      setPreferences(savedPreferences);
      setPreferenceDraft(toPreferenceDraft(savedPreferences));
      setPreferencesSaved(true);
    } catch (error) {
      if (error instanceof BackendApiError && error.errors.length > 0) {
        setPreferencesError(error.errors.join(", "));
      } else {
        setPreferencesError("Preferences update failed");
      }
    } finally {
      setPreferencesSaving(false);
    }
  }, [apiUrl, preferenceDraft]);

  const chooseAndImportRoster = useCallback(async () => {
    setImportError(null);
    const pickerResult = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: "application/pdf",
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      return;
    }

    const asset = pickerResult.assets[0];
    setImporting(true);
    try {
      const normalizedUrl = await saveBackendBaseUrl(apiUrl);
      const result = await importRosterPdf(
        {
          uri: asset.uri,
          name: asset.name ?? "roster.pdf",
          mimeType: asset.mimeType ?? "application/pdf",
          file: (asset as { file?: Blob }).file,
        },
        normalizedUrl
      );
      setApiUrl(normalizedUrl);
      setImportResult(result);
      setImportError(null);
    } catch (error) {
      if (error instanceof BackendApiError) {
        setImportError(error);
      } else {
        setImportError(new BackendApiError("Import failed"));
      }
    } finally {
      setImporting(false);
    }
  }, [apiUrl]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Roster import and backend</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleGroup}>
              <SlidersHorizontal color={Colors.light.tint} size={22} />
              <Text style={styles.panelTitle}>Preferences</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={preferencesLoading}
              onPress={() => loadPreferencesForUrl(apiUrl)}
              style={styles.iconButton}
            >
              <RefreshCw color={Colors.light.tint} size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Home Base</Text>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={3}
              onChangeText={(value) => updatePreferenceDraft("home_base_airport", value)}
              placeholder="AMS"
              placeholderTextColor={Colors.light.secondary}
              style={styles.input}
              value={preferenceDraft.home_base_airport}
            />
          </View>

          <View style={styles.twoColumnFields}>
            <PreferenceNumberInput
              label="AMS Walk"
              onChangeText={(value) => updatePreferenceDraft("ams_walking_buffer_minutes", value)}
              value={preferenceDraft.ams_walking_buffer_minutes}
            />
            <PreferenceNumberInput
              label="Home Commute"
              onChangeText={(value) => updatePreferenceDraft("home_commute_minutes", value)}
              value={preferenceDraft.home_commute_minutes}
            />
            <PreferenceNumberInput
              label="Useful Home"
              onChangeText={(value) => updatePreferenceDraft("minimum_useful_home_minutes", value)}
              value={preferenceDraft.minimum_useful_home_minutes}
            />
            <PreferenceNumberInput
              label="Change Limit"
              onChangeText={(value) => updatePreferenceDraft("material_change_threshold_minutes", value)}
              value={preferenceDraft.material_change_threshold_minutes}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={preferencesSaving}
            onPress={savePreferences}
            style={[styles.importButton, preferencesSaving && styles.buttonDisabled]}
          >
            <Save color="#fff" size={18} />
            <Text style={styles.primaryButtonText}>
              {preferencesSaving ? "Saving" : "Save Preferences"}
            </Text>
          </TouchableOpacity>

          {(preferencesError || preferencesSaved || preferences || preferencesLoading) && (
            <View style={styles.preferenceStatusRow}>
              {preferencesError ? (
                <AlertCircle color={Colors.light.danger} size={18} />
              ) : (
                <CheckCircle2 color={Colors.light.success} size={18} />
              )}
              <Text
                style={[
                  styles.preferenceStatusText,
                  preferencesError && { color: Colors.light.danger },
                ]}
              >
                {preferencesError ??
                  (preferencesLoading
                    ? "Loading preferences"
                    : preferencesSaved
                      ? "Preferences saved"
                      : preferences?.updated_at
                        ? "Preferences loaded"
                        : "Defaults loaded")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleGroup}>
              <Server color={Colors.light.tint} size={22} />
              <Text style={styles.panelTitle}>Backend</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusDetails.backgroundColor },
              ]}
            >
              <StatusIcon color={statusDetails.color} size={16} />
              <Text style={[styles.statusText, { color: statusDetails.color }]}>
                {statusDetails.label}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>API URL</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={handleApiUrlChange}
              placeholder="http://127.0.0.1:8010"
              placeholderTextColor={Colors.light.secondary}
              returnKeyType="done"
              style={styles.input}
              value={apiUrl}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={status === "checking"}
            onPress={checkConnection}
            style={[
              styles.checkButton,
              status === "checking" && styles.buttonDisabled,
            ]}
          >
            <RefreshCw color="#fff" size={18} />
            <Text style={styles.primaryButtonText}>
              {status === "checking" ? "Checking" : "Check"}
            </Text>
          </TouchableOpacity>

          {healthResult && (
            <View style={styles.resultRow}>
              {healthResult.ok ? (
                <CheckCircle2 color={Colors.light.success} size={18} />
              ) : (
                <AlertCircle color={Colors.light.danger} size={18} />
              )}
              <View style={styles.resultTextGroup}>
                <Text style={styles.resultMessage}>
                  {healthResult.message ?? "No response"}
                </Text>
                {checkedAtText && (
                  <Text style={styles.resultMeta}>Checked {checkedAtText}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleGroup}>
              <FileUp color={Colors.light.tint} size={22} />
              <Text style={styles.panelTitle}>Roster Import</Text>
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={importing}
            onPress={chooseAndImportRoster}
            style={[styles.importButton, importing && styles.buttonDisabled]}
          >
            <FileUp color="#fff" size={18} />
            <Text style={styles.primaryButtonText}>
              {importing ? "Importing" : "Import PDF"}
            </Text>
          </TouchableOpacity>

          {importError && (
            <View style={[styles.notice, styles.errorNotice]}>
              <AlertCircle color={Colors.light.danger} size={18} />
              <View style={styles.resultTextGroup}>
                <Text style={styles.resultMessage}>{importError.message}</Text>
                {importError.errors.map((error) => (
                  <Text key={error} style={styles.warningText}>
                    {error}
                  </Text>
                ))}
                {importError.warnings.map((warning) => (
                  <Text key={warning} style={styles.warningText}>
                    {warning}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {importResult && (
            <View style={styles.importSummary}>
              <View style={styles.summaryHeader}>
                <CheckCircle2 color={Colors.light.success} size={18} />
                <View style={styles.resultTextGroup}>
                  <Text style={styles.resultMessage}>Imported {importResult.source_filename}</Text>
                  <Text style={styles.resultMeta}>
                    {importResult.summary.roster_period.start} to{" "}
                    {importResult.summary.roster_period.end}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryGrid}>
                <SummaryMetric label="Days" value={importResult.summary.duty_days_parsed} />
                <SummaryMetric label="Flights" value={importResult.summary.flight_legs_parsed} />
                <SummaryMetric label="Hotels" value={importResult.summary.hotel_stays_parsed} />
                <SummaryMetric
                  label="Warnings"
                  value={importResult.summary.parser_warning_count ?? importResult.warnings.length}
                />
              </View>

              <View style={styles.changeRow}>
                <Text style={styles.changeText}>Inserted {importResult.summary.inserted_dates}</Text>
                <Text style={styles.changeText}>Updated {importResult.summary.updated_dates}</Text>
                <Text style={styles.changeText}>Unchanged {importResult.summary.unchanged_dates}</Text>
              </View>

              {importResult.warnings.length > 0 && (
                <View style={styles.warningBox}>
                  <AlertCircle color={Colors.light.warning} size={18} />
                  <View style={styles.resultTextGroup}>
                    <Text style={styles.warningTitle}>
                      {importResult.warnings.length} parser warning
                      {importResult.warnings.length === 1 ? "" : "s"}
                    </Text>
                    {importResult.warnings.slice(0, 4).map((warning) => (
                      <Text key={warning} style={styles.warningText}>
                        {warning}
                      </Text>
                    ))}
                    {importResult.warnings.length > 4 && (
                      <Text style={styles.warningText}>
                        +{importResult.warnings.length - 4} more
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.navigate("/")}
                style={styles.secondaryButton}
              >
                <CalendarDays color={Colors.light.tint} size={18} />
                <Text style={styles.secondaryButtonText}>View Schedule</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceNumberInput({
  label,
  onChangeText,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType="number-pad"
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={Colors.light.secondary}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const emptyPreferenceDraft: PreferenceDraft = {
  home_base_airport: "",
  ams_walking_buffer_minutes: "",
  home_commute_minutes: "",
  minimum_useful_home_minutes: "",
  material_change_threshold_minutes: "",
};

const toPreferenceDraft = (preferences: FlightLifePreferences): PreferenceDraft => ({
  home_base_airport: preferences.home_base_airport,
  ams_walking_buffer_minutes: String(preferences.ams_walking_buffer_minutes),
  home_commute_minutes: String(preferences.home_commute_minutes),
  minimum_useful_home_minutes: String(preferences.minimum_useful_home_minutes),
  material_change_threshold_minutes: String(preferences.material_change_threshold_minutes),
});

const parsePreferenceDraft = (draft: PreferenceDraft) => {
  const numericFields = {
    ams_walking_buffer_minutes: Number(draft.ams_walking_buffer_minutes),
    home_commute_minutes: Number(draft.home_commute_minutes),
    minimum_useful_home_minutes: Number(draft.minimum_useful_home_minutes),
    material_change_threshold_minutes: Number(draft.material_change_threshold_minutes),
  };

  if (
    draft.home_base_airport.trim().length !== 3 ||
    Object.values(numericFields).some((value) => !Number.isInteger(value) || value < 0)
  ) {
    return null;
  }

  return {
    home_base_airport: draft.home_base_airport.trim().toUpperCase(),
    ...numericFields,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    color: Colors.light.text,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.light.secondary,
    fontSize: 16,
  },
  panel: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  panelTitleGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  panelTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "700",
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.light.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconButton: {
    alignItems: "center",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  twoColumnFields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  numberField: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 132,
  },
  checkButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  importButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: Colors.light.tint,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: Colors.light.tint,
    fontSize: 15,
    fontWeight: "700",
  },
  resultRow: {
    alignItems: "flex-start",
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
  },
  resultTextGroup: {
    flex: 1,
  },
  resultMessage: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600",
  },
  resultMeta: {
    color: Colors.light.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  notice: {
    alignItems: "flex-start",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    padding: 12,
  },
  errorNotice: {
    backgroundColor: `${Colors.light.danger}12`,
    borderColor: `${Colors.light.danger}40`,
    borderWidth: 1,
  },
  importSummary: {
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    gap: 14,
    marginTop: 16,
    paddingTop: 14,
  },
  summaryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metric: {
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: "23%",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  metricValue: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  changeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  changeText: {
    backgroundColor: "#fff",
    borderRadius: 999,
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  warningBox: {
    alignItems: "flex-start",
    backgroundColor: `${Colors.light.warning}14`,
    borderColor: `${Colors.light.warning}50`,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  warningTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  warningText: {
    color: Colors.light.secondary,
    fontSize: 13,
    marginTop: 3,
  },
  preferenceStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  preferenceStatusText: {
    color: Colors.light.secondary,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
});
