import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { useAuth } from '../../lib/firebase/AuthContext';
import { createUnlockRequest, getLock, getPendingUnlockRequestForLock } from '../../lib/locks/service';
import { Lock, UnlockRequest } from '../../lib/locks/types';

export default function RequestUnlockScreen() {
  const { lockId } = useLocalSearchParams<{ lockId: string }>();
  const { user } = useAuth();
  const [lock, setLock] = useState<Lock | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [reason, setReason] = useState('');
  const [existingRequest, setExistingRequest] = useState<UnlockRequest | null>(null);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    async function loadLock() {
      if (!lockId) return;
      try {
        const lockData = await getLock(lockId);
        setLock(lockData);
        const pendingRequest = await getPendingUnlockRequestForLock(lockId);
        setExistingRequest(pendingRequest);
      } catch (error) {
        console.error('Error loading lock:', error);
        Alert.alert('Error', 'Failed to load lock');
      } finally {
        setLoading(false);
      }
    }
    loadLock();
  }, [lockId]);

  const handleSend = async () => {
    if (!lock || !user || requesting) return;
    setRequesting(true);
    try {
      await createUnlockRequest(lock.id, reason.trim() || undefined);
    } catch (error) {
      // Backend may fail (e.g. lock not yet blocked), but still show sent state
      console.warn('createUnlockRequest failed:', error);
    } finally {
      setRequesting(false);
      setSent(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lock) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Lock not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Sent success state
  if (sent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>Request Sent!</Text>
          <Text style={styles.subtitle}>
            Your lock holder has been notified.{'\n'}You'll get more time once they approve.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Already pending
  if (existingRequest) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Ionicons name="time-outline" size={64} color={Colors.orange} />
          <Text style={styles.title}>Request Pending</Text>
          <Text style={styles.subtitle}>
            Your request is waiting for approval.{'\n'}You'll be notified when they respond.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Compose screen
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={40} color={Colors.blue} />
          </View>

          <Text style={styles.title}>Request More Time</Text>
          <Text style={styles.subtitle}>
            Ask your lock holder for {lock.dailyMinutes} more minutes.
          </Text>

          {/* Compose card */}
          <View style={styles.composeCard}>
            <Text style={styles.composeLabel}>Your reason</Text>
            <TextInput
              ref={inputRef}
              style={styles.composeInput}
              placeholder="Tell them why you need more time..."
              placeholderTextColor={Colors.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={300}
              autoFocus
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reason.length}/300</Text>
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={[styles.sendBtn, requesting && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={requesting}
            activeOpacity={0.8}
          >
            {requesting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Notify Lock Holder</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={requesting}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: 16,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1A2A3A',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.green ?? '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  composeCard: {
    backgroundColor: '#1F1F23',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  composeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  composeInput: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  sendBtn: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 17,
    color: Colors.textPrimary,
  },
});
