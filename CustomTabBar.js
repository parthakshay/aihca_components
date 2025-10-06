import React, { useRef, useEffect, useContext, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Platform } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_PADDING_H = 16;
const INDICATOR_HEIGHT = 2;

const CustomTabBar = ({ state, descriptors, navigation, colors: colorsProp, testID = 'custom-tab-bar' }) => {
  const { theme } = useContext(ThemeContext) || {};
  const isDark = theme?.mode === 'dark';
  const insets = useSafeAreaInsets();

  const bg = colorsProp?.background || theme?.colors?.tabBar || (isDark ? '#111315' : '#ffffff');
  const border = colorsProp?.border || theme?.colors?.tabBarBorder || (isDark ? '#2a2a2a' : '#e5e5e5');
  const color = colorsProp?.text || theme?.colors?.tabBarText || (isDark ? '#cfcfcf' : '#555555');
  const active = colorsProp?.activeText || theme?.colors?.tabBarActiveText || (isDark ? '#ffffff' : '#000000');
  const accent = colorsProp?.accent || theme?.colors?.tabBarAccent || (isDark ? '#7aa2f7' : '#0A3D62');

  const scrollRef = useRef(null);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef({}); // { route.key: { x, w } }

  // Scroll active tab into view and move indicator
  const animateToIndex = useCallback((index) => {
    const route = state.routes[index];
    const layout = tabLayouts.current[route.key];
    if (!layout) return;

    Animated.parallel([
      Animated.timing(indicatorX, { toValue: layout.x + TAB_PADDING_H, duration: 180, useNativeDriver: false }),
      Animated.timing(indicatorW, { toValue: layout.w - TAB_PADDING_H * 2, duration: 180, useNativeDriver: false }),
    ]).start();

    // Center active tab if possible
    if (scrollRef.current && layout) {
      scrollRef.current.scrollTo({ x: Math.max(0, layout.x - 48), animated: true });
    }
  }, [indicatorX, indicatorW, state.routes]);

  useEffect(() => {
    // Try to animate after first measure as well
    const id = setTimeout(() => animateToIndex(state.index), 0);
    return () => clearTimeout(id);
  }, [state.index, animateToIndex]);

  const handlePressFactory = useCallback((route, index) => () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented && state.index !== index) {
      navigation.navigate(route.name);
    }
  }, [navigation, state.index]);

  const handleLongPressFactory = useCallback((route) => () => {
    navigation.emit({ type: 'tabLongPress', target: route.key });
  }, [navigation]);

  return (
    <View testID={testID} style={[styles.wrap, { backgroundColor: bg, borderTopColor: border, paddingBottom: insets.bottom }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        keyboardShouldPersistTaps="handled"
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const onPress = handlePressFactory(route, index);
          const onLongPress = handleLongPressFactory(route);
          const tint = isFocused ? active : color;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel || String(label)}
              testID={options.tabBarTestID}
              android_ripple={{ borderless: false }}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                tabLayouts.current[route.key] = { x, w: width };
                if (isFocused) animateToIndex(index);
              }}
              style={styles.tabItem}
            >
              <View style={styles.tabInner}>
                {typeof options.tabBarIcon === 'function'
                  ? options.tabBarIcon({ focused: isFocused, color: tint, size: 18 })
                  : null}
                <Text numberOfLines={1} style={[styles.tabLabel, { color: tint }]}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {/* Indicator */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { backgroundColor: accent, transform: [{ translateX: indicatorX }], width: indicatorW },
          ]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
    }),
  },
  tabBar: {
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: TAB_PADDING_H,
    height: 56,
    justifyContent: 'center',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: 220,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT,
  },
});

export default memo(CustomTabBar);