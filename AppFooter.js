import React, { useEffect, useRef, useContext, useState, memo } from 'react';
import { View, Text, StyleSheet, Platform, Animated, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';

const AppFooter = ({ footerText = `© ${new Date().getFullYear()} AIHCA - Jiwaji University`, style, textStyle, animated = true, colors: colorsProp }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';

  const insets = useSafeAreaInsets();

  const backgroundColor = colorsProp?.background || theme?.colors?.footer || (isDark ? '#1c1c1e' : '#0A3D62');
  const borderColor = colorsProp?.border || theme?.colors?.footerBorder || (isDark ? '#444' : '#ccc');
  const fontColor = colorsProp?.text || theme?.colors?.footerText || (isDark ? '#e0e0e0' : '#FFFFFF');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    if (reduceMotion || !animated) {
      fadeAnim.setValue(1);
      loopRef.current?.stop?.();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    loopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [fadeAnim, reduceMotion, animated]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={`App footer. ${footerText}`}
      testID="app-footer"
      style={[
        styles.footer,
        {
          backgroundColor,
          borderTopColor: borderColor,
          opacity: fadeAnim,
          paddingBottom: styles.footer.paddingVertical + insets.bottom,
        },
        Platform.select({
          ios: isDark ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
          } : {},
          android: { elevation: 4 },
        }),
        style, // ← user style last so it can override
      ]}
    >
      <Text
        style={[styles.text, { color: fontColor }, textStyle]}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {footerText}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  text: {
    fontSize: 13,
  },
});

export default memo(AppFooter);