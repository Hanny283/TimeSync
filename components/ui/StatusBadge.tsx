import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';

type Status = 'pending' | 'active' | 'blocked' | 'cancelled';

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { bg: string; text: string; label: string }> = {
  pending: { bg: Colors.warningBg, text: Colors.orange, label: 'PENDING' },
  active: { bg: Colors.successBg, text: Colors.successText, label: 'ACTIVE' },
  blocked: { bg: Colors.errorBg, text: Colors.red, label: 'BLOCKED' },
  cancelled: { bg: Colors.card, text: Colors.textMuted, label: 'CANCELLED' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text, label } = config[status] ?? config.cancelled;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
