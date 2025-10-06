import React, { forwardRef, memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

/**
 * ScreenWrapper
 * - Provides a themed SafeArea background
 * - Uses ScrollView by default with proper contentContainer padding
 * - Supports non-scrollable layout via View
 * - Handles StatusBar style based on theme
 * - Optional pull-to-refresh and scroll indicator control
 */
const ScreenWrapper = forwardRef(
  (
    {
      children,
      scrollable = true,
      style,
      contentPadding = 20,
      contentContainerStyle,
      showsVerticalScrollIndicator = false,
      safeEdges = ['top', 'bottom'],
      onRefresh, // optional pull-to-refresh
      refreshing,
      header = null,
      footer = null,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isDark = theme?.mode === 'dark';

    const background = theme?.background ?? (isDark ? '#000' : '#FAFAFA');
    const barStyle = isDark ? 'light-content' : 'dark-content';

    const Wrapper = scrollable ? ScrollView : View;

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={safeEdges}>
        <StatusBar translucent={false} backgroundColor={background} barStyle={barStyle} />

        {header}

        {scrollable ? (
          <Wrapper
            ref={ref}
            style={[styles.baseBg, { backgroundColor: background }, style]}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: contentPadding, paddingHorizontal: 16, paddingTop: 20 },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
            refreshControl={
              onRefresh
                ? (
                  <RefreshControl
                    refreshing={!!refreshing}
                    onRefresh={onRefresh}
                    progressViewOffset={0}
                    tintColor={isDark ? '#fff' : undefined}
                    titleColor={isDark ? '#fff' : undefined}
                  />
                  )
                : undefined
            }
          >
            {children}
          </Wrapper>
        ) : (
          <Wrapper
            ref={ref}
            style={[
              styles.container,
              { backgroundColor: background, paddingBottom: contentPadding },
              style,
            ]}
          >
            {children}
          </Wrapper>
        )}

        {footer}
      </SafeAreaView>
    );
  }
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  baseBg: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  scrollContent: {
    // Padding is applied here for ScrollView only
  },
});

export default memo(ScreenWrapper);