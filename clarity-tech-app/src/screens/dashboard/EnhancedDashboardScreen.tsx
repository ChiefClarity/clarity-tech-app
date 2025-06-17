import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

import { Card } from '../../components/ui/Card';
import { Logo } from '../../components/common/Logo';
import { theme } from '../../styles/theme';
import { useAuth } from '../../hooks/useAuth';
import { DashboardScreenProps } from '../../types/navigation';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { useOffline } from '../../hooks/useOffline';
import { DashboardStats, OnboardingData, Offer } from '../../types';
import { useOffers } from '../../contexts/OfferContext';
import { SimpleOfferModal } from '../../components/dashboard/SimpleOfferModal';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
  showBadge?: boolean;
  badgeCount?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  onPress, 
  showBadge, 
  badgeCount,
  loading 
}) => {
  const hookNavigation = useNavigation();
  console.log('🎯 [STATCARD] StatCard rendered, title:', title);
  console.log('🎯 [STATCARD] onPress provided:', !!onPress);
  console.log('🎯 [STATCARD] hookNavigation available:', !!hookNavigation);

  return (
  <TouchableOpacity 
    onPress={() => {
      console.log('🎯 [STATCARD] TouchableOpacity pressed, onPress:', !!onPress);
      if (onPress) {
        console.log('🎯 [STATCARD] Calling onPress function');
        onPress();
      } else {
        console.log('❌ [STATCARD] No onPress function provided');
      }
    }} 
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Card style={[
      styles.statCard, 
      { borderTopColor: color },
      onPress && styles.clickableCard
    ]} variant="elevated">
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color={color} />
        {showBadge && badgeCount && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.statValueContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Text style={styles.statValue}>{value}</Text>
        )}
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </Card>
  </TouchableOpacity>
  );
};

interface OnboardingItemProps {
  item: OnboardingData;
  onPress: () => void;
}

