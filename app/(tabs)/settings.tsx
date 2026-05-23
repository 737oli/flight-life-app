import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileUp,
  RefreshCw,
  Save,
  Server,
  SlidersHorizontal,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  deleteRosterImportSourcePdf,
  fetchRosterImportHistory,
  RosterImportResponse,
  RosterImportHistoryItem,
  RosterImportHistoryResponse,
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

type TimestampMode = "local" | "utc";

const IMPORT_TIMESTAMP_MODE_STORAGE_KEY = "flightLife.importTimestampMode";

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
  const [importHistory, setImportHistory] = useState<RosterImportHistoryResponse | null>(null);
  const [importHistoryLoading, setImportHistoryLoading] = useState(false);
  const [importHistoryError, setImportHistoryError] = useState<string | null>(null);
  const [expandedImportIds, setExpandedImportIds] = useState<Record<number, boolean>>({});
  const [deletingImportId, setDeletingImportId] = useState<number | null>(null);
  const [timestampMode, setTimestampMode] = useState<TimestampMode>("local");

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

  const loadImportHistoryForUrl = useCallback(async (baseUrl: string) => {
    const normalizedUrl = normalizeBackendBaseUrl(baseUrl);
    if (!normalizedUrl) {
      return;
    }

    setImportHistoryLoading(true);
    setImportHistoryError(null);
    try {
      const history = await fetchRosterImportHistory({ baseUrl: normalizedUrl, limit: 10 });
      setImportHistory(history);
    } catch (error) {
      setImportHistoryError(error instanceof Error ? error.message : "Import history unavailable");
    } finally {
      setImportHistoryLoading(false);
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
      void loadImportHistoryForUrl(configuredUrl);
    });
    AsyncStorage.getItem(IMPORT_TIMESTAMP_MODE_STORAGE_KEY).then((storedMode) => {
      if (mounted && (storedMode === "local" || storedMode === "utc")) {
        setTimestampMode(storedMode);
      }
    });
    return () => {
      mounted = false;
    };
  }, [loadImportHistoryForUrl, loadPreferencesForUrl]);

  useFocusEffect(
    useCallback(() => {
      void loadImportHistoryForUrl(apiUrl);
    }, [apiUrl, loadImportHistoryForUrl])
  );

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
      void loadImportHistoryForUrl(result.baseUrl);
    }
  }, [apiUrl, loadImportHistoryForUrl, loadPreferencesForUrl]);

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

  const updateTimestampMode = useCallback((mode: TimestampMode) => {
    setTimestampMode(mode);
    void AsyncStorage.setItem(IMPORT_TIMESTAMP_MODE_STORAGE_KEY, mode);
  }, []);

  const toggleImportExpanded = useCallback((importId: number) => {
    setExpandedImportIds((current) => ({
      ...current,
      [importId]: !current[importId],
    }));
  }, []);

  const deleteSourcePdf = useCallback(async (importId: number) => {
    setDeletingImportId(importId);
    setImportHistoryError(null);
    try {
      const normalizedUrl = await saveBackendBaseUrl(apiUrl);
      await deleteRosterImportSourcePdf(importId, normalizedUrl);
      setApiUrl(normalizedUrl);
      await loadImportHistoryForUrl(normalizedUrl);
    } catch (error) {
      setImportHistoryError(error instanceof Error ? error.message : "Source PDF deletion failed");
    } finally {
      setDeletingImportId(null);
    }
  }, [apiUrl, loadImportHistoryForUrl]);

  const confirmDeleteSourcePdf = useCallback((importItem: RosterImportHistoryItem) => {
    Alert.alert(
      "Delete source PDF?",
      "Parsed roster data will remain. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteSourcePdf(importItem.id);
          },
        },
      ]
    );
  }, [deleteSourcePdf]);

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
      void loadImportHistoryForUrl(normalizedUrl);
    } catch (error) {
      if (error instanceof BackendApiError) {
        setImportError(error);
      } else {
        setImportError(new BackendApiError("Import failed"));
      }
    } finally {
      setImporting(false);
    }
  }, [apiUrl, loadImportHistoryForUrl]);

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
            <TouchableOpacity
              accessibilityRole="button"
              disabled={importHistoryLoading}
              onPress={() => loadImportHistoryForUrl(apiUrl)}
              style={styles.iconButton}
            >
              <RefreshCw color={Colors.light.tint} size={18} />
            </TouchableOpacity>
          </View>

          <TimestampModeControl mode={timestampMode} onChange={updateTimestampMode} />

          {importHistoryError && (
            <View style={[styles.notice, styles.warningNotice]}>
              <AlertCircle color={Colors.light.warning} size={18} />
              <View style={styles.resultTextGroup}>
                <Text style={styles.resultMessage}>Import history unavailable</Text>
                <Text style={styles.warningText}>{importHistoryError}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => loadImportHistoryForUrl(apiUrl)}
                  style={styles.inlineRetryButton}
                >
                  <RefreshCw color={Colors.light.tint} size={15} />
                  <Text style={styles.inlineRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {importHistoryLoading && !importHistory ? (
            <View style={styles.historyLoadingRow}>
              <ActivityIndicator color={Colors.light.tint} size="small" />
              <Text style={styles.resultMeta}>Loading import history</Text>
            </View>
          ) : (
            <CurrentRosterCard
              currentImport={importHistory?.current_import ?? null}
              deletingImportId={deletingImportId}
              hasPreservedDaysOutsidePeriod={Boolean(importHistory?.has_preserved_days_outside_current_period)}
              onDeleteSourcePdf={confirmDeleteSourcePdf}
              timestampMode={timestampMode}
            />
          )}

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

          {importHistory && importHistory.imports.length > 0 && (
            <View style={styles.importHistorySection}>
              <Text style={styles.sectionTitle}>Recent Imports</Text>
              {importHistory.imports.map((importItem) => (
                <ImportHistoryCard
                  deletingImportId={deletingImportId}
                  expanded={Boolean(expandedImportIds[importItem.id])}
                  importItem={importItem}
                  key={importItem.id}
                  onDeleteSourcePdf={confirmDeleteSourcePdf}
                  onToggleExpanded={toggleImportExpanded}
                  timestampMode={timestampMode}
                />
              ))}
            </View>
          )}

          {importHistory?.status === "empty" && (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.resultMessage}>No roster imported yet</Text>
              <Text style={styles.resultMeta}>Import a PDF to create the current roster baseline.</Text>
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

function TimestampModeControl({
  mode,
  onChange,
}: {
  mode: TimestampMode;
  onChange: (mode: TimestampMode) => void;
}) {
  return (
    <View style={styles.timestampModeRow}>
      <Text style={styles.label}>Import Times</Text>
      <View style={styles.segmentedControl}>
        <SegmentButton active={mode === "local"} label="Local" onPress={() => onChange("local")} />
        <SegmentButton active={mode === "utc"} label="UTC" onPress={() => onChange("utc")} />
      </View>
    </View>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CurrentRosterCard({
  currentImport,
  deletingImportId,
  hasPreservedDaysOutsidePeriod,
  onDeleteSourcePdf,
  timestampMode,
}: {
  currentImport: RosterImportHistoryItem | null;
  deletingImportId: number | null;
  hasPreservedDaysOutsidePeriod: boolean;
  onDeleteSourcePdf: (importItem: RosterImportHistoryItem) => void;
  timestampMode: TimestampMode;
}) {
  if (!currentImport) {
    return null;
  }

  return (
    <View style={styles.currentRosterCard}>
      <View style={styles.currentRosterHeader}>
        <View style={styles.resultTextGroup}>
          <Text style={styles.currentRosterEyebrow}>Current roster</Text>
          <Text style={styles.currentRosterTitle}>{currentImport.source_filename}</Text>
          <Text style={styles.resultMeta}>{formatImportTimestamp(currentImport.created_at, timestampMode)}</Text>
        </View>
        <SourcePdfPill importItem={currentImport} />
      </View>

      <Text style={styles.resultMeta}>{formatRosterPeriod(currentImport)}</Text>
      <ImportMetricGrid importItem={currentImport} />
      <ImportChangeRow importItem={currentImport} />

      {hasPreservedDaysOutsidePeriod && (
        <Text style={styles.quietNote}>Schedule may include preserved days outside this roster period.</Text>
      )}

      <View style={styles.currentRosterActions}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.navigate("/calendar" as never)}
          style={styles.secondaryButton}
        >
          <CalendarDays color={Colors.light.tint} size={18} />
          <Text style={styles.secondaryButtonText}>View Calendar</Text>
        </TouchableOpacity>
        {currentImport.source_pdf.can_delete && (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={deletingImportId === currentImport.id}
            onPress={() => onDeleteSourcePdf(currentImport)}
            style={styles.deleteButton}
          >
            <Trash2 color={Colors.light.danger} size={16} />
            <Text style={styles.deleteButtonText}>
              {deletingImportId === currentImport.id ? "Deleting" : "Delete Source PDF"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ImportHistoryCard({
  deletingImportId,
  expanded,
  importItem,
  onDeleteSourcePdf,
  onToggleExpanded,
  timestampMode,
}: {
  deletingImportId: number | null;
  expanded: boolean;
  importItem: RosterImportHistoryItem;
  onDeleteSourcePdf: (importItem: RosterImportHistoryItem) => void;
  onToggleExpanded: (importId: number) => void;
  timestampMode: TimestampMode;
}) {
  const ExpandIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <View style={styles.historyCard}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onToggleExpanded(importItem.id)}
        style={styles.historyCardHeader}
      >
        <View style={styles.resultTextGroup}>
          <Text style={styles.historyTitle}>{importItem.source_filename}</Text>
          <Text style={styles.resultMeta}>{formatImportTimestamp(importItem.created_at, timestampMode)}</Text>
          <Text style={styles.resultMeta}>{formatRosterPeriod(importItem)}</Text>
        </View>
        <ExpandIcon color={Colors.light.secondary} size={20} />
      </TouchableOpacity>

      <ImportMetricGrid importItem={importItem} compact />
      <ImportChangeRow importItem={importItem} />

      {expanded && (
        <View style={styles.historyDetail}>
          <SourcePdfStatus importItem={importItem} timestampMode={timestampMode} />
          <DetailLine label="Flight duties without legs" value={importItem.flight_duty_days_without_legs} />
          <DetailLine label="Decisions marked review" value={importItem.decisions_marked_needs_review} />
          <WarningPreview importItem={importItem} />
          {importItem.source_pdf.can_delete && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={deletingImportId === importItem.id}
              onPress={() => onDeleteSourcePdf(importItem)}
              style={styles.deleteButton}
            >
              <Trash2 color={Colors.light.danger} size={16} />
              <Text style={styles.deleteButtonText}>
                {deletingImportId === importItem.id ? "Deleting" : "Delete Source PDF"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function ImportMetricGrid({
  compact,
  importItem,
}: {
  compact?: boolean;
  importItem: RosterImportHistoryItem;
}) {
  return (
    <View style={styles.summaryGrid}>
      <SummaryMetric label="Days" value={importItem.duty_days_parsed} />
      <SummaryMetric label="Flights" value={importItem.flight_legs_parsed} />
      <SummaryMetric label="Warnings" value={importItem.parser_warning_count} />
      {!compact && <SummaryMetric label="No Legs" value={importItem.flight_duty_days_without_legs} />}
    </View>
  );
}

function ImportChangeRow({ importItem }: { importItem: RosterImportHistoryItem }) {
  return (
    <View style={styles.changeRow}>
      <Text style={styles.changeText}>Inserted {importItem.inserted_dates}</Text>
      <Text style={styles.changeText}>Updated {importItem.updated_dates}</Text>
      <Text style={styles.changeText}>Unchanged {importItem.unchanged_dates}</Text>
    </View>
  );
}

function SourcePdfPill({ importItem }: { importItem: RosterImportHistoryItem }) {
  return (
    <View style={[styles.sourcePdfPill, sourcePdfPillStyle(importItem)]}>
      <Text style={[styles.sourcePdfPillText, sourcePdfPillTextStyle(importItem)]}>
        {importItem.source_pdf.label}
      </Text>
    </View>
  );
}

function SourcePdfStatus({
  importItem,
  timestampMode,
}: {
  importItem: RosterImportHistoryItem;
  timestampMode: TimestampMode;
}) {
  return (
    <View style={styles.sourcePdfStatusRow}>
      <SourcePdfPill importItem={importItem} />
      {importItem.source_pdf.deleted_at && (
        <Text style={styles.resultMeta}>
          Deleted {formatImportTimestamp(importItem.source_pdf.deleted_at, timestampMode)}
        </Text>
      )}
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLineLabel}>{label}</Text>
      <Text style={styles.detailLineValue}>{value}</Text>
    </View>
  );
}

function WarningPreview({ importItem }: { importItem: RosterImportHistoryItem }) {
  if (importItem.warning_preview.length === 0) {
    return null;
  }

  return (
    <View style={styles.warningPreview}>
      <Text style={styles.warningTitle}>Parser warnings</Text>
      {importItem.warning_preview.map((warning) => (
        <Text key={warning} style={styles.warningText}>
          {formatWarning(warning)}
        </Text>
      ))}
      {importItem.remaining_warning_count > 0 && (
        <Text style={styles.warningText}>+{importItem.remaining_warning_count} more</Text>
      )}
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

function formatImportTimestamp(value: string | null, mode: TimestampMode) {
  const label = mode === "utc" ? "UTC" : "Local";
  if (!value) {
    return `Unknown ${label}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return `Unknown ${label}`;
  }

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  };

  if (mode === "utc") {
    options.timeZone = "UTC";
  }

  return `${parsedDate.toLocaleString([], options)} ${label}`;
}

function formatRosterPeriod(importItem: RosterImportHistoryItem) {
  if (!importItem.period_start || !importItem.period_end) {
    return "Roster period unknown";
  }

  return `${importItem.period_start} to ${importItem.period_end}`;
}

function formatWarning(warning: string) {
  return warning.replace(/_/g, " ");
}

function sourcePdfPillStyle(importItem: RosterImportHistoryItem) {
  if (importItem.source_pdf.state === "stored_locally") {
    return styles.sourcePdfPillStored;
  }

  if (importItem.source_pdf.state === "deleted") {
    return styles.sourcePdfPillDeleted;
  }

  return styles.sourcePdfPillNeutral;
}

function sourcePdfPillTextStyle(importItem: RosterImportHistoryItem) {
  if (importItem.source_pdf.state === "stored_locally") {
    return styles.sourcePdfPillStoredText;
  }

  if (importItem.source_pdf.state === "deleted") {
    return styles.sourcePdfPillDeletedText;
  }

  return styles.sourcePdfPillNeutralText;
}

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
  warningNotice: {
    backgroundColor: `${Colors.light.warning}12`,
    borderColor: `${Colors.light.warning}45`,
    borderWidth: 1,
  },
  inlineRetryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  inlineRetryText: {
    color: Colors.light.tint,
    fontSize: 13,
    fontWeight: "700",
  },
  historyLoadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  timestampModeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  segmentedControl: {
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 3,
  },
  segmentButton: {
    borderRadius: 6,
    minHeight: 32,
    minWidth: 64,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  segmentButtonText: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  segmentButtonTextActive: {
    color: "#fff",
  },
  currentRosterCard: {
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
    padding: 14,
  },
  currentRosterHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  currentRosterEyebrow: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  currentRosterTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "800",
  },
  quietNote: {
    color: Colors.light.secondary,
    fontSize: 13,
  },
  currentRosterActions: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  deleteButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: `${Colors.light.danger}50`,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: Colors.light.danger,
    fontSize: 14,
    fontWeight: "700",
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
  importHistorySection: {
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyHistoryBox: {
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  historyCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  historyTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "800",
  },
  historyDetail: {
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 10,
  },
  sourcePdfPill: {
    borderRadius: 999,
    flexShrink: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sourcePdfPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  sourcePdfPillStored: {
    backgroundColor: `${Colors.light.warning}16`,
  },
  sourcePdfPillStoredText: {
    color: Colors.light.warning,
  },
  sourcePdfPillDeleted: {
    backgroundColor: `${Colors.light.success}18`,
  },
  sourcePdfPillDeletedText: {
    color: Colors.light.success,
  },
  sourcePdfPillNeutral: {
    backgroundColor: Colors.light.border,
  },
  sourcePdfPillNeutralText: {
    color: Colors.light.secondary,
  },
  sourcePdfStatusRow: {
    alignItems: "flex-start",
    gap: 6,
  },
  detailLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLineLabel: {
    color: Colors.light.secondary,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  detailLineValue: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "800",
  },
  warningPreview: {
    backgroundColor: `${Colors.light.warning}10`,
    borderColor: `${Colors.light.warning}35`,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
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
