import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { OnboardingOffer } from '../../types';
import { Card } from '../ui/Card';
import { GradientButton } from '../ui/GradientButton';

interface OfferModalProps {
  visible: boolean;
  offer: OnboardingOffer | null;
  onClose: () => void;
  onAccept: (offerId: string) => void;
  onDecline: (offerId: string) => void;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  visible,
  offer,
  onClose,
  onAccept,
  onDecline,
}) => {
  const [loading, setLoading] = useState(false);

  if (!offer) return null;

  const handleAccept = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Alert.alert(
      'Onboarding Scheduled',
      `Onboarding confirmed for ${offer.suggestedDay}, ${offer.nextAvailableDate}`,
      [
        {
          text: 'OK',
          onPress: () => {
            onAccept(offer.id);
            onClose();
          }
        }
      ]
    );
    setLoading(false);
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Offer',
      'Are you sure you want to decline this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            onDecline(offer.id);
            onClose();
          }
        }
      ]
    );
  };

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
            <Text style={styles.headerTitle}>New Onboarding Offer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

            <Card style={styles.routeCard} variant="elevated">
              <View style={styles.routeHeader}>
                <Ionicons name="navigate" size={20} color={theme.colors.blueGreen} />
                <Text style={styles.routeTitle}>Route Information</Text>
              </View>
              <Text style={styles.routeProximity}>
                This customer is {offer.routeProximity}
              </Text>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Suggested Day:</Text>
                <Text style={styles.scheduleValue}>{offer.suggestedDay}</Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Next Available:</Text>
                <Text style={styles.scheduleValue}>{offer.nextAvailableDate}</Text>
              </View>
            </Card>

            <View style={styles.noticeCard}>
              <Ionicons name="information-circle" size={20} color={theme.colors.info} />
              <Text style={styles.noticeText}>
                Accepting this offer will add the onboarding to your Poolbrain schedule
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
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
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
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
});