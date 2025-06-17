import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

import { Card } from '../../components/ui/Card';
import { GradientButton } from '../../components/ui/GradientButton';
import { theme } from '../../styles/theme';
import { useOffers } from '../../contexts/OfferContext';
import { Offer } from '../../types';

interface AcceptedOnboardingsScreenProps {}

interface AcceptedOfferItemProps {
  offer: Offer;
  onStartOnboarding: (offer: Offer) => void;
  canUndo: boolean;
  onUndo: (offerId: string) => void;
}

const AcceptedOfferItem: React.FC<AcceptedOfferItemProps> = ({ 
  offer, 
  onStartOnboarding, 
  canUndo,
  onUndo 
}) => {
  const [loading, setLoading] = useState(false);

  const handleStartOnboarding = async () => {
    setLoading(true);
    try {
      await onStartOnboarding(offer);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    Alert.alert(
      'Undo Acceptance',
      'Are you sure you want to undo accepting this onboarding?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => onUndo(offer.id)
        }
      ]
    );
  };

  return (
    <Card style={styles.offerCard} variant="outlined">
      <View style={styles.offerHeader}>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={styles.statusText}>ACCEPTED</Text>
        </View>
        {canUndo && (
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>UNDO</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.customerName}>{offer.customerName}</Text>
      <Text style={styles.customerAddress}>{offer.address}</Text>

      <View style={styles.offerDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="water" size={16} color={theme.colors.blueGreen} />
          <Text style={styles.detailText}>Pool Size: {offer.poolSize}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="navigate" size={16} color={theme.colors.blueGreen} />
          <Text style={styles.detailText}>{offer.routeProximity} miles from route</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={theme.colors.blueGreen} />
          <Text style={styles.detailText}>{offer.suggestedDay}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={theme.colors.blueGreen} />
          <Text style={styles.detailText}>
            Scheduled: {format(offer.nextAvailableDate, 'MMM d, yyyy')}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <GradientButton
          title="Start Onboarding"
          onPress={handleStartOnboarding}
          loading={loading}
          style={styles.startButton}
          icon={<Ionicons name="play-outline" size={16} color={theme.colors.white} />}
        />
      </View>
    </Card>
  );
};

export const AcceptedOnboardingsScreen: React.FC<AcceptedOnboardingsScreenProps> = () => {
  const navigation = useNavigation();
  const { acceptedOffers, canUndoAccept, undoAccept } = useOffers();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // [API-INTEGRATION: Scheduling - Needs backend first]
    // TODO: Fetch latest accepted onboardings from scheduling API
    // await schedulingApi.getTechnicianSchedule(user.id, { status: ['scheduled'] });
    
    // For now, just simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleStartOnboarding = async (offer: Offer) => {
    console.log(`🚀 [ONBOARDING] Starting onboarding for:`, offer.customerName);
    
    // [API-INTEGRATION: Scheduling - Needs backend first]
    // TODO: Update service status to 'in_progress' in scheduling API
    // await schedulingApi.updateServiceStatus(serviceId, { 
    //   status: 'in_progress',
    //   actualStartTime: new Date().toISOString()
    // });
    
    // Navigate to new onboarding flow with offer context
    navigation.navigate('NewOnboardingFlow', { 
      offerId: offer.id,
      customerId: offer.customerId,
      customerName: offer.customerName,
      customerAddress: offer.address
    });
  };

  const handleUndo = async (offerId: string) => {
    try {
      const success = await undoAccept(offerId);
      if (success) {
        Alert.alert(
          'Success', 
          'Onboarding acceptance has been undone. The offer is now available for other technicians.'
        );
      } else {
        Alert.alert(
          'Unable to Undo', 
          'The time limit for undoing this acceptance has expired.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error', 
        'Failed to undo the acceptance. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.darkBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accepted Onboardings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.blueGreen}
          />
        }
      >
        {acceptedOffers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.gray} />
            <Text style={styles.emptyTitle}>No Accepted Onboardings</Text>
            <Text style={styles.emptyText}>
              Accept offers from the dashboard to see them here
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Card style={styles.statsCard} variant="elevated">
                <Text style={styles.statsNumber}>{acceptedOffers.length}</Text>
                <Text style={styles.statsLabel}>Total Accepted</Text>
              </Card>
              <Card style={styles.statsCard} variant="elevated">
                <Text style={styles.statsNumber}>
                  {acceptedOffers.filter(offer => canUndoAccept(offer.id)).length}
                </Text>
                <Text style={styles.statsLabel}>Can Undo</Text>
              </Card>
            </View>

            <Text style={styles.sectionTitle}>Ready to Start</Text>
            
            {acceptedOffers.map((offer) => (
              <AcceptedOfferItem
                key={offer.id}
                offer={offer}
                onStartOnboarding={handleStartOnboarding}
                canUndo={canUndoAccept(offer.id)}
                onUndo={handleUndo}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.darkBlue,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  headerRight: {
    width: 32, // Same as back button for balance
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.blueGreen,
    marginBottom: theme.spacing.xs,
  },
  statsLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
  },
  offerCard: {
    marginBottom: theme.spacing.lg,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '700',
    color: theme.colors.success,
    marginLeft: 4,
  },
  undoButton: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  undoButtonText: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '700',
    color: theme.colors.white,
  },
  customerName: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.md,
  },
  offerDetails: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.sm,
  },
  actionContainer: {
    alignItems: 'stretch',
  },
  startButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 3,
  },
  emptyTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.darkBlue,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});