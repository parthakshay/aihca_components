import React, { useContext, useState, memo } from 'react';
import { Pressable, View, StyleSheet, Linking, Text, Alert, Platform, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

const TOUCH_HITSLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const BuyMeCoffeeButton = ({
  url = 'https://www.buymeacoffee.com/parthakshay',
  label = 'Buy me a coffee',
  style,
  textStyle,
  onPress,        // if provided, overrides default open
  iconSize = 18,
  iconName = 'coffee',
  openInApp = true, // prefer in-app browser when available
  colors: colorsProp,
  testID = 'buy-coffee-button',
}) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  const [busy, setBusy] = useState(false);

  const bg = colorsProp?.background || theme?.colors?.cta || (isDark ? '#1c1c1e' : '#f5dd4b');
  const border = colorsProp?.border || theme?.colors?.ctaBorder || (isDark ? '#555' : '#000');
  const fg = colorsProp?.text || theme?.colors?.ctaText || (isDark ? '#fff' : '#000');

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (onPress) {
        await onPress();
      } else if (openInApp && WebBrowser?.openBrowserAsync) {
        await WebBrowser.openBrowserAsync(url, { enableBarCollapsing: true, showTitle: true });
      } else {
        const supported = await Linking.canOpenURL(url);
        if (!supported) throw new Error('Cannot open this URL');
        await Linking.openURL(url);
      }
    } catch (e) {
      Alert.alert('Unable to open link', 'Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        disabled={busy}
        hitSlop={TOUCH_HITSLOP}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Opens support link in browser"
        testID={testID}
        android_ripple={Platform.OS === 'android' ? { borderless: false } : undefined}
        style={[
          styles.button,
          { backgroundColor: bg, borderColor: border, opacity: busy ? 0.7 : 1 },
          Platform.select({
            android: { elevation: 2 },
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
            },
          }),
          style,
        ]}
      >
        <View style={styles.innerContent}>
          {busy ? (
            <ActivityIndicator size="small" color={fg} style={{ marginRight: 8 }} />
          ) : (
            <FontAwesome5 name={iconName} size={iconSize} color={fg} style={{ marginRight: 8 }} />
          )}
          <Text
            style={[styles.text, { color: fg }, textStyle]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.9}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default memo(BuyMeCoffeeButton);