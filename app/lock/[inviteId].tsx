import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui 2/Button';
import { useAuth } from '../../lib/firebase/AuthContext';
import { acceptLock, getLockByInviteId } from '../../lib/locks/service';
import { Lock } from '../../lib/locks/types';

export default function AcceptLockScreen() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [lock, setLock] = useState<Lock | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLock() {
      if (!inviteId) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading lock with inviteId:', inviteId);
        const lockData = await getLockByInviteId(inviteId);
        
        if (!lockData) {
          setError('Lock not found. It may have been cancelled or already accepted.');
          setLoading(false);
          return;
        }

        // Check if lock is already active
        if (lockData.status === 'active') {
          setError('This lock has already been accepted and is now active.');
          setLoading(false);
          return;
        }

        // Check if lock is cancelled
        if (lockData.status === 'cancelled') {
          setError('This lock has been cancelled.');
          setLoading(false);
          return;
        }

        // Only show accept screen for pending locks
        if (lockData.status !== 'pending') {
          setError(`This lock is ${lockData.status} and cannot be accepted.`);
          setLoading(false);
          return;
        }

        console.log('Lock loaded:', lockData);
        setLock(lockData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading lock:', err);
        setError('Failed to load lock invitation. Please try again.');
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (!user) {
        // User not logged in - they need to sign in first
        setError('Please sign in to accept this lock invitation');
        setLoading(false);
      } else {
        loadLock();
      }
    }
  }, [inviteId, user, authLoading]);

  const handleAccept = async () => {
    if (!lock || !user) return;

    // Double-check lock is still pending before accepting
    if (lock.status !== 'pending') {
      Alert.alert(
        'Cannot Accept',
        `This lock is already ${lock.status} and cannot be accepted.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/your_locks') }]
      );
      return;
    }

    setAccepting(true);
    try {
      console.log('Accepting lock:', lock.id);
      await acceptLock(lock.id, user.uid);
      
      Alert.alert(
        'Lock Accepted!',
        'The lock has been activated on your device.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/your_locks'),
          },
        ]
      );
    } catch (err) {
      console.error('Error accepting lock:', err);
      Alert.alert(
        'Error',
        'Failed to accept lock. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Lock',
      'Are you sure you want to decline this lock invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading invitation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>🔒</Text>
          <Text style={styles.errorText}>Please sign in to accept this lock invitation</Text>
          <View style={styles.buttonContainer}>
            <Button title="Sign In" onPress={() => router.push('/signin')} />
            <Button title="Sign Up" onPress={() => router.push('/signup')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Go Home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lock) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorText}>Lock not found</Text>
          <Button title="Go Home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.title}>Lock Invitation</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Daily Time Limit:</Text>
          <Text style={styles.value}>{lock.dailyMinutes} minutes</Text>
          
          <Text style={[styles.label, styles.marginTop]}>Status:</Text>
          <Text style={styles.value}>{lock.status}</Text>
        </View>

        <Text style={styles.description}>
          By accepting this lock, the selected apps will be restricted to {lock.dailyMinutes} minutes per day on your device.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title={accepting ? 'Accepting...' : 'Accept Lock'}
            onPress={handleAccept}
            disabled={accepting}
          />
          <Button
            title="Decline"
            onPress={handleDecline}
            disabled={accepting}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorEmoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EDEDED',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#1F1F23',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  label: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 5,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EDEDED',
  },
  marginTop: {
    marginTop: 15,
  },
  description: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#A1A1AA',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#EDEDED',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
});
