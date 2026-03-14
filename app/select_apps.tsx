import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/firebase/AuthContext';
import { createLockDraft } from '../lib/locks/service';
import { DeviceActivitySelectionView } from '../lib/screentime';

export default function SelectAppsScreen() {
  const { user } = useAuth();
  const [appSelection, setAppSelection] = useState<string | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState('60');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in to create a lock.');
      return;
    }

    if (!appSelection) {
      Alert.alert('No Apps Selected', 'Please tap the app picker and select at least one app to restrict.');
      return;
    }

    const minutes = parseInt(dailyMinutes, 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      Alert.alert('Invalid Limit', 'Daily limit must be between 1 and 1440 minutes.');
      return;
    }

    setCreating(true);
    try {
      const lock = await createLockDraft({
        appTokens: [appSelection],
        dailyMinutes: minutes,
        creatorUserId: user.uid,
      });

      await Share.share({
        message: `I'm setting up a Screen Time lock for myself. Accept it here: ${lock.inviteUrl}`,
        url: lock.inviteUrl,
      });

      router.replace('/(tabs)/your_locks');
    } catch (error) {
      if (__DEV__) console.error('Create lock error:', error);
      Alert.alert('Error', `Failed to create lock: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button title="Back" variant="secondary" onPress={() => router.back()} />
          <Text style={styles.title}>Create Lock</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.label}>Select Apps to Restrict</Text>
        <Text style={styles.hint}>Tap the picker below to choose which apps will be limited.</Text>

        {Platform.OS === 'ios' ? (
          <View style={styles.pickerContainer}>
            <DeviceActivitySelectionView
              onSelectionChange={(event) => {
                setAppSelection(event.nativeEvent.familyActivitySelection);
              }}
              familyActivitySelection={appSelection}
              style={styles.picker}
            />
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            <Text style={styles.platformNote}>App selection requires iOS.</Text>
          </View>
        )}

        {appSelection && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>Apps selected</Text>
          </View>
        )}

        <Text style={styles.label}>Daily Limit (minutes)</Text>
        <TextInput
          style={styles.input}
          value={dailyMinutes}
          onChangeText={setDailyMinutes}
          keyboardType="number-pad"
          maxLength={4}
          placeholderTextColor="#71717A"
          placeholder="60"
        />
        <Text style={styles.hint}>
          The selected apps will be blocked after this many minutes each day. Resets at midnight.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. Choose apps and a daily limit, then tap Create Lock.{'\n'}
            2. Share the invite link with your accountability buddy (or yourself on another device).{'\n'}
            3. Once accepted, Screen Time monitoring starts immediately.{'\n'}
            4. When time runs out, a shield appears. Tap Request Unlock to ask your buddy.
          </Text>
        </View>

        <Button
          title={creating ? 'Creating…' : 'Create Lock & Share Invite'}
          onPress={handleCreate}
          disabled={creating || !appSelection}
        />
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
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerSpacer: {
    width: 70,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EDEDED',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EDEDED',
  },
  hint: {
    fontSize: 13,
    color: '#71717A',
    lineHeight: 18,
    marginTop: -8,
  },
  pickerContainer: {
    height: 220,
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1C1C1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    width: '100%',
  },
  platformNote: {
    color: '#71717A',
    fontSize: 14,
  },
  selectedBadge: {
    backgroundColor: '#14532D',
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: -8,
  },
  selectedBadgeText: {
    fontSize: 13,
    color: '#4ADE80',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1C1C1F',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#EDEDED',
  },
  infoCard: {
    backgroundColor: '#1C1C1F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#71717A',
    lineHeight: 20,
  },
});
