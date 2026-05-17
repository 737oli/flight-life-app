import Colors from "@/constants/Colors";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
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
  BackendHealthResult,
  BackendHealthStatus,
  fetchBackendHealth,
  getBackendBaseUrl,
  normalizeBackendBaseUrl,
} from "@/services/backendApi";

type StatusDetails = {
  label: string;
  color: string;
  backgroundColor: string;
  icon: typeof Wifi;
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

  const statusDetails = statusDetailsByStatus[status];
  const StatusIcon = statusDetails.icon;

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
    const result = await fetchBackendHealth(normalizedUrl);
    setApiUrl(result.baseUrl);
    setHealthResult(result);
    setStatus(result.ok ? "online" : "offline");
  }, [apiUrl]);

  const handleApiUrlChange = (value: string) => {
    setApiUrl(value);
    if (status !== "checking") {
      setStatus("idle");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Backend connection</Text>
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
              placeholder="http://127.0.0.1:8000"
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
              status === "checking" && styles.checkButtonDisabled,
            ]}
          >
            <RefreshCw color="#fff" size={18} />
            <Text style={styles.checkButtonText}>
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
      </ScrollView>
    </SafeAreaView>
  );
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
  checkButtonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    color: "#fff",
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
});
