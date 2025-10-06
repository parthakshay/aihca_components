import React, { useContext, useMemo, useState, memo } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Image, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DrivePopup from './DrivePopup';
import { ThemeContext } from '../theme/ThemeContext'; // ensure this casing matches the actual file

const getDriveFileId = (link) => {
  if (!link || typeof link !== 'string') return null;
  // Supports ...open?id=... and .../file/d/<id>/...
  const idFromOpen = link.match(/open\?id=([\-\w]{10,})/);
  const idFromFile = link.match(/file\/d\/([\-\w]{10,})/);
  return idFromOpen?.[1] || idFromFile?.[1] || null;
};

const InscriptionModal = ({ visible, inscription, onClose, colors: colorsProp, testID = 'inscription-modal' }) => {
  const { theme } = useContext(ThemeContext) || {};
  const isDark = theme?.mode === 'dark';
  const [showDrivePopup, setShowDrivePopup] = useState(false);
  const [imageError, setImageError] = useState(false);


  const fileId = useMemo(() => getDriveFileId(inscription?.image), [inscription?.image]);
  const imageUri = fileId ? `https://drive.google.com/uc?export=preview&id=${fileId}` : null;
  const popupUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;

  const palette = useMemo(() => ({
    overlay: colorsProp?.overlay || theme?.colors?.overlay || '#000a',
    cardBg: colorsProp?.card || theme?.colors?.card || (isDark ? '#222' : '#f7f7f7'),
    border: colorsProp?.border || theme?.colors?.border || (isDark ? '#444' : '#ddd'),
    title: colorsProp?.title || theme?.colors?.heading || (isDark ? '#fff' : '#111'),
    closeIcon: colorsProp?.closeIcon || theme?.colors?.mutedIcon || '#fff',
    inscription: colorsProp?.inscription || theme?.colors?.accent || '#0ff',
    details: colorsProp?.details || theme?.colors?.text || (isDark ? '#ccc' : '#333'),
    provenance: colorsProp?.provenance || theme?.colors?.provenance || '#ff9',
  }), [isDark, theme, colorsProp]);

  // Bail early only after all hooks are declared to preserve hook order
  if (!inscription) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
    >
      <View style={[styles.overlay, { backgroundColor: palette.overlay }]}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safe} testID={testID}>
          <ScrollView contentContainerStyle={[styles.popup, { backgroundColor: palette.cardBg }]}
                      keyboardShouldPersistTaps="handled">
            <Pressable onPress={onClose} style={styles.closeButton}
                       accessibilityRole="button" accessibilityLabel="Close" testID="inscription-modal-close">
              <Ionicons name="close" size={24} color={palette.closeIcon} />
            </Pressable>

            <Text style={[styles.title, { color: palette.title }]} numberOfLines={2} ellipsizeMode="tail" testID="inscription-modal-title">
              {inscription.title}
            </Text>

            {imageUri && !imageError ? (
              <Pressable onPress={() => setShowDrivePopup(true)} style={{ borderRadius: 10, overflow: 'hidden' }}
                         accessibilityRole="imagebutton" accessibilityLabel="Open image preview" testID="inscription-modal-image">
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" onError={() => setImageError(true)} />
              </Pressable>
            ) : popupUrl ? (
              <Pressable onPress={() => setShowDrivePopup(true)} style={[styles.fallbackBtn, { borderColor: palette.border }]}
                         accessibilityRole="button" accessibilityLabel="Open image preview" testID="inscription-modal-open-preview">
                <Text style={[styles.fallbackText, { color: palette.details }]}>Open Preview</Text>
              </Pressable>
            ) : null}

            <DrivePopup
              visible={showDrivePopup}
              onClose={() => setShowDrivePopup(false)}
              url={popupUrl}
              title={inscription.title}
              colors={{
                background: palette.cardBg,
                header: palette.cardBg,
                border: palette.border,
                text: palette.details,
                link: palette.inscription,
                spinner: palette.inscription,
              }}
            />

            {inscription.inscription ? (
              <Text style={[styles.inscription, { color: palette.inscription }]}> 
                {inscription.inscription}
              </Text>
            ) : null}

            <View>
              {inscription.provenance ? (
                <Text style={[styles.provenance, { color: palette.provenance }]}> 
                  Provenance: {inscription.provenance}
                </Text>
              ) : null}

              {inscription.explanation ? (
                <Text style={[styles.details, { color: palette.details }]}>
                  {inscription.explanation}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default memo(InscriptionModal);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  safe: { flex: 1 },
  popup: {
    borderRadius: 15,
    padding: 20,
    ...Platform.select({
      android: { elevation: 5 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  fallbackBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inscription: {
    fontFamily: 'serif',
    fontSize: 18,
    marginBottom: 10,
  },
  details: {
    fontSize: 16,
  },
  provenance: {
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 10,
  },
});