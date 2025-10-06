import React, { useMemo, useState, memo, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import semesterSubjects from '../data/semesterSubjects';
import { useTheme } from '../theme/ThemeContext';

const TOUCH = { top: 8, bottom: 8, left: 8, right: 8 };

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: theme.background },
    header: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: theme.text },
    back: { color: theme.primary, marginBottom: 10, fontWeight: '600' },
    item: {
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border || theme.outline || 'rgba(128,128,128,0.25)',
      borderRadius: 8,
      marginVertical: 4,
      backgroundColor: theme.card || theme.surface || theme.background,
      ...Platform.select({
        android: { elevation: 1 },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
        },
      }),
    },
    itemText: { color: theme.text, fontSize: 16 },
    list: { flexGrow: 0 },
  });

const SubjectPicker = ({ onSubjectPress, onSemesterChange, initialSemester = null, colors: colorsProp, testID = 'subjects-picker' }) => {
  const { theme } = useTheme();
  const t = theme || {};
  const [selectedSemester, setSelectedSemester] = useState(initialSemester);

  const mergedTheme = {
    ...t,
    background: colorsProp?.background ?? t.background,
    text: colorsProp?.text ?? t.text,
    primary: colorsProp?.primary ?? t.primary,
    border: colorsProp?.border ?? t.border,
    outline: colorsProp?.outline ?? t.outline,
    card: colorsProp?.card ?? t.card,
    surface: colorsProp?.surface ?? t.surface,
  };
  const styles = getStyles(mergedTheme);

  const semesters = useMemo(() => Object.keys(semesterSubjects), []);
  const subjects = useMemo(
    () => (selectedSemester ? semesterSubjects[selectedSemester] || [] : []),
    [selectedSemester]
  );

  const handleSubjectPress = useCallback(
    (subject) => {
      if (onSubjectPress) onSubjectPress(subject);
    },
    [onSubjectPress]
  );

  const selectSemester = useCallback(
    (sem) => {
      setSelectedSemester(sem);
      if (onSemesterChange) onSemesterChange(sem);
    },
    [onSemesterChange]
  );

  const renderSemester = ({ item }) => (
    <Pressable
      onPress={() => selectSemester(item)}
      hitSlop={TOUCH}
      android_ripple={{ borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item}`}
      style={styles.item}
    >
      <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">{item}</Text>
    </Pressable>
  );

  const renderSubject = ({ item }) => (
    <Pressable
      onPress={() => handleSubjectPress(item)}
      hitSlop={TOUCH}
      android_ripple={{ borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`Subject: ${item?.name || 'Unknown'}`}
      style={styles.item}
    >
      <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">{item?.name || 'Untitled'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container} testID={testID}>
      {!selectedSemester ? (
        <>
          <Text style={styles.header}>Choose a Semester</Text>
          <FlatList
            data={semesters}
            keyExtractor={(item) => `sem-${item}`}
            renderItem={renderSemester}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            testID="semesters-list"
          />
          {semesters.length === 0 && (
            <Text style={styles.itemText}>No semesters available</Text>
          )}
        </>
      ) : (
        <>
          <Pressable
            onPress={() => selectSemester(null)}
            hitSlop={TOUCH}
            accessibilityRole="button"
            accessibilityLabel="Back to semesters"
          >
            <Text style={styles.back}>{'‹ Back to Semesters'}</Text>
          </Pressable>
          <Text style={styles.header}>Subjects in {selectedSemester}</Text>
          <FlatList
            data={subjects}
            keyExtractor={(item, idx) => `sub-${item?.name || 'x'}-${idx}`}
            renderItem={renderSubject}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            testID="subjects-list"
          />
          {subjects.length === 0 && (
            <Text style={styles.itemText}>No subjects available</Text>
          )}
        </>
      )}
    </View>
  );
};

export default memo(SubjectPicker);