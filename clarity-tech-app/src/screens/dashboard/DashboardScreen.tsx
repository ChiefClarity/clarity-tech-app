import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
// Haptics removed for web compatibility

import { Card } from '../../components/ui/Card';
import { Logo } from '../../components/common/Logo';
import { theme } from '../../styles/theme';
import { useAuth } from '../../hooks/useAuth';
import { DashboardScreenProps } from '../../types/navigation';
import { useApi } from '../../hooks/useApi';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { useOffline } from '../../hooks/useOffline';
import { DashboardStats, OnboardingData, OnboardingOffer } from '../../types';
import { onboardingService } from '../../services/api/onboarding';
import { OfferModal } from '../../components/dashboard/OfferModal';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card style={[styles.statCard, { borderTopColor: color }]} variant="elevated">
    <View style={styles.statIconContainer}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </Card>
);

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

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayOnboardings: 0,
    weekOnboardings: 0,
    pendingSync: 0,
    completedToday: 0,
  });
  const [recentOnboardings, setRecentOnboardings] = useState<OnboardingData[]>([]);
  const [offers, setOffers] = useState<OnboardingOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<OnboardingOffer | null>(null);

  const { execute: fetchDashboardData } = useApi({
    onSuccess: (data) => {
      // In a real app, you'd have an endpoint that returns dashboard data
      // For now, we'll simulate it
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Simulate loading dashboard data
    // In production, this would fetch from your API
    setStats({
      todayOnboardings: 2, // Only today's scheduled onboardings
      weekOnboardings: 8,
      pendingSync: 2,
      completedToday: 1,
    });

    // Mock offers based on route
    const mockOffers: OnboardingOffer[] = [
      {
        id: 'offer-1',
        customerName: 'John Smith',
        address: '123 Ocean Drive, Miami FL',
        poolSize: '15,000 gal',
        suggestedDay: 'Tuesday',
        routeProximity: '0.5 miles from route',
        nextAvailableDate: 'June 18',
        status: 'pending_acceptance'
      },
      {
        id: 'offer-2',
        customerName: 'Sarah Johnson',
        address: '456 Palm Ave, Miami FL',
        poolSize: '20,000 gal',
        suggestedDay: 'Thursday',
        routeProximity: '1.2 miles from route',
        nextAvailableDate: 'June 20',
        status: 'pending_acceptance'
      }
    ];
    setOffers(mockOffers);

    // Simulate recent onboardings
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
    // Haptic feedback not available on web
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleNewOnboarding = () => {
    navigation.navigate('NewOnboardingFlow');
  };

  const handleAcceptOffer = (offerId: string) => {
    setOffers(prev => prev.map(o => 
      o.id === offerId ? { ...o, status: 'accepted' } : o
    ));
    setStats(prev => ({ ...prev, todayOnboardings: prev.todayOnboardings + 1 }));
  };

  const handleDeclineOffer = (offerId: string) => {
    setOffers(prev => prev.map(o => 
      o.id === offerId ? { ...o, status: 'declined' } : o
    ));
  };

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
          <TouchableOpacity activeOpacity={0.7} onPress={() => offers.length > 0 && setSelectedOffer(offers[0])}>
            <Card style={[styles.statCard, { borderTopColor: theme.colors.primary }]} variant="elevated">
              <View style={styles.statIconContainer}>
                <Ionicons name="notifications" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{offers.filter(o => o.status === 'pending_acceptance').length}</Text>
              <Text style={styles.statTitle}>New Offers</Text>
            </Card>
          </TouchableOpacity>
          <StatCard
            title="Today's Onboardings"
            value={stats.todayOnboardings}
            icon="today"
            color={theme.colors.blueGreen}
          />
          <StatCard
            title="This Week"
            value={stats.weekOnboardings}
            icon="calendar"
            color={theme.colors.darkBlue}
          />
          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            icon="checkmark-circle"
            color={theme.colors.success}
          />
        </ScrollView>

        {/* Show pending offers if any */}
        {offers.filter(o => o.status === 'pending_acceptance').length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Offers</Text>
            </View>
            {offers.filter(o => o.status === 'pending_acceptance').map((offer) => (
              <TouchableOpacity
                key={offer.id}
                onPress={() => setSelectedOffer(offer)}
                activeOpacity={0.7}
              >
                <Card style={styles.offerCard} variant="outlined">
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>NEW</Text>
                  </View>
                  <Text style={styles.offerCustomerName}>{offer.customerName}</Text>
                  <Text style={styles.offerAddress}>{offer.address}</Text>
                  <View style={styles.offerDetails}>
                    <View style={styles.offerDetailItem}>
                      <Ionicons name="navigate" size={14} color={theme.colors.blueGreen} />
                      <Text style={styles.offerDetailText}>{offer.routeProximity}</Text>
                    </View>
                    <View style={styles.offerDetailItem}>
                      <Ionicons name="calendar" size={14} color={theme.colors.blueGreen} />
                      <Text style={styles.offerDetailText}>{offer.suggestedDay}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}

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
      </ScrollView>


      <OfferModal
        visible={!!selectedOffer}
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onAccept={handleAcceptOffer}
        onDecline={handleDeclineOffer}
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
  },
  statIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.darkBlue,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
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
    overflow: 'visible',
  },
  offerBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  offerBadgeText: {
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
});