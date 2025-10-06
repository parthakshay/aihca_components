import React, { useState, useMemo, useRef, useContext, memo, useCallback } from 'react';
import { Modal, Pressable, Text, StyleSheet, View, ActivityIndicator, Share, Linking, Platform, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ThemeContext } from '../theme/ThemeContext';
import * as WebBrowser from 'expo-web-browser';

const TOUCH = { top: 8, bottom: 8, left: 8, right: 8 };

function normalizeDriveUrl(raw) {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    // file/d/<id>/view?usp=sharing  -> uc?export=preview&id=<id>
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m && m[1]) return `https://drive.google.com/uc?export=preview&id=${m[1]}`;
    // open?id=<id>  -> uc?export=preview&id=<id>
    if (u.hostname.includes('drive.google.com')) {
      const id = u.searchParams.get('id');
      if (id) return `https://drive.google.com/uc?export=preview&id=${id}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

const DrivePopup = ({
  visible,
  url,
  onClose,
  title = 'Drive Preview',
  colors: colorsProp,
  testID = 'drive-popup',
  openInAppPreferred = true,
}) => {
  const { theme } = useContext(ThemeContext) || {};
  const isDark = theme?.mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);
  const webRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const safeUrl = useMemo(() => normalizeDriveUrl(url), [url]);

  const palette = {
    bg: colorsProp?.background || theme?.colors?.modalBg || (isDark ? '#000' : '#fff'),
    headerBg: colorsProp?.header || theme?.colors?.modalHeader || (isDark ? '#111' : '#f8f8f8'),
    border: colorsProp?.border || theme?.colors?.modalBorder || (isDark ? '#444' : '#ccc'),
    text: colorsProp?.text || theme?.colors?.modalText || (isDark ? '#fff' : '#333'),
    link: colorsProp?.link || theme?.colors?.link || (isDark ? '#4da3ff' : '#007AFF'),
    spinner: colorsProp?.spinner || theme?.colors?.accent || (isDark ? '#4da3ff' : '#007AFF'),
  };

  const onOpenInBrowser = useCallback(async () => {
    try {
      if (openInAppPreferred && WebBrowser?.openBrowserAsync) {
        await WebBrowser.openBrowserAsync(safeUrl, { enableBarCollapsing: true, showTitle: true });
        return;
      }
      const supported = await Linking.canOpenURL(safeUrl);
      if (!supported) throw new Error('Unsupported URL');
      await Linking.openURL(safeUrl);
    } catch {
      Alert.alert('Cannot open link', 'Please try again later.');
    }
  }, [safeUrl, openInAppPreferred]);

  const onShareLink = useCallback(async () => {
    try {
      await Share.share(Platform.OS === 'ios' ? { url: safeUrl, message: title } : { message: safeUrl });
    } catch {/* user canceled */}
  }, [safeUrl, title]);

  const retry = () => {
    setLastError(null);
    setLoading(true);
    webRef.current?.reload();
  };

  // Android hardware back: go back in webview, else close
  React.useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webRef.current && canGoBack) {
        webRef.current.goBack();
        return true;
      }
      if (onClose) {
        onClose();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [visible, canGoBack, onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}>
      <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: palette.bg, paddingBottom: 12 }]} testID={testID}>
        <View accessibilityRole="header" testID="drive-popup-header" style={[styles.header, { backgroundColor: palette.headerBg, borderColor: palette.border }]}>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          <View style={styles.headerButtons}>
            <Pressable
              onPress={onOpenInBrowser}
              hitSlop={TOUCH}
              accessibilityRole="button"
              accessibilityLabel="Open in browser"
              android_ripple={{ borderless: false }}
              testID="drive-popup-open-browser"
            >
              <Text style={[styles.headerButtonText, { color: palette.link }]}>Browser</Text>
            </Pressable>
            <Pressable
              onPress={onShareLink}
              hitSlop={TOUCH}
              accessibilityRole="button"
              accessibilityLabel="Share link"
              android_ripple={{ borderless: false }}
              testID="drive-popup-share"
            >
              <Text style={[styles.headerButtonText, { color: palette.link }]}>Share</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              hitSlop={TOUCH}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              android_ripple={{ borderless: false }}
              testID="drive-popup-close"
            >
              <Text style={[styles.headerButtonText, { color: palette.link }]}>Close</Text>
            </Pressable>
          </View>
        </View>

        {loading && !lastError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={palette.spinner} />
          </View>
        )}

        {lastError ? (
          <View style={styles.errorWrap}>
            <Text style={{ color: palette.text, marginBottom: 8 }}>Failed to load preview.</Text>
            <Pressable onPress={retry} style={styles.retryBtn} android_ripple={{ borderless: false }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            ref={webRef}
            style={styles.webview}
            source={{ uri: safeUrl }}
            startInLoadingState={false}
            onLoadStart={() => { setLoading(true); setLastError(null); }}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => { setLoading(false); setLastError(e.nativeEvent); }}
            onHttpError={(e) => { setLoading(false); setLastError(e.nativeEvent); }}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            cacheEnabled
            setSupportMultipleWindows={false}
            originWhitelist={['*']}
            // Keep navigation inside the preview; allow drive docs/pdf viewers
            onShouldStartLoadWithRequest={(req) => {
              // Allow same URL family; block target=_blank popouts
              if (!visible) return false;
              return true;
            }}
            onNavigationStateChange={(nav) => setCanGoBack(!!nav.canGoBack)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  headerButtons: { flexDirection: 'row', gap: 12 },
  headerButtonText: { fontSize: 14, marginLeft: 12 },
  loadingOverlay: {
    position: 'absolute',
    top: '50%', left: '50%',
    marginLeft: -20, marginTop: -20, zIndex: 10,
  },
  errorWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#ff4d4f',
  },
});

export default memo(DrivePopup);