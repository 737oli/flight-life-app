import Colors from "@/constants/Colors";
import {
  AiAdvisorResponse,
  fetchStayVsHomeAdvisor,
  StayVsHomeDecision,
  StayVsHomeRecommendation,
} from "@/services/backendApi";
import { recommendationLabel } from "@/services/decisionPresentation";
import { AlertCircle, BrainCircuit, CheckCircle, RefreshCw, Sparkles } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AdvisorState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; response: AiAdvisorResponse }
  | { status: "error"; message: string };

export function AiAdvisorPanel({ decision }: { decision: StayVsHomeDecision }) {
  const [advisorState, setAdvisorState] = React.useState<AdvisorState>({ status: "idle" });

  const analyze = React.useCallback(async () => {
    setAdvisorState({ status: "loading" });
    try {
      const response = await fetchStayVsHomeAdvisor(decision.decision_date);
      if (response.status === "ok" && response.advisor) {
        setAdvisorState({ status: "ready", response });
      } else {
        setAdvisorState({
          status: "error",
          message: unavailableMessage(response),
        });
      }
    } catch (error) {
      setAdvisorState({
        status: "error",
        message: error instanceof Error ? error.message : "AI advisor unavailable",
      });
    }
  }, [decision.decision_date]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <BrainCircuit color={Colors.light.tint} size={18} />
          <Text style={styles.title}>AI Advisor</Text>
        </View>
        {advisorState.status === "ready" && advisorState.response.cache_status === "hit" && (
          <View style={styles.cacheBadge}>
            <Text style={styles.cacheBadgeText}>Cached</Text>
          </View>
        )}
      </View>

      {advisorState.status === "idle" && (
        <TouchableOpacity accessibilityRole="button" onPress={analyze} style={styles.primaryButton}>
          <Sparkles color="#fff" size={17} />
          <Text style={styles.primaryButtonText}>Analyze with AI</Text>
        </TouchableOpacity>
      )}

      {advisorState.status === "loading" && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Colors.light.tint} size="small" />
          <Text style={styles.loadingText}>Analyzing decision context</Text>
        </View>
      )}

      {advisorState.status === "error" && (
        <View style={styles.errorPanel}>
          <AlertCircle color={Colors.light.warning} size={16} />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>{advisorState.message}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={analyze} style={styles.retryButton}>
              <RefreshCw color={Colors.light.tint} size={15} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {advisorState.status === "ready" && (
        <AdvisorResult response={advisorState.response} />
      )}
    </View>
  );
}

function AdvisorResult({ response }: { response: AiAdvisorResponse }) {
  const advisor = response.advisor;
  if (!advisor) {
    return null;
  }

  const disagrees = response.agreement === "disagrees";

  return (
    <View style={styles.resultContainer}>
      {disagrees && (
        <View style={styles.disagreementPanel}>
          <AlertCircle color={Colors.light.warning} size={16} />
          <Text style={styles.disagreementText}>AI disagrees with the rule result. Review manually.</Text>
        </View>
      )}

      <View style={styles.recommendationRow}>
        {disagrees ? (
          <AlertCircle color={Colors.light.warning} size={18} />
        ) : (
          <CheckCircle color={recommendationColor(advisor.recommendation)} size={18} />
        )}
        <Text style={[styles.recommendationText, { color: recommendationColor(advisor.recommendation) }]}>
          {advisorRecommendationLabel(advisor.recommendation)}
        </Text>
        <Text style={styles.confidenceText}>{advisor.confidence}</Text>
      </View>

      <Text style={styles.summaryText}>{advisor.summary}</Text>

      <AdvisorList title="Reasoning" items={advisor.reasoning_points} />
      <AdvisorList title="Risks" items={advisor.risks} />
      <AdvisorList title="Missing Inputs" items={advisor.missing_inputs} />
      <AdvisorList title="Facts Used" items={advisor.facts_used} />
    </View>
  );
}

function AdvisorList({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.listSection}>
      <Text style={styles.listTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={`${title}-${item}`} style={styles.listItem}>
          {item}
        </Text>
      ))}
    </View>
  );
}

function advisorRecommendationLabel(recommendation: StayVsHomeRecommendation) {
  if (recommendation === "needs_review") {
    return "Needs review";
  }
  return recommendationLabel({
    recommendation,
    state: "recommended",
    system_recommendation: recommendation,
  } as StayVsHomeDecision);
}

function recommendationColor(recommendation: StayVsHomeRecommendation) {
  if (recommendation === "needs_review") {
    return Colors.light.warning;
  }
  return recommendation === "go_home" ? Colors.light.success : Colors.light.tint;
}

function unavailableMessage(response: AiAdvisorResponse) {
  const firstWarning = response.warnings?.[0];
  if (firstWarning === "openai_api_key_missing") {
    return "AI advisor unavailable";
  }
  if (firstWarning === "ai_advisor_unavailable") {
    return "AI advisor unavailable";
  }
  return response.reason?.replace(/_/g, " ") || "AI advisor unavailable";
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "800",
  },
  cacheBadge: {
    backgroundColor: `${Colors.light.tint}14`,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cacheBadgeText: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "700",
  },
  errorPanel: {
    alignItems: "flex-start",
    backgroundColor: `${Colors.light.warning}12`,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  errorContent: {
    flex: 1,
    gap: 8,
  },
  errorTitle: {
    color: Colors.light.warning,
    fontSize: 14,
    fontWeight: "800",
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    minHeight: 30,
  },
  retryButtonText: {
    color: Colors.light.tint,
    fontSize: 13,
    fontWeight: "800",
  },
  resultContainer: {
    gap: 12,
  },
  disagreementPanel: {
    alignItems: "center",
    backgroundColor: `${Colors.light.warning}14`,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  disagreementText: {
    color: Colors.light.warning,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  recommendationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  confidenceText: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  listSection: {
    gap: 5,
  },
  listTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "800",
  },
  listItem: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
});