const OnboardingItem: React.FC<OnboardingItemProps> = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card style={styles.onboardingCard} variant="outlined">
      <View style={styles.onboardingHeader}>
        <View>
          <Text style={styles.customerName}>
            {item.customer.firstName} {item.customer.lastName}
          </Text>
          <Text style={styles.customerAddress}>{item.customer.address}</Text>
        </View>
        <View style={[styles.syncBadge, item.syncStatus === 'synced' ? styles.syncedBadge : styles.pendingBadge]}>
          <Ionicons 
            name={item.syncStatus === 'synced' ? 'checkmark-circle' : 'time-outline'} 
            size={16} 
            color={theme.colors.white} 
          />
          <Text style={styles.syncBadgeText}>
            {item.syncStatus === 'synced' ? 'Synced' : 'Pending'}
          </Text>
        </View>
      </View>
      <View style={styles.onboardingDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="water" size={16} color={theme.colors.gray} />
          <Text style={styles.detailText}>pH: {item.waterChemistry.ph}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="flask" size={16} color={theme.colors.gray} />
          <Text style={styles.detailText}>Chlorine: {item.waterChemistry.chlorine} ppm</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color={theme.colors.gray} />
          <Text style={styles.detailText}>{format(new Date(item.createdAt), 'h:mm a')}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

interface OfferItemProps {
  offer: Offer;
  onPress: () => void;
  canUndo?: boolean;
  timeRemaining?: string;
}

const OfferItem: React.FC<OfferItemProps> = ({ offer, onPress, canUndo, timeRemaining }) => {
  const { getOfferStatus } = useOffers();
  const status = getOfferStatus(offer.id);
  
  const getStatusColor = () => {
    switch (status) {
      case 'accepted': return theme.colors.success;
      case 'declined': return theme.colors.error;
      case 'expired': return theme.colors.gray;
      default: return theme.colors.warning;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'accepted': return 'checkmark-circle';
      case 'declined': return 'close-circle';
      case 'expired': return 'time-outline';
      default: return 'notifications';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.offerCard} variant="outlined">
        <View style={styles.offerHeader}>
          <View style={styles.offerBadge}>
            <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
            <Text style={[styles.offerBadgeText, { color: getStatusColor() }]}>
              {status?.toUpperCase()}
            </Text>
          </View>
          {canUndo && (
            <View style={styles.undoBadge}>
              <Text style={styles.undoBadgeText}>UNDO: {timeRemaining}</Text>
            </View>
          )}
        </View>
        <Text style={styles.offerCustomerName}>{offer.customerName}</Text>
        <Text style={styles.offerAddress}>{offer.address}</Text>
        <View style={styles.offerDetails}>
          <View style={styles.offerDetailItem}>
            <Ionicons name="navigate" size={14} color={theme.colors.blueGreen} />
            <Text style={styles.offerDetailText}>{offer.routeProximity} mi</Text>
          </View>
          <View style={styles.offerDetailItem}>
            <Ionicons name="calendar" size={14} color={theme.colors.blueGreen} />
            <Text style={styles.offerDetailText}>{offer.suggestedDay}</Text>
          </View>
          {status === 'pending' && (
            <View style={styles.offerDetailItem}>
              <Ionicons name="time" size={14} color={theme.colors.error} />
              <Text style={styles.offerDetailText}>
                {Math.ceil((offer.expiresAt.getTime() - Date.now()) / 60000)}m left
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export const EnhancedDashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  console.log('🏠 [DASHBOARD] Navigation prop:', navigation);
  console.log('🏠 [DASHBOARD] Navigation type:', typeof navigation);
  console.log('🏠 [DASHBOARD] Navigation.navigate exists:', !!navigation?.navigate);
  
  // Use hook navigation as backup
  const hookNavigation = useNavigation();
  console.log('🏠 [DASHBOARD] Hook navigation:', hookNavigation);
  console.log('🏠 [DASHBOARD] Hook navigation.navigate exists:', !!hookNavigation?.navigate);
  
  // Create a reliable navigation function
  const navigateToAcceptedOnboardings = () => {
    console.log('🚀 [DASHBOARD] navigateToAcceptedOnboardings called');
    try {
      if (navigation && navigation.navigate) {
        console.log('🚀 [DASHBOARD] Using prop navigation');
        navigation.navigate('AcceptedOnboardings');
      } else if (hookNavigation && hookNavigation.navigate) {
        console.log('🚀 [DASHBOARD] Using hook navigation');
        hookNavigation.navigate('AcceptedOnboardings' as never);
      } else {
        console.error('❌ [DASHBOARD] No navigation available');
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Navigation error:', error);
    }
  };
  
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { 
    pendingOffers, 
    acceptedOffers, 
    hasPendingSync, 
    canUndoAccept,
    checkExpiredOffers,
    retrySyncQueue,
    offers,
    offerStatuses,
    addOffer 
  } = useOffers();
  
  console.log(`🏠 [DASHBOARD] Rendering with:`, {
    pendingOffersCount: pendingOffers.length,
    acceptedOffersCount: acceptedOffers.length,
    totalOffers: offers.size,
    hasPendingSync,
    isOffline,
  });
  
  // Debug: Log offer statuses
  console.log(`🏠 [DASHBOARD] Offer statuses:`, Array.from(offerStatuses.entries()));
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayOnboardings: 0,
    weekOnboardings: 0,
    pendingSync: 0,
    completedToday: 0,
  });
  const [recentOnboardings, setRecentOnboardings] = useState<OnboardingData[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Add mock offers for testing if none exist
    if (offers.size === 0) {
      console.log(`🏠 [DASHBOARD] No offers found, adding mock offers for testing`);
      addMockOffersForTesting();
    }
  }, []);
  
  const addMockOffersForTesting = async () => {
    try {
      const { addMockOffersToContext } = await import('../../utils/mockOffers');
      await addMockOffersToContext(addOffer);
      console.log(`🏠 [DASHBOARD] Mock offers added successfully`);
    } catch (error) {
      console.error(`❌ [DASHBOARD] Failed to add mock offers:`, error);
    }
  };

  // Check for expired offers periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredOffers();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkExpiredOffers]);

  // Retry sync when coming back online
  useEffect(() => {
    if (!isOffline && hasPendingSync) {
      const timer = setTimeout(() => {
        retrySyncQueue();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, hasPendingSync, retrySyncQueue]);

  const loadDashboardData = async () => {
    // Simulate loading dashboard data
    setStats({
      todayOnboardings: acceptedOffers.filter(offer => {
        const today = new Date();
        return offer.nextAvailableDate.toDateString() === today.toDateString();
      }).length,
      weekOnboardings: acceptedOffers.length,
      pendingSync: hasPendingSync ? 1 : 0,
      completedToday: 1,
    });

    // Mock recent onboardings (from Poolbrain)
    setRecentOnboardings([
      {
        customerId: '1',
        customer: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          phone: '555-0123',
          address: '123 Pool Lane',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85001',
        },
        waterChemistry: {
          chlorine: 2.5,
          ph: 7.4,
          alkalinity: 80,
          cyanuricAcid: 40,
        },
        equipment: [],
        poolDetails: {
          type: 'inground',
          shape: 'rectangle',
          length: 30,
          width: 15,
          avgDepth: 5,
          deepEndDepth: 8,
          shallowEndDepth: 3,
          volume: 20000,
          surfaceMaterial: 'plaster',
          surfaceCondition: 'good',
          surfaceStains: false,
          features: ['lighting', 'waterfall'],
          environment: {
            nearbyTrees: true,
            treeType: 'Palm',
            deckMaterial: 'Concrete',
            fenceType: 'Iron',
          },
        },
        photos: [],
        createdAt: new Date().toISOString(),
        syncStatus: 'synced',
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    await checkExpiredOffers();
    setRefreshing(false);
  };

  const handleNewOnboarding = () => {
    navigation.navigate('NewOnboardingFlow');
  };

  // Get recently accepted offers that can be undone
  const recentAcceptedWithUndo = acceptedOffers.filter(offer => canUndoAccept(offer.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineIndicator isOffline={isOffline} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.blueGreen}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Logo size="small" variant="dark" />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
              <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Today's Overview</Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <StatCard
            title="New Offers"
            value={pendingOffers.length}
            icon="notifications"
            color={theme.colors.primary}
            onPress={() => pendingOffers.length > 0 && setSelectedOffer(pendingOffers[0])}
            showBadge={pendingOffers.length > 0}
            badgeCount={pendingOffers.length}
          />
          <StatCard
            title="Today's Onboardings"
            value={stats.todayOnboardings}
            icon="today"
            color={theme.colors.blueGreen}
            onPress={() => {
              console.log('📊 [STATCARD] Today\'s Onboardings clicked');
              navigateToAcceptedOnboardings();
            }}
          />
          <StatCard
            title="This Week"
            value={stats.weekOnboardings}
            icon="calendar"
            color={theme.colors.darkBlue}
            onPress={() => {
              console.log('📊 [STATCARD] This Week clicked');
              navigateToAcceptedOnboardings();
            }}
          />
          <StatCard
            title="Accepted"
            value={acceptedOffers.length}
            icon="checkmark-circle"
            color={theme.colors.success}
            onPress={() => {
              console.log('📊 [STATCARD] Accepted clicked');
              navigateToAcceptedOnboardings();
            }}
            showBadge={acceptedOffers.length > 0}
            badgeCount={acceptedOffers.length}
          />
        </ScrollView>

        {/* Pending Offers Section */}
        {pendingOffers.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Offers</Text>
              <View style={styles.expirationIndicator}>
                <Ionicons name="time" size={16} color={theme.colors.error} />
                <Text style={styles.expirationText}>Auto-expire in 30min</Text>
              </View>
            </View>
            {pendingOffers.map((offer) => (
              <OfferItem
                key={offer.id}
                offer={offer}
                onPress={() => {
                  console.log(`🏠 [DASHBOARD] Offer item clicked, setting selected offer:`, offer.id);
                  setSelectedOffer(offer);
                }}
              />
            ))}
          </>
        )}

        {/* Recent Acceptances with Undo */}
        {recentAcceptedWithUndo.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Acceptances</Text>
              <View style={styles.undoIndicator}>
                <Ionicons name="refresh" size={16} color={theme.colors.warning} />
                <Text style={styles.undoText}>Undo available</Text>
              </View>
            </View>
            {recentAcceptedWithUndo.map((offer) => (
              <OfferItem
                key={offer.id}
                offer={offer}
                onPress={() => setSelectedOffer(offer)}
                canUndo={true}
                timeRemaining="1:30" // This would be calculated in real implementation
              />
            ))}
          </>
        )}

        {/* Today's Scheduled Onboardings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Scheduled Onboardings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('OnboardingsList')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentOnboardings.map((item, index) => (
          <OnboardingItem
            key={item.customerId || index}
            item={item}
            onPress={() => navigation.navigate('OnboardingDetail', { id: item.customerId })}
          />
        ))}

        {/* Sync Status */}
        {hasPendingSync && (
          <Card style={styles.syncStatusCard} variant="outlined">
            <View style={styles.syncStatusHeader}>
              <ActivityIndicator size="small" color={theme.colors.warning} />
              <Text style={styles.syncStatusTitle}>Syncing Changes</Text>
            </View>
            <Text style={styles.syncStatusText}>
              Your recent actions are being synced to Poolbrain
            </Text>
          </Card>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fabContainer}
        onPress={handleNewOnboarding}
        activeOpacity={0.8}
      >
        <View style={styles.fab}>
          <Ionicons name="add" size={28} color={theme.colors.white} />
        </View>
      </TouchableOpacity>

      <SimpleOfferModal
        visible={!!selectedOffer}
        offer={selectedOffer}
        onClose={() => {
          console.log(`🏠 [DASHBOARD] Modal closing, clearing selected offer`);
          setSelectedOffer(null);
        }}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.darkBlue,
  },
  date: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginTop: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.blueGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.blueGreen,
    fontWeight: '600',
  },
  expirationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    marginLeft: 4,
    fontWeight: '500',
  },
  undoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
  statsContainer: {
    paddingLeft: theme.spacing.lg,
  },
  statsContent: {
    paddingRight: theme.spacing.lg,
  },
  statCard: {
    width: 120,
    marginRight: theme.spacing.md,
    borderTopWidth: 3,
    position: 'relative',
  },
  clickableCard: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.2,
  },
  statIconContainer: {
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  statValueContainer: {
    height: 32,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.darkBlue,
  },
  statTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginTop: 4,
  },
  onboardingCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  onboardingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  customerName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
  customerAddress: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  syncedBadge: {
    backgroundColor: theme.colors.success,
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning,
  },
  syncBadgeText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.white,
    marginLeft: 4,
    fontWeight: '600',
  },
  onboardingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginLeft: 4,
  },
  offerCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundLight,
  },
  offerBadgeText: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '700',
    marginLeft: 4,
  },
  undoBadge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  undoBadgeText: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '700',
    color: theme.colors.white,
  },
  offerCustomerName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: 4,
  },
  offerAddress: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.sm,
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  offerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerDetailText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.blueGreen,
    marginLeft: 4,
    fontWeight: '500',
  },
  syncStatusCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.warning + '10',
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  syncStatusTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
  },
  syncStatusText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.warning,
  },
  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl * 2,
    right: theme.spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.blueGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
});