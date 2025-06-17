import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { theme } from '../../styles/theme';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/common/Header';
import { logger } from '../../utils/logger';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

const MenuItem = memo<MenuItemProps>(({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons name={icon} size={24} color={theme.colors.blueGreen} />
        </View>
        <View>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
      )}
    </View>
  </TouchableOpacity>
));

const ProfileScreenComponent: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logger.info('Logout button pressed');
    logout(); // Call logout directly without confirmation
  }, [logout]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Profile" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'technician' ? 'Technician' : 'Admin'}
            </Text>
          </View>
        </View>

        <Card style={styles.menuCard} variant="elevated">
          <MenuItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your information"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage your preferences"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="lock-closed-outline"
            title="Change Password"
            onPress={() => {}}
          />
        </Card>

        <Card style={styles.menuCard} variant="elevated">
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="document-text-outline"
            title="Terms & Privacy"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => {}}
            showArrow={false}
          />
        </Card>

        <Card style={styles.menuCard} variant="elevated">
          <MenuItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleLogout}
            showArrow={false}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
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
    fontSize: 36,
    fontWeight: '600',
  },
  userName: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.md,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.seaFoam,
    borderRadius: theme.borderRadius.full,
  },
  roleText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
  menuCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.darkBlue,
  },
  menuSubtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 72,
  },
});

export const ProfileScreen = memo(ProfileScreenComponent);