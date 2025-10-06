import React, { useContext, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../theme/ThemeContext'; // ← match exact file casing

const TOUCH_HITSLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const AppHeader = ({
  title = 'AIHCA',
  showBell = false,
  unreadCount = 0,
  onBellPress,
  onTitlePress,
  showBackButton = false,
  onBackPress,
  backgroundColor,
  leftComponent, // optional custom left-side content
  rightComponent, // optional custom right-side content
  colors: colorsProp,
  statusBarStyle: statusBarStyleProp,
}) => {
  const { theme } = useContext(ThemeContext) || {};
  const isDark = theme?.mode === 'dark';

  const bgColor =
    backgroundColor ||
    colorsProp?.background ||
    theme?.colors?.header ||
    (isDark ? '#1c1c1e' : '#0A3D62');
  const textColor =
    colorsProp?.text ||
    theme?.colors?.headerText ||
    '#FFFFFF';
  const iconColor =
    colorsProp?.icon ||
    theme?.colors?.headerIcon ||
    textColor;
  const dividerColor =
    colorsProp?.border ||
    theme?.colors?.headerBorder ||
    (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
  const statusBarStyle =
    statusBarStyleProp ||
    (textColor === '#FFFFFF' ? 'light-content' : 'dark-content');

  return (
    <SafeAreaView style={{ backgroundColor: bgColor }}>
      <StatusBar
        translucent={false}
        backgroundColor={bgColor}
        barStyle={statusBarStyle}
      />
      <View
        accessible
        accessibilityRole="header"
        testID="app-header"
        style={[
          styles.container,
          { backgroundColor: bgColor, borderBottomColor: dividerColor },
        ]}
      >
        {/* Left: Custom or Back */}
        <View style={styles.sideBox}>
          {leftComponent ? (
            leftComponent
          ) : showBackButton ? (
            <Pressable
              onPress={onBackPress}
              disabled={!onBackPress}
              hitSlop={TOUCH_HITSLOP}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              android_ripple={{ borderless: false }}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </Pressable>
          ) : null}
        </View>

        {/* Center: Title */}
        <Pressable
          onPress={onTitlePress}
          disabled={!onTitlePress}
          android_ripple={onTitlePress ? { borderless: false } : null}
          style={styles.titleWrap}
          accessibilityLabel={title}
          accessibilityHint={onTitlePress ? 'Double tap to scroll to top or open section' : undefined}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.title, { color: textColor }]}
          >
            {title}
          </Text>
        </Pressable>

        {/* Right: Bell or custom */}
        <View style={[styles.sideBox, { alignItems: 'flex-end' }]}>
          {rightComponent
            ? rightComponent
            : showBell && (
                <Pressable
                  onPress={onBellPress}
                  disabled={!onBellPress}
                  hitSlop={TOUCH_HITSLOP}
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  android_ripple={{ borderless: false }}
                  style={styles.iconButton}
                >
                  <View>
                    <Ionicons
                      name="notifications-outline"
                      size={24}
                      color={iconColor}
                    />
                    {unreadCount > 0 && (
                      <View style={styles.badge} accessibilityLabel={`${unreadCount} unread`} />
                    )}
                  </View>
                </Pressable>
              )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
    }),
  },
  sideBox: {
    width: 56,
    justifyContent: 'center',
  },
  iconButton: {
    height: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
});

export default memo(AppHeader);