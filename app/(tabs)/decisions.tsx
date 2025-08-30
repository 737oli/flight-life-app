// app/(tabs)/DecisionsScreen.tsx (or wherever you keep it)
import Colors from '@/constants/Colors';
import { Building, CheckCircle, Clock, Home } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface Decision {
  id: string;
  date: Date;
  type: 'stay_vs_home';
  recommendation: 'stay' | 'home';
  reasoning: string[];
  userChoice?: 'stay' | 'home';
  decidedAt?: Date;
}

export default function DecisionsScreen() {
  // 🔒 Local-only mock decisions (edit these freely)
  const [decisions, setDecisions] = useState<Decision[]>([
    {
      id: '1',
      date: new Date(),
      type: 'stay_vs_home',
      recommendation: 'stay',
      reasoning: [
        'You have a layover in London.',
        'The hotel is comfortable and close to the airport.',
        'Weather is expected to be good.',
      ],
      userChoice: 'stay',
      decidedAt: new Date(),
    },
    {
      id: '2',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      type: 'stay_vs_home',
      recommendation: 'home',
      reasoning: [
        'No early duty the next day.',
        'Weekend bias: prefer home.',
        'Traffic forecast looks mild.',
      ],
    },
  ]);

  // Sort by date (no external events involved)
  const decisionData = useMemo(
    () => [...decisions].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [decisions]
  );

  const handleDecision = (decisionId: string, choice: 'stay' | 'home') => {
    Alert.alert(
      'Confirm Decision',
      `Are you sure you want to ${choice === 'stay' ? 'stay at outstation' : 'go home'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            setDecisions(prev =>
              prev.map(d =>
                d.id === decisionId ? { ...d, userChoice: choice, decidedAt: new Date() } : d
              )
            ),
        },
      ]
    );
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const getRecommendationColor = (recommendation: 'stay' | 'home') =>
    recommendation === 'home' ? Colors.light.success : Colors.light.tint;

  const getRecommendationIcon = (recommendation: 'stay' | 'home') =>
    recommendation === 'home' ? Home : Building;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Stay vs Go Home</Text>
          <Text style={styles.subtitle}>Mock recommendations for UI testing</Text>
        </View>

        {decisionData.length > 0 ? (
          decisionData.map(decision => {
            const RecommendationIcon = getRecommendationIcon(decision.recommendation);
            const isDecided = !!decision.userChoice;

            return (
              <View key={decision.id} style={styles.decisionCard}>
                <View style={styles.decisionHeader}>
                  <View style={styles.dateContainer}>
                    <Clock color={Colors.light.secondary} size={16} />
                    <Text style={styles.decisionDate}>{formatDate(decision.date)}</Text>
                  </View>
                  {isDecided && (
                    <View style={styles.decidedBadge}>
                      <CheckCircle color={Colors.light.success} size={16} />
                      <Text style={styles.decidedText}>Decided</Text>
                    </View>
                  )}
                </View>

                <View style={styles.recommendationContainer}>
                  <RecommendationIcon
                    color={getRecommendationColor(decision.recommendation)}
                    size={24}
                  />
                  <Text
                    style={[
                      styles.recommendationText,
                      { color: getRecommendationColor(decision.recommendation) },
                    ]}
                  >
                    Recommended:{' '}
                    {decision.recommendation === 'home' ? 'Go Home' : 'Stay at Outstation'}
                  </Text>
                </View>

                <View style={styles.reasoningContainer}>
                  <Text style={styles.reasoningTitle}>Reasoning:</Text>
                  {decision.reasoning.map((reason, index) => (
                    <Text key={index} style={styles.reasoningItem}>
                      • {reason}
                    </Text>
                  ))}
                </View>

                {isDecided ? (
                  <View style={styles.userChoiceContainer}>
                    <Text style={styles.userChoiceLabel}>Your choice:</Text>
                    <Text
                      style={[
                        styles.userChoiceText,
                        {
                          color:
                            decision.userChoice === 'home'
                              ? Colors.light.success
                              : Colors.light.tint,
                        },
                      ]}
                    >
                      {decision.userChoice === 'home' ? '🏠 Go Home' : '🏢 Stay at Outstation'}
                    </Text>
                    {decision.decidedAt && (
                      <Text style={styles.decidedAtText}>
                        Decided on {decision.decidedAt.toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.actionContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.homeButton]}
                      onPress={() => handleDecision(decision.id, 'home')}
                    >
                      <Home color="white" size={20} />
                      <Text style={styles.actionButtonText}>Go Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.stayButton]}
                      onPress={() => handleDecision(decision.id, 'stay')}
                    >
                      <Building color="white" size={20} />
                      <Text style={styles.actionButtonText}>Stay</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No decisions needed</Text>
            <Text style={styles.emptySubtext}>
              We&apos;ll notify you when there are stay vs go-home decisions to make
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollView: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.light.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: Colors.light.secondary },
  decisionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  decisionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  decisionDate: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginLeft: 6 },
  decidedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  decidedText: { fontSize: 12, color: Colors.light.success, marginLeft: 4, fontWeight: '600' },
  recommendationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  recommendationText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  reasoningContainer: { marginBottom: 16 },
  reasoningTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 6 },
  reasoningItem: { fontSize: 14, color: Colors.light.secondary, lineHeight: 20, marginLeft: 8 },
  userChoiceContainer: { backgroundColor: Colors.light.background, borderRadius: 8, padding: 12 },
  userChoiceLabel: { fontSize: 12, color: Colors.light.secondary, marginBottom: 4 },
  userChoiceText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  decidedAtText: { fontSize: 12, color: Colors.light.secondary },
  actionContainer: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 8, gap: 8,
  },
  homeButton: { backgroundColor: Colors.light.success },
  stayButton: { backgroundColor: Colors.light.tint },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  emptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: Colors.light.secondary, textAlign: 'center' },
});
