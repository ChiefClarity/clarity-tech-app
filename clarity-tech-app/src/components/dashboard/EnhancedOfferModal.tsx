import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useCountdownTimer } from '../../hooks/useCountdownTimer';

interface EnhancedOfferModalProps {
  visible: boolean;
  offer: Offer | null;
  onClose: () => void;
}

export const EnhancedOfferModal: React.FC<EnhancedOfferModalProps> = ({
  visible,
  offer,
  onClose,
}) => {
  const { 
    acceptOffer, 
    declineOffer, 
    undoAccept, 
    canUndoAccept,
    getOfferStatus,
    hasPendingSync 
  } = useOffers();
  
  const [loading, setLoading] = useState(false);

  if (!offer) return null;

  const offerStatus = useMemo(() => getOfferStatus(offer.id), [getOfferStatus, offer.id]);
  const canUndo = useMemo(() => canUndoAccept(offer.id), [canUndoAccept, offer.id]);

  // Calculate initial time for offer expiration
  const expirationMinutes = useMemo(() => {
    if (!offer?.expiresAt) return 0;
    const timeLeft = new Date(offer.expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.floor(timeLeft / (1000 * 60)));
  }, [offer?.expiresAt]);

  // Offer expiration timer
  const expirationTimer = useCountdownTimer({
    initialMinutes: expirationMinutes,
    autoStart: visible && offerStatus === 'pending',
  });

  // Undo timer (2 minutes)
  const undoTimer = useCountdownTimer({
    initialMinutes: 2,
    autoStart: visible && offerStatus === 'accepted' && canUndo,
  });


  const handleAccept = async () => {
    console.log(`🔘 [MODAL] Accept button clicked for offer: ${offer?.id}`);
    
    if (!offer) {
      console.error(`❌ [MODAL] No offer available for acceptance`);
      return;
    }
    
    console.log(`🔘 [MODAL] Setting loading state to true`);
    setLoading(true);
    
    try {
      console.log(`🔘 [MODAL] Calling acceptOffer context method`);
      await acceptOffer(offer.id);
      console.log(`✅ [MODAL] acceptOffer completed successfully`);
      
      console.log(`🔘 [MODAL] Showing success alert`);
      Alert.alert(
        'Offer Accepted!',
        `Onboarding scheduled for ${offer.suggestedDay}, ${offer.nextAvailableDate.toLocaleDateString()}${canUndo ? '\n\nYou have 2 minutes to undo this action.' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log(`🔘 [MODAL] Alert OK pressed, canUndo: ${canUndo}`);
              if (!canUndo) {
                console.log(`🔘 [MODAL] Closing modal (no undo available)`);
                onClose();
              } else {
                console.log(`🔘 [MODAL] Keeping modal open (undo available)`);
              }
              // Keep modal open if undo is available
            }
          }
        ]
      );
    } catch (error) {
      console.error(`❌ [MODAL] Error accepting offer:`, error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to accept offer'
      );
    } finally {
      console.log(`🔘 [MODAL] Setting loading state to false`);
      setLoading(false);
    }
  };

  const handleDecline = () => {
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

  const handleUndo = async () => {
    if (!offer) return;

    Alert.alert(
      'Undo Acceptance',
      'Are you sure you want to undo accepting this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await undoAccept(offer.id);
              if (success) {
                Alert.alert('Success', 'Offer acceptance has been undone.');
              } else {
                Alert.alert('Error', 'Unable to undo - time limit exceeded.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to undo acceptance.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = () => {
    switch (offerStatus) {
      case 'accepted': return theme.colors.success;
      case 'declined': return theme.colors.error;
      case 'expired': return theme.colors.gray;
      default: return theme.colors.warning;
    }
  };

  const getStatusText = () => {
    switch (offerStatus) {
      case 'accepted': return 'Accepted';
      case 'declined': return 'Declined';
      case 'expired': return 'Expired';
      default: return 'Pending';
    }
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
            <View style={[styles.statusBanner, { backgroundColor: getStatusColor() + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
              {isPending && (
                <Text style={styles.expirationText}>
                  Expires in: {expirationTimer.isExpired ? 'Expired' : expirationTimer.display}
                </Text>
              )}
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

            {/* Undo Information for Accepted Offers */}
            {isAccepted && canUndo && (
              <Card style={styles.undoCard} variant="elevated">
                <View style={styles.undoHeader}>
                  <Ionicons name="time" size={20} color={theme.colors.warning} />
                  <Text style={styles.undoTitle}>Undo Available</Text>
                </View>
                <Text style={styles.undoText}>
                  You can undo this acceptance for {undoTimer.display} more
                </Text>
              </Card>
            )}

            {/* Sync Information */}
            {hasPendingSync && (
              <View style={styles.noticeCard}>
                <Ionicons name="cloud-upload" size={20} color={theme.colors.info} />
                <Text style={styles.noticeText}>
                  Your action is queued for sync. It will be processed when connection is restored.
                </Text>
              </View>
            )}

            {/* General Notice */}
            {isPending && (
              <View style={styles.noticeCard}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.noticeText}>
                  Accepting this offer will add the onboarding to your Poolbrain schedule
                </Text>
              </View>
            )}
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
            
            {isAccepted && canUndo && (
              <>
                <GradientButton
                  title="Close"
                  onPress={onClose}
                  variant="outline"
                  style={styles.declineButton}
                />
                <GradientButton
                  title="Undo Accept"
                  onPress={handleUndo}
                  loading={loading}
                  style={styles.acceptButton}
                />
              </>
            )}

            {(isAccepted && !canUndo) || isDeclined || isExpired ? (
              <GradientButton
                title="Close"
                onPress={onClose}
                style={styles.fullWidthButton}
              />
            ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    flex: 1,
  },
  expirationText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    fontWeight: '600',
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
  undoCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.warning + '10',
  },
  undoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  undoTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
  },
  undoText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.warning,
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