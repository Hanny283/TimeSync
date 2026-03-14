import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/firebase/AuthContext';
import { logout } from '../../lib/firebase/auth';
import { listLocksForCreator, listLocksForHolder } from '../../lib/locks/service';
import { Lock } from '../../lib/locks/types';
import {
  getAuthorizationStatus,
  requestFamilyControlsAuthorization,
} from '../../lib/screentime';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [screenTimeAuthorized, setScreenTimeAuthorized] = useState<boolean | null>(null);
  const [sentLocks, setSentLocks] = useState<Lock[]>([]);
  const [heldLocks, setHeldLocks] = useState<Lock[]>([]);
  const [locksLoading, setLocksLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !user) return;

    async function authorizeScreenTime() {
      try {
        const currentStatus = getAuthorizationStatus();
        if (currentStatus === 2) {
          setScreenTimeAuthorized(true);
          return;
        }

        setScreenTimeAuthorized(false);
        setTimeout(async () => {
          const authorized = await requestFamilyControlsAuthorization();
          setScreenTimeAuthorized(authorized);
        }, 1000);
      } catch (error) {
        if (__DEV__) console.error('Error requesting Screen Time authorization:', error);
        setScreenTimeAuthorized(false);
      }
    }

    authorizeScreenTime();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLocksLoading(true);
    try {
      const [sent, held] = await Promise.all([
        listLocksForCreator(user.uid),
        listLocksForHolder(user.uid),
      ]);
      setSentLocks(sent);
      setHeldLocks(held);
    } catch (error) {
      if (__DEV__) console.error('Error loading dashboard:', error);
    } finally {
      setLocksLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <Text style={styles.welcomeText}>Welcome to TimeSync!</Text>
        <View style={styles.authButtons}>
          <Button title="Sign In" onPress={() => router.push('/signin')} />
          <Button title="Sign Up" onPress={() => router.push('/signup')} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const activeSent = sentLocks.filter(l => l.status === 'active').length;
  const activeHeld = heldLocks.filter(l => l.status === 'active').length;
  const blockedHeld = heldLocks.filter(l => l.status === 'active' && l.isBlocked).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>TimeSync</Text>
            <Text style={styles.userText}>{user.email}</Text>
          </View>
          <Button
            title="Sign Out"
            variant="secondary"
            onPress={async () => {
              try {
                await logout();
              } catch (error) {
                if (__DEV__) console.error('Sign out error:', error);
              }
            }}
          />
        </View>

        {Platform.OS === 'ios' && screenTimeAuthorized === false && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Screen Time Access Required</Text>
            <Text style={styles.warningText}>
              Grant Screen Time permission to create or hold locks. You were prompted on launch — re-open the app or go to Settings if you missed it.
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{locksLoading ? '—' : activeSent}</Text>
            <Text style={styles.statLabel}>Locks Sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{locksLoading ? '—' : activeHeld}</Text>
            <Text style={styles.statLabel}>Locks Held</Text>
          </View>
          {blockedHeld > 0 && (
            <View style={[styles.statCard, styles.statCardWarning]}>
              <Text style={[styles.statNumber, styles.statNumberWarning]}>{blockedHeld}</Text>
              <Text style={styles.statLabel}>Blocked Now</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Create Lock"
            onPress={async () => {
              try {
                const currentStatus = getAuthorizationStatus();
                if (currentStatus !== 2) {
                  const authorized = await requestFamilyControlsAuthorization();
                  if (!authorized) {
                    Alert.alert(
                      'Screen Time Access Required',
                      'Grant Screen Time permission to create locks. Go to Settings › Screen Time and allow TimeSync.'
                    );
                    return;
                  }
                }
                router.push('/select_apps');
              } catch (e) {
                Alert.alert('Error', `Failed to start lock creation: ${e instanceof Error ? e.message : String(e)}`);
              }
            }}
          />

          <Button
            title="View Your Locks"
            variant="secondary"
            onPress={() => router.push('/(tabs)/your_locks')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EDEDED',
  },
  userText: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 18,
    color: '#A1A1AA',
    textAlign: 'center',
    marginTop: 40,
  },
  authButtons: {
    gap: 12,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  warningCard: {
    backgroundColor: '#2C1A00',
    borderWidth: 1,
    borderColor: '#92400E',
    borderRadius: 10,
    padding: 14,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#D97706',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    alignItems: 'center',
  },
  statCardWarning: {
    borderColor: '#92400E',
    backgroundColor: '#2C1A00',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EDEDED',
  },
  statNumberWarning: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
});
