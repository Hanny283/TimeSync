import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Lock } from '../../lib/locks/types';
import Button from './Button';
import StatusBadge from './StatusBadge';

interface LockCardProps {
  lock: Lock;
  role: 'creator' | 'holder';
  onCancel?: () => void;
  onAccept?: () => void;
  onRequestUnlock?: () => void;
  onDelete?: () => void;
}

type BadgeStatus = 'pending' | 'active' | 'blocked' | 'cancelled';

function getStatusIcon(lock: Lock): { name: keyof typeof Ionicons.glyphMap; color: string } {
  if (lock.status === 'pending') return { name: 'time-outline', color: Colors.orange };
  if (lock.status === 'cancelled') return { name: 'close-circle-outline', color: Colors.textMuted };
  if (lock.isBlocked) return { name: 'ban', color: Colors.red };
  return { name: 'shield-checkmark', color: Colors.green };
}

function getBadgeStatus(lock: Lock): BadgeStatus {
  if (lock.status === 'pending') return 'pending';
  if (lock.status === 'cancelled') return 'cancelled';
  if (lock.isBlocked) return 'blocked';
  if (lock.status === 'active') return 'active';
  return 'cancelled';
}

export default function LockCard({ lock, role, onCancel, onAccept, onRequestUnlock }: LockCardProps) {
  const statusIcon = getStatusIcon(lock);
  const badgeStatus = getBadgeStatus(lock);
  const createdDate = new Date(lock.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <Ionicons name={statusIcon.name} size={18} color={statusIcon.color} style={styles.statusIcon} />
        <StatusBadge status={badgeStatus} />
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.minutesText}>{lock.dailyMinutes} min/day</Text>
        <Text style={styles.appsText}>{lock.appTokens?.length || 0} apps restricted</Text>
      </View>

      <Text style={styles.dateText}>{createdDate}</Text>

      <View style={styles.divider} />

      <View style={styles.actionsRow}>
        {role === 'holder' && lock.status === 'pending' && onAccept && (
          <Button title="Accept Lock" onPress={onAccept} size="sm" style={styles.actionBtn} />
        )}
        {role === 'holder' && lock.status === 'active' && lock.isBlocked && onRequestUnlock && (
          <Button
            title="Request Unlock"
            onPress={onRequestUnlock}
            size="sm"
            variant="secondary"
            leftIcon="lock-open-outline"
            style={styles.actionBtn}
          />
        )}
        {role === 'creator' && lock.status !== 'cancelled' && onCancel && (
          <Button
            title="Cancel Lock"
            onPress={onCancel}
            size="sm"
            variant="danger"
            style={styles.actionBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F1F23',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusIcon: {
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 4,
  },
  minutesText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  appsText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
  },
});
