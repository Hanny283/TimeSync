import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../lib/firebase/AuthContext';
import { db } from '../../lib/firebase/config';
import { blockLock, startMonitoringForCreator } from '../../lib/locks/service';
import { subscribeToUnlockRequests } from '../../lib/locks/service';
import { registerForPushNotifications } from '../../lib/notifications';
import { onDeviceActivityMonitorEvent } from '../../lib/screentime';

export default function TabsLayout() {
  const { user } = useAuth();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  // Register / refresh push token whenever a user session starts
  useEffect(() => {
    if (!user?.uid) return;
    registerForPushNotifications(user.uid);
  }, [user?.uid]);

  // Listen for locks created by this user becoming active and start monitoring
  useEffect(() => {
    if (Platform.OS !== 'ios' || !user?.uid) return;

    const q = query(
      collection(db, 'locks'),
      where('creatorUserId', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const changeCount = snapshot.docChanges().length;
      if (changeCount === 0) return;

      for (const change of snapshot.docChanges()) {
        if (change.type === 'added' || change.type === 'modified') {
          const lockId = change.doc.id;
          try {
            await startMonitoringForCreator(lockId);
          } catch (error) {
            console.error('Failed to start monitoring:', error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Listen for Device Activity Monitor events (when time threshold is reached)
  useEffect(() => {
    if (Platform.OS !== 'ios' || !user?.uid) return;

    const handleMonitorEvent = async (event: any) => {
      if (event.callbackName !== 'eventDidReachThreshold') return;

      const eventIdentifier = event.eventName || event.activityName || event.id || '';
      const lockIdMatch = eventIdentifier.match(/lock_([^_]+)/);

      if (lockIdMatch && lockIdMatch[1]) {
        try {
          await blockLock(lockIdMatch[1]);
        } catch (error) {
          console.error('Failed to update lock status:', error);
        }
      } else {
        try {
          const { listLocksForCreator } = await import('../../lib/locks/service');
          const locks = await listLocksForCreator(user.uid);
          const activeLocks = locks.filter(l => l.status === 'active' && !l.isBlocked);
          for (const lock of activeLocks) {
            try {
              await blockLock(lock.id);
            } catch (err) {
              console.error(`Failed to block lock ${lock.id}:`, err);
            }
          }
        } catch (error) {
          console.error('Failed to find and block locks:', error);
        }
      }
    };

    const subscription = onDeviceActivityMonitorEvent(handleMonitorEvent);
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [user?.uid]);

  // Subscribe to pending unlock requests for badge count
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUnlockRequests(user.uid, (requests) => {
      setPendingRequestCount(requests.length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.blue,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 6,
          paddingTop: 8,
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="your_locks"
        options={{
          title: 'Locks',
          tabBarBadge: pendingRequestCount > 0 ? pendingRequestCount : undefined,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'lock-closed' : 'lock-closed-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
