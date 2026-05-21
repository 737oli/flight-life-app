import Colors from "@/constants/Colors";
import {
  fetchNextSevenDaysSchedule,
  fetchStayVsHomeDecision,
  overrideStayVsHomeDecision,
  ScheduleDay,
  StayVsHomeChoice,
  StayVsHomeDecision,
} from "@/services/backendApi";
import {
  choiceLabel,
  decisionReasoningItems,
  formatDisplayDate,
  isHomeBaseDecisionCandidateDay,
  recommendationLabel,
} from "@/services/decisionPresentation";
import { router, useFocusEffect } from "expo-router";
import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  FileUp,
  Home,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DecisionLoadState = "loading" | "ready" | "empty" | "error";

type DecisionCardModel = {
  day: ScheduleDay;
  decision: StayVsHomeDecision;
};

export default function DecisionsScreen() {
  const [cards, setCards] = useState<DecisionCardModel[]>([]);
  const [loadState, setLoadState] = useState<DecisionLoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingDecisionKey, setSavingDecisionKey] = useState<string | null>(null);
  const [pendingOverride, setPendingOverride] = useState<{
    choice: StayVsHomeChoice;
    decisionKey: string;
  } | null>(null);
  const [overrideErrors, setOverrideErrors] = useState<Record<string, string>>({});

  const loadDecisions = useCallback(async (asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoadState("loading");
    }

    try {
      const schedule = await fetchNextSevenDaysSchedule();
      if (schedule.status === "empty") {
        setCards([]);
        setLoadState("empty");
        setErrorMessage(null);
        return;
      }

      const decisionDays = schedule.days.filter((day) => isHomeBaseDecisionCandidateDay(day));
      const decisions = await Promise.all(
        decisionDays.map(async (day) => ({
          day,
          decision: await fetchStayVsHomeDecision(day.date),
        }))
      );

      setCards(decisions);
      setLoadState(decisions.length > 0 ? "ready" : "empty");
      setErrorMessage(null);
    } catch (error) {
      setCards([]);
      setLoadState("error");
      setErrorMessage(error instanceof Error ? error.message : "Decisions unavailable");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecisions();
    }, [loadDecisions])
  );

  const requestOverride = useCallback((decision: StayVsHomeDecision, choice: StayVsHomeChoice) => {
    setPendingOverride({ choice, decisionKey: decision.decision_key });
    setOverrideErrors((current) => {
      const next = { ...current };
      delete next[decision.decision_key];
      return next;
    });
  }, []);

  const cancelOverride = useCallback(() => {
    setPendingOverride(null);
  }, []);

  const confirmOverride = useCallback(async (decision: StayVsHomeDecision, choice: StayVsHomeChoice) => {
    setSavingDecisionKey(decision.decision_key);
    setOverrideErrors((current) => {
      const next = { ...current };
      delete next[decision.decision_key];
      return next;
    });

    try {
      const updatedDecision = await overrideStayVsHomeDecision(decision.decision_date, choice);
      setCards((currentCards) =>
        currentCards.map((card) =>
          card.decision.decision_key === updatedDecision.decision_key
            ? { ...card, decision: updatedDecision }
            : card
        )
      );
      setPendingOverride(null);
    } catch (error) {
      setOverrideErrors((current) => ({
        ...current,
        [decision.decision_key]:
          error instanceof Error ? error.message : "The backend did not save this choice.",
      }));
    } finally {
      setSavingDecisionKey(null);
    }
  }, []);

  const headerSubtitle = useMemo(() => {
    if (loadState === "ready") {
      return `${cards.length} decision${cards.length === 1 ? "" : "s"} in the next 7 days`;
    }
    return "Backend recommendations from your parsed roster";
  }, [cards.length, loadState]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadDecisions(true)} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Decisions</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>

        {loadState === "loading" ? (
          <StatePanel icon="loading" title="Loading decisions" />
        ) : loadState === "error" ? (
          <StatePanel
            detail={errorMessage ?? "Backend unavailable"}
            icon="error"
            title="Decisions unavailable"
          />
        ) : loadState === "empty" ? (
          <View style={styles.statePanel}>
            <FileUp color={Colors.light.tint} size={24} />
            <Text style={styles.stateTitle}>No AMS-ending decision days found</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.navigate("/settings" as never)}
              style={styles.primaryButton}
            >
              <FileUp color="#fff" size={18} />
              <Text style={styles.primaryButtonText}>Import Roster</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map((card) => (
            <DecisionCard
              card={card}
              isSaving={savingDecisionKey === card.decision.decision_key}
              key={card.decision.decision_key}
              onCancelOverride={cancelOverride}
              onConfirmOverride={confirmOverride}
              onRequestOverride={requestOverride}
              overrideError={overrideErrors[card.decision.decision_key] ?? null}
              pendingChoice={
                pendingOverride?.decisionKey === card.decision.decision_key
                  ? pendingOverride.choice
                  : null
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DecisionCard({
  card,
  isSaving,
  onCancelOverride,
  onConfirmOverride,
  onRequestOverride,
  overrideError,
  pendingChoice,
}: {
  card: DecisionCardModel;
  isSaving: boolean;
  onCancelOverride: () => void;
  onConfirmOverride: (decision: StayVsHomeDecision, choice: StayVsHomeChoice) => void;
  onRequestOverride: (decision: StayVsHomeDecision, choice: StayVsHomeChoice) => void;
  overrideError: string | null;
  pendingChoice: StayVsHomeChoice | null;
}) {
  const decision = card.decision;
  const displayChoice = decision.recommendation;
  const isNeedsReview = decision.state === "needs_review" || displayChoice === "needs_review";
  const Icon = displayChoice === "go_home" ? Home : Building;

  return (
    <View style={styles.decisionCard}>
      <View style={styles.decisionHeader}>
        <View style={styles.dateContainer}>
          <Clock color={Colors.light.secondary} size={16} />
          <Text style={styles.decisionDate}>{formatDisplayDate(card.day.date)}</Text>
        </View>
        <StatusBadge decision={decision} />
      </View>

      <View style={styles.recommendationContainer}>
        {isNeedsReview ? (
          <AlertCircle color={Colors.light.warning} size={24} />
        ) : (
          <Icon color={choiceColor(displayChoice)} size={24} />
        )}
        <Text
          style={[
            styles.recommendationText,
            { color: isNeedsReview ? Colors.light.warning : choiceColor(displayChoice) },
          ]}
        >
          {recommendationLabel(decision)}
        </Text>
      </View>

      <ReasoningList decision={decision} />

      {decision.manual_override && (
        <View style={styles.userChoiceContainer}>
          <Text style={styles.userChoiceLabel}>Your choice</Text>
          <Text style={[styles.userChoiceText, { color: choiceColor(decision.manual_override.choice) }]}>
            {choiceLabel(decision.manual_override.choice)}
          </Text>
          {decision.manual_override.status === "needs_review" && (
            <Text style={styles.reviewText}>Needs review after roster change</Text>
          )}
        </View>
      )}

      {overrideError && (
        <View style={styles.errorPanel}>
          <AlertCircle color={Colors.light.danger} size={16} />
          <Text style={styles.errorText}>{overrideError}</Text>
        </View>
      )}

      {pendingChoice ? (
        <View style={styles.confirmPanel}>
          <Text style={styles.confirmText}>{confirmationMessage(pendingChoice)}</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onCancelOverride}
              style={[styles.secondaryActionButton, isSaving && styles.disabledButton]}
            >
              <Text style={styles.secondaryActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => onConfirmOverride(decision, pendingChoice)}
              style={[styles.confirmActionButton, isSaving && styles.disabledButton]}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <CheckCircle color="#fff" size={17} />
              )}
              <Text style={styles.confirmActionText}>{isSaving ? "Saving" : "Confirm"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => onRequestOverride(decision, "go_home")}
            style={[styles.actionButton, styles.homeButton, isSaving && styles.disabledButton]}
          >
            <Home color="white" size={18} />
            <Text style={styles.actionButtonText}>Go Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => onRequestOverride(decision, "stay_outstation")}
            style={[styles.actionButton, styles.stayButton, isSaving && styles.disabledButton]}
          >
            <Building color="white" size={18} />
            <Text style={styles.actionButtonText}>Stay</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function StatusBadge({ decision }: { decision: StayVsHomeDecision }) {
  if (decision.state === "overridden") {
    return (
      <View style={styles.confirmedBadge}>
        <CheckCircle color={Colors.light.success} size={15} />
        <Text style={styles.confirmedBadgeText}>Overridden</Text>
      </View>
    );
  }

  if (decision.state === "needs_review") {
    return (
      <View style={styles.reviewBadge}>
        <AlertCircle color={Colors.light.warning} size={15} />
        <Text style={styles.reviewBadgeText}>Review</Text>
      </View>
    );
  }

  return (
    <View style={styles.recommendedBadge}>
      <CheckCircle color={Colors.light.tint} size={15} />
      <Text style={styles.recommendedBadgeText}>Recommended</Text>
    </View>
  );
}

function ReasoningList({ decision }: { decision: StayVsHomeDecision }) {
  const reasoningItems = decisionReasoningItems(decision);

  if (reasoningItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.reasoningContainer}>
      <Text style={styles.reasoningTitle}>Reasoning</Text>
      {reasoningItems.map((reason) => (
        <Text key={reason} style={styles.reasoningItem}>
          {reason}
        </Text>
      ))}
    </View>
  );
}

function StatePanel({
  detail,
  icon,
  title,
}: {
  detail?: string;
  icon: "loading" | "error";
  title: string;
}) {
  return (
    <View style={styles.statePanel}>
      {icon === "loading" ? (
        <ActivityIndicator color={Colors.light.tint} size="small" />
      ) : (
        <AlertCircle color={Colors.light.danger} size={24} />
      )}
      <Text style={styles.stateTitle}>{title}</Text>
      {detail && <Text style={styles.stateDetail}>{detail}</Text>}
    </View>
  );
}

const confirmationMessage = (choice: StayVsHomeChoice) =>
  choice === "go_home"
    ? "Save manual choice: go home for this duty?"
    : "Save manual choice: stay at outstation for this duty?";

const choiceColor = (choice: StayVsHomeDecision["recommendation"]) =>
  choice === "go_home" ? Colors.light.success : Colors.light.tint;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    flex: 1,
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
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.light.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  statePanel: {
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    margin: 20,
    padding: 24,
  },
  stateTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateDetail: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  decisionCard: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
  },
  decisionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateContainer: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  decisionDate: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "800",
  },
  confirmedBadge: {
    alignItems: "center",
    backgroundColor: `${Colors.light.success}20`,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confirmedBadgeText: {
    color: Colors.light.success,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewBadge: {
    alignItems: "center",
    backgroundColor: `${Colors.light.warning}20`,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewBadgeText: {
    color: Colors.light.warning,
    fontSize: 12,
    fontWeight: "800",
  },
  recommendedBadge: {
    alignItems: "center",
    backgroundColor: `${Colors.light.tint}16`,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedBadgeText: {
    color: Colors.light.tint,
    fontSize: 12,
    fontWeight: "800",
  },
  recommendationContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  reasoningContainer: {
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    marginBottom: 14,
    paddingTop: 12,
  },
  reasoningTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  reasoningItem: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 3,
  },
  userChoiceContainer: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  userChoiceLabel: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  userChoiceText: {
    fontSize: 16,
    fontWeight: "800",
  },
  reviewText: {
    color: Colors.light.warning,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  errorPanel: {
    alignItems: "center",
    backgroundColor: `${Colors.light.danger}12`,
    borderColor: `${Colors.light.danger}40`,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    padding: 10,
  },
  errorText: {
    color: Colors.light.danger,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  confirmPanel: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  confirmText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "800",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
  },
  homeButton: {
    backgroundColor: Colors.light.success,
  },
  stayButton: {
    backgroundColor: Colors.light.tint,
  },
  disabledButton: {
    opacity: 0.55,
  },
  secondaryActionButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  secondaryActionText: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "800",
  },
  confirmActionButton: {
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 42,
  },
  confirmActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  actionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
});
