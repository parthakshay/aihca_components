import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  BackHandler,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

// Offline-first helpers for optional in-component fetching
const STORAGE_KEY = 'notifications';

const buildUrl = (base, params = {}) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  if (!q) return base;
  return base.includes('?') ? `${base}&${q}` : `${base}?${q}`;
};

const normalizeNotifications = (json) => {
  let arr = [];
  if (Array.isArray(json)) arr = json;
  else if (json?.data) arr = json.data;
  else if (json?.rows) arr = json.rows;
  else if (json?.notifications) arr = json.notifications;

  return (arr || []).filter(Boolean).map((n, idx) => ({
    id: n.id ?? String(idx),
    title: String(n.title ?? n.heading ?? 'Untitled'),
    message: String(n.message ?? n.body ?? ''),
    timestamp: n.timestamp ?? n.time ?? n.created_at ?? null,
    read: Boolean(n.read),
  }));
};

const fetchNotificationsFromEndpoint = async ({ url, timeoutMs = 8000 }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(buildUrl(url, { as: 'json' }), {
      method: 'GET',
      headers: { 'cache-control': 'no-cache' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return normalizeNotifications(json);
  } finally {
    clearTimeout(timer);
  }
};

const getTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  let notificationDate;
  try {
    if (typeof timestamp === 'string' && timestamp.includes('/')) {
      // expects dd/mm/yyyy [hh:mm:ss]
      const [datePart, timePart = '00:00:00'] = timestamp.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number);
      notificationDate = new Date(year, month - 1, day, hour, minute, second);
    } else {
      // ISO string or Date
      notificationDate = new Date(timestamp);
    }
    const now = new Date();
    const diffMs = now - notificationDate;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
};

const NotificationModal = ({ visible, onClose, notifications = [], setNotifications, lockDurationMs = 15000, testID = 'notification-modal', showTimeAgo = false, autoFetch = false, endpointUrl, timeoutMs = 8000, forceRefreshOnOpen = true }) => {
  const { theme: colors } = useTheme();
  const [markedAsRead, setMarkedAsRead] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [locked, setLocked] = useState(false);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const lockTimerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Local notifications store if parent does not pass data
  const [localNotifications, setLocalNotifications] = useState([]);
  const useExternal = Array.isArray(notifications) && notifications.length > 0;
  const effectiveNotifications = useExternal ? notifications : localNotifications;
  const setEffectiveNotifications = setNotifications || setLocalNotifications;

  const memoizedNotifications = useMemo(() => effectiveNotifications.slice().reverse(), [effectiveNotifications]);

  // Theme fallbacks to avoid undefined tokens
  const bgNote = colors.notificationBox ?? colors.card ?? colors.background;
  const unreadBg = colors.unreadNotification ?? bgNote;
  const activeBg = colors.touchableActive ?? bgNote;
  const overlayColor = colors.overlay ?? 'rgba(0,0,0,0.5)';
  const closeBg = colors.closeBtn ?? colors.card ?? bgNote;

  useEffect(() => {
    const backAction = () => {
      if (!visible) return false;
      if (locked) return true; // block back while locked
      onClose?.();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, onClose, locked]);

  // Lock/unlock effect for modal open/close and notifications
  useEffect(() => {
    // Start lock when modal becomes visible and there is at least one notification
    if (visible && memoizedNotifications.length > 0 && lockDurationMs > 0) {
      setLocked(true);
      setLockSecondsLeft(Math.ceil(lockDurationMs / 1000));
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);
      lockTimerRef.current = setInterval(() => {
        setLockSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(lockTimerRef.current);
            lockTimerRef.current = null;
            setLocked(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      setLocked(false);
      setLockSecondsLeft(0);
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    }
    return () => {
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    };
  }, [visible, memoizedNotifications.length, lockDurationMs]);

  // Mark all as read except the newest when modal becomes visible
  useEffect(() => {
    const syncNotifications = async () => {
      try {
        const cleared = await AsyncStorage.getItem('notificationsCleared');
        if (visible && effectiveNotifications.length && !markedAsRead && cleared !== 'true') {
          // assume array is chronological (old -> new); keep newest (last) unread
          const last = effectiveNotifications.length - 1;
          const updated = effectiveNotifications.map((n, i) => ({ ...n, read: i !== last }));
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setEffectiveNotifications(updated);
          setMarkedAsRead(true);
        }
      } catch (e) {
        // noop; avoid crashing on storage errors
      }
    };

    syncNotifications();
    // intentionally depend only on visibility to avoid repeated writes; other deps are inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Auto-fetch: load cache immediately, refresh from network when visible (if configured)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!autoFetch || !endpointUrl) return;
      try {
        // 1) Cache first for instant UI (only when using internal store)
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached && !useExternal) {
          const parsed = JSON.parse(cached);
          if (!cancelled) setLocalNotifications(Array.isArray(parsed) ? parsed : []);
        }
        // 2) Network: either immediately or wait until modal is open
        if (!visible && forceRefreshOnOpen) return; // wait until visible to refresh
        const fresh = await fetchNotificationsFromEndpoint({ url: endpointUrl, timeoutMs });
        if (!cancelled && !useExternal) {
          setLocalNotifications(fresh);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        }
      } catch (e) {
        // Silent offline fallback; UI will show cached or remain empty
      }
    };

    load();
    return () => { cancelled = true; };
  }, [autoFetch, endpointUrl, timeoutMs, visible, forceRefreshOnOpen, useExternal]);

  // Fade + scale animation effect for modal container
  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  const scale = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });


  // Style helpers for notification box press feedback
  const getNotificationBoxStyle = (note, pressed) => [
    styles.notificationBox,
    { backgroundColor: bgNote, borderColor: colors.text },
    !note.read && { backgroundColor: unreadBg },
    pressed && { backgroundColor: activeBg },
  ];

  const renderItem = ({ item: note, index }) => (
    <TouchableOpacity
      key={note.timestamp || `${note.title}-${index}`}
      accessibilityRole="button"
      accessible={true}
      accessibilityLabel={`Notification: ${note.title}. ${note.message}`}
      activeOpacity={0.85}
      onPressIn={() => setActiveIndex(index)}
      onPressOut={() => setActiveIndex(null)}
      style={getNotificationBoxStyle(note, activeIndex === index)}
    >
      <Text style={[styles.notificationTitle, { color: colors.text }]}>
        • {note.title}
      </Text>
      <Text style={[styles.notificationMessage, { color: colors.text }]}>
        {note.message}
      </Text>
      {(showTimeAgo || !note.read) && (
        <View style={styles.dateContainer}>
          {showTimeAgo && (
            <Text style={[styles.notificationDate, { color: colors.text }]}>
              {getTimeAgo(note.timestamp)}
            </Text>
          )}
          {!note.read && (
            <Text style={[styles.newLabel, { color: colors.text }]}>NEW</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={[styles.overlay, { backgroundColor: overlayColor }]}
        accessible
        accessibilityLabel="Notifications"
        testID={testID}
      >
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.background, transform: [{ scale }], opacity: fadeAnim },
          ]}
          testID="notification-card"
        >
          <Text style={[styles.title, { color: colors.text }]}>📢 Notifications</Text>
          {memoizedNotifications.length > 0 ? (
            <FlatList
              data={memoizedNotifications}
              keyExtractor={(item, index) => `${item.timestamp ?? 't'}-${item.title ?? 'n'}-${index}`}
              renderItem={renderItem}
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={8}
              windowSize={6}
              removeClippedSubviews
              accessibilityRole="list"
              testID="notification-list"
            />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 16, color: colors.text }}>No notifications yet.</Text>
            </View>
          )}

          {locked ? (
            <View
              style={[styles.closeBtn, { backgroundColor: closeBg }]}
              accessible
              accessibilityLabel={`Close available in ${lockSecondsLeft} seconds`}
              testID="notification-close-locked"
            >
              <Text style={[styles.closeText, { color: colors.text }]}>Close ({lockSecondsLeft})</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: closeBg }]}
              onPress={onClose}
              accessible
              accessibilityLabel={'Close Notifications'}
              testID="notification-close"
            >
              <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default NotificationModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    // backgroundColor set dynamically
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    // color set dynamically
  },
  scrollArea: {
    width: '100%',
    maxHeight: 250,
  },
  notificationBox: {
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 8,
    padding: 10,
    borderRadius: 10,
    // backgroundColor and borderColor set dynamically
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    // color set dynamically
  },
  notificationMessage: {
    fontSize: 14,
    marginTop: 4,
    // color set dynamically
  },
  notificationDate: {
    fontSize: 12,
    marginTop: 4,
    // color set dynamically
  },
  newLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    marginLeft: 8,
    // color set dynamically
  },
  closeBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    // backgroundColor set dynamically
  },
  clearBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    // backgroundColor set dynamically
  },
  closeText: {
    fontWeight: 'bold',
    // color set dynamically
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    marginLeft: 6,
    // color set dynamically
  },
});
