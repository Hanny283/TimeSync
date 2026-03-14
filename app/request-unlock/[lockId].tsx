import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui 2/Button';
import { useAuth } from '../../lib/firebase/AuthContext';
import { createUnlockRequest, getLock, getPendingUnlockRequestForLock } from '../../lib/locks/service';
import { Lock, UnlockRequest } from '../../lib/locks/types';

export default function RequestUnlockScreen() {
  const { lockId } = useLocalSearchParams<{ lockId: string }>();
  const { user } = useAuth();
  const [lock, setLock] = useState<Lock | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');
  const [existingRequest, setExistingRequest] = useState<UnlockRequest | null>(null);

  useEffect(() => {
    async function loadLock() {
      if (!lockId) return;

      try {
        console.log('🔓 Request Unlock screen opened for lock:', lockId);
        const lockData = await getLock(lockId);
        console.log('🔓 Lock data loaded:', {
          id: lockData.id,
          isBlocked: lockData.isBlocked,
          dailyMinutes: lockData.dailyMinutes,
          status: lockData.status
        });
        setLock(lockData);

        // Check if there's already a pending request
        const pendingRequest = await getPendingUnlockRequestForLock(lockId);
        if (pendingRequest) {
          console.log('⏳ Found existing pending request:', pendingRequest.id);
        }
        setExistingRequest(pendingRequest);
      } catch (error) {
        console.error('❌ Error loading lock:', error);
        Alert.alert('Error', 'Failed to load lock');
      } finally {
        setLoading(false);
      }
    }

    loadLock();
  }, [lockId]);

  const handleRequestUnlock = async () => {
    if (!lock || !user) return;

    setRequesting(true);
    try {
      // Pass message only if it has content, otherwise pass undefined (will be converted to null in service)
      await createUnlockRequest(lock.id, message.trim() || undefined);
      
      // createUnlockRequest already sends the notification
      console.log('✅ Unlock request created and notification sent');

      Alert.alert(
        '📤 Request Sent!',
        'Your lock holder will be notified. You\'ll get more time once they approve.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error requesting unlock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send unlock request';
      Alert.alert('Error', errorMessage);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!lock) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Lock not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Check if lock is blocked (time has run out)
  if (!lock.isBlocked) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.title}>Not Yet</Text>
          <Text style={styles.description}>
            You can only request an unlock after your {lock.dailyMinutes} minutes have run out.
          </Text>
          <Text style={styles.description}>
            Keep using your apps - you'll be able to request more time once the limit is reached.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (existingRequest) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.title}>Request Pending</Text>
          <Text style={styles.description}>
            Your unlock request is waiting for approval. You'll be notified when the lock holder responds.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔓</Text>
        <Text style={styles.title}>Request Unlock</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Lock Time Limit:</Text>
          <Text style={styles.value}>{lock.dailyMinutes} minutes</Text>
        </View>

        <Text style={styles.description}>
          Request {lock.dailyMinutes} more minutes from your lock holder.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Add a message (optional)"
          placeholderTextColor="#666"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={requesting ? 'Sending...' : 'Send Request'}
            onPress={handleRequestUnlock}
            disabled={requesting}
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            disabled={requesting}
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
  },
  emoji: {
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
  description: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#1F1F23',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 8,
    padding: 12,
    color: '#EDEDED',
    fontSize: 16,
    marginBottom: 30,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#EDEDED',
    marginBottom: 20,
  },
});
