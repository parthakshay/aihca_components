import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const MatchingTable = ({
  data,
  leftLabel = 'List I',
  rightLabel = 'List II',
  containerStyle,
  cellStyle,
  headerStyle,
  rowStyle,
  colors: colorsProp,
  testID = 'matching-table',
  colFlex = [1, 1],
}) => {
  const { theme } = useTheme();
  const t = theme || {};
  const palette = {
    border: colorsProp?.border || t.colors?.border || t.border || t.outline || 'rgba(128,128,128,0.25)',
    primary: colorsProp?.primary || t.colors?.primary || t.primary || '#0A3D62',
    onPrimary: colorsProp?.onPrimary || t.colors?.onPrimary || t.onPrimary || '#FFFFFF',
    surface: colorsProp?.surface || t.colors?.surface || t.surface || '#FFFFFF',
    card: colorsProp?.card || t.colors?.card || t.card || '#F6F7F9',
    text: colorsProp?.text || t.colors?.text || t.text || '#111111',
  };
  if (!data || !Array.isArray(data.list1) || !Array.isArray(data.list2)) return null;

  const borderColor = palette.border;
  const rows = useMemo(() => {
    const len = Math.max(data.list1.length, data.list2.length);
    const out = [];
    for (let i = 0; i < len; i++) {
      out.push([data.list1[i] ?? '', data.list2[i] ?? '']);
    }
    return out;
  }, [data.list1, data.list2]);

  return (
    <View
      style={[styles.tableContainer, { borderColor }, containerStyle]}
      accessible
      testID={testID}
    >
      <View
        style={[
          styles.row,
          styles.header,
          { backgroundColor: palette.primary, borderColor },
          headerStyle,
        ]}
      >
        <Text
          style={[
            { flex: colFlex[0] },
            styles.cell,
            styles.headerText,
            { color: palette.onPrimary, borderColor },
            cellStyle,
          ]}
          accessibilityRole="text"
          allowFontScaling
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {leftLabel}
        </Text>
        <Text
          style={[
            { flex: colFlex[1] },
            styles.cell,
            styles.headerText,
            { color: palette.onPrimary, borderColor },
            cellStyle,
            styles.noRightBorder,
          ]}
          accessibilityRole="text"
          allowFontScaling
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {rightLabel}
        </Text>
      </View>

      {rows.map(([l, r], index) => (
        <View
          key={`row-${index}`}
          style={[
            styles.row,
            { backgroundColor: index % 2 === 0 ? palette.surface : palette.card, borderColor },
            rowStyle,
          ]}
        >
          <Text
            style={[
              { flex: colFlex[0] },
              styles.cell,
              { color: palette.text, borderColor },
              cellStyle,
            ]}
            accessibilityRole="text"
            allowFontScaling
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {l}
          </Text>
          <Text
            style={[
              { flex: colFlex[1] },
              styles.cell,
              { color: palette.text, borderColor },
              cellStyle,
              styles.noRightBorder,
            ]}
            accessibilityRole="text"
            allowFontScaling
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {r}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    borderWidth: 1,
    marginVertical: 15,
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    padding: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    textAlign: 'left',
    fontSize: 14,
  },
  noRightBorder: {
    borderRightWidth: 0,
  },
});

export default memo(MatchingTable);