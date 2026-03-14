import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateInsightsFromData } from './gemini';
import { AIInsights, UsageData } from './types';

const AI_INSIGHTS_COLLECTION = 'aiInsights';
const BLOCK_EVENTS_COLLECTION = 'blockEvents';
const LOCKS_COLLECTION = 'locks';
const UNLOCK_REQUESTS_COLLECTION = 'unlockRequests';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function buildUsageData(userId: string): Promise<UsageData> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const [locksSnap, blockEventsSnap, unlockRequestsSnap] = await Promise.all([
    getDocs(query(collection(db, LOCKS_COLLECTION), where('creatorUserId', '==', userId))),
    getDocs(query(
      collection(db, BLOCK_EVENTS_COLLECTION),
      where('userId', '==', userId),
      where('blockedAt', '>=', thirtyDaysAgo)
    )),
    getDocs(query(collection(db, UNLOCK_REQUESTS_COLLECTION), where('creatorUserId', '==', userId))),
  ]);

  const locks = locksSnap.docs.map(d => d.data());
  const activeLocks = locks.filter(l => l.status === 'active').length;
  const cancelledLocks = locks.filter(l => l.status === 'cancelled' || l.status === 'deleted').length;
  const avgDailyMinutes = locks.length > 0
    ? Math.round(locks.reduce((sum, l) => sum + (l.dailyMinutes ?? 0), 0) / locks.length)
    : 0;

  const blockEvents = blockEventsSnap.docs.map(d => d.data());
  const blockEventHours = blockEvents.map(e => e.hourOfDay as number);
  const blockEventDays = blockEvents.map(e => e.dayOfWeek as number);

  const unlockRequests = unlockRequestsSnap.docs.map(d => d.data());
  const approvedRequests = unlockRequests.filter(r => r.status === 'approved').length;
  const unlockApprovalRate = unlockRequests.length > 0 ? approvedRequests / unlockRequests.length : 0;

  return {
    totalLocksCreated: locks.length,
    activeLocks,
    cancelledLocks,
    blockEventsLast30Days: blockEvents.length,
    blockEventHours,
    blockEventDays,
    unlockRequestCount: unlockRequests.length,
    unlockApprovalRate,
    avgDailyMinutes,
  };
}

async function fetchCachedInsights(userId: string): Promise<AIInsights | null> {
  const snap = await getDoc(doc(db, AI_INSIGHTS_COLLECTION, userId));
  if (!snap.exists()) return null;
  const data = snap.data() as AIInsights;
  if (Date.now() - data.generatedAt > CACHE_TTL_MS) return null;
  return data;
}

async function generateAndCache(userId: string): Promise<AIInsights> {
  const usageData = await buildUsageData(userId);
  const insights = await generateInsightsFromData(usageData);
  await setDoc(doc(db, AI_INSIGHTS_COLLECTION, userId), insights);
  return insights;
}

export async function getOrGenerateInsights(userId: string): Promise<AIInsights | null> {
  try {
    const cached = await fetchCachedInsights(userId);
    if (cached) return cached;
    return await generateAndCache(userId);
  } catch (error) {
    console.error('Failed to get/generate insights:', error);
    return null;
  }
}

export async function refreshInsights(userId: string): Promise<AIInsights | null> {
  try {
    return await generateAndCache(userId);
  } catch (error) {
    console.error('Failed to refresh insights:', error);
    return null;
  }
}
