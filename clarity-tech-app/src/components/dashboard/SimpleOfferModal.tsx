import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { Offer } from '../../types';
import { Card } from '../ui/Card';
import { GradientButton } from '../ui/GradientButton';
import { useOffers } from '../../contexts/OfferContext';

interface SimpleOfferModalProps {
  visible: boolean;
  offer: Offer | null;
  onClose: () => void;
}

export const SimpleOfferModal: React.FC<SimpleOfferModalProps> = ({
  visible,
  offer,
  onClose,
}) => {
  const { 
    acceptOffer, 
    declineOffer,
    getOfferStatus,
    hasPendingSync 
  } = useOffers();
  
  const [loading, setLoading] = useState(false);

  console.log(`🔧 [SIMPLE MODAL] Rendering with offer:`, offer?.id, `visible:`, visible);

  if (!offer) return null;

  const offerStatus = getOfferStatus(offer.id);

  console.log(`🔧 [SIMPLE MODAL] Offer status:`, offerStatus);

  const handleAccept = async () => {
    console.log(`🔘 [SIMPLE MODAL] Accept button clicked for offer: ${offer?.id}`);
    
    if (!offer) {
      console.error(`❌ [SIMPLE MODAL] No offer available for acceptance`);
      return;
    }
    
    console.log(`🔘 [SIMPLE MODAL] Setting loading state to true`);
    setLoading(true);
    
    try {
      console.log(`🔘 [SIMPLE MODAL] Calling acceptOffer context method`);
      await acceptOffer(offer.id);
      console.log(`✅ [SIMPLE MODAL] acceptOffer completed successfully`);
      
      console.log(`🔘 [SIMPLE MODAL] Showing success alert`);
      Alert.alert(
        'Offer Accepted!',
        `Onboarding scheduled for ${offer.suggestedDay}, ${offer.nextAvailableDate.toLocaleDateString()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log(`🔘 [SIMPLE MODAL] Alert OK pressed, closing modal`);
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error(`❌ [SIMPLE MODAL] Error accepting offer:`, error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to accept offer'
      );
    } finally {
      console.log(`🔘 [SIMPLE MODAL] Setting loading state to false`);
      setLoading(false);
    }
  };

  const handleDecline = () => {
    console.log(`🔘 [SIMPLE MODAL] Decline button clicked for offer: ${offer?.id}`);
    
    if (!offer) return;

    Alert.alert(
      'Decline Offer',
      'Are you sure you want to decline this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await declineOffer(offer.id);
              onClose();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to decline offer'
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const isExpired = offerStatus === 'expired' || new Date() > offer.expiresAt;
  const isAccepted = offerStatus === 'accepted';
  const isDeclined = offerStatus === 'declined';
  const isPending = offerStatus === 'pending' && !isExpired;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Onboarding Offer</Text>
            <View style={styles.headerRight}>
              {hasPendingSync && (
                <View style={styles.syncIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.warning} />
                  <Text style={styles.syncText}>Syncing...</Text>
                </View>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.gray} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Banner */}
            <View style={[styles.statusBanner, { 
              backgroundColor: isPending ? theme.colors.warning + '20' : 
                             isAccepted ? theme.colors.success + '20' :
                             isDeclined ? theme.colors.error + '20' : 
                             theme.colors.gray + '20'
            }]}>
              <Text style={[styles.statusText, { 
                color: isPending ? theme.colors.warning : 
                       isAccepted ? theme.colors.success :
                       isDeclined ? theme.colors.error : 
                       theme.colors.gray
              }]}>
                {isPending ? 'PENDING' : 
                 isAccepted ? 'ACCEPTED' :
                 isDeclined ? 'DECLINED' : 
                 'EXPIRED'}
              </Text>
            </View>

            {/* Customer Information */}
            <Card style={styles.customerCard} variant="outlined">
              <Text style={styles.customerName}>{offer.customerName}</Text>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color={theme.colors.gray} />
                <Text style={styles.detailText}>{offer.address}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="water" size={16} color={theme.colors.gray} />
                <Text style={styles.detailText}>Pool Size: {offer.poolSize}</Text>
              </View>
            </Card>

            {/* Route Information */}
            <Card style={styles.routeCard} variant="elevated">
              <View style={styles.routeHeader}>
                <Ionicons name="navigate" size={20} color={theme.colors.blueGreen} />
                <Text style={styles.routeTitle}>Route Information</Text>
              </View>
              <Text style={styles.routeProximity}>
                This customer is {offer.routeProximity} miles from your route
              </Text>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Suggested Day:</Text>
                <Text style={styles.scheduleValue}>{offer.suggestedDay}</Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Next Available:</Text>
                <Text style={styles.scheduleValue}>
                  {offer.nextAvailableDate.toLocaleDateString()}
                </Text>
              </View>
            </Card>

            {/* Notice */}
            <View style={styles.noticeCard}>
              <Ionicons name="information-circle" size={20} color={theme.colors.info} />
              <Text style={styles.noticeText}>
                Accepting this offer will add the onboarding to your Poolbrain schedule
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {isPending && (
              <>
                <GradientButton
                  title="Decline"
                  onPress={handleDecline}
                  variant="outline"
                  style={styles.declineButton}
                  disabled={loading}
                />
                <GradientButton
                  title="Accept"
                  onPress={handleAccept}
                  loading={loading}
                  style={styles.acceptButton}
                />
              </>
            )}
            
            {(isAccepted || isDeclined || isExpired) && (
              <GradientButton
                title="Close"
                onPress={onClose}
                style={styles.fullWidthButton}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.darkBlue,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  syncText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.warning,
    marginLeft: theme.spacing.xs,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  statusBanner: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
  },
  customerCard: {
    marginBottom: theme.spacing.md,
  },
  customerName: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginLeft: theme.spacing.sm,
  },
  routeCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  routeTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.sm,
  },
  routeProximity: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
  },
  scheduleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  scheduleLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
  },
  scheduleValue: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.info + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.info,
    marginLeft: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  declineButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  acceptButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  fullWidthButton: {
    flex: 1,
  },
});