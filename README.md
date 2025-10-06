# 🧩 AIHCA Components

A modular library of **reusable React Native (Expo) components** built for the **AIHCA App** — *Ancient Indian History, Culture & Archaeology*, a digital learning platform for students of Ancient Indian History, Culture and Archaeology.

![Expo](https://img.shields.io/badge/Expo-49.0.0-000?logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.76-blue?logo=react)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Overview

`aihca_components` provides **standalone UI building blocks** designed for:

- ⚙️ **Expo + React Navigation**
- ☁️ **Google Sheets / Apps Script JSON endpoints**
- 💾 **AsyncStorage caching**
- 🌗 **Dark / Light theme compatibility**

Each component is **stateless**, **offline-first**, and **reusable** across screens, ensuring clean architecture and smooth scalability.

> 🧱 While [`aihca_screens`](https://github.com/parthakshay/aihca_screens) provides full page layouts,  
> this repo contains the *reusable Lego blocks* that power those screens.

---

## 📁 Folder Structure
aihca_components/
├── GradientCard.js
├── NotificationModal.js
├── FlashcardModal.js
├── PDFViewer.js
├── OfflineBanner.js
├── SearchBar.js
├── BookmarkButton.js
├── DropdownFilter.js
├── ImagePreviewModal.js
├── ErrorState.js
├── LoadingSpinner.js
├── DarkModeToggle.js
├── ShareButton.js
├── CacheInfoBar.js
└── index.js

---

## ⚙️ Installation

Clone or add as a submodule into your main app:

 'bash
# Direct clone
git clone https://github.com/parthakshay/aihca_components src/components
# As a submodule
git submodule add https://github.com/parthakshay/aihca_components src/components

# Then import components as needed:
import GradientCard from '../components/GradientCard';
import NotificationModal from '../components/NotificationModal';

# Example Usage
import React from 'react';
import { ScrollView } from 'react-native';
import GradientCard from '../components/GradientCard';
import NotificationModal from '../components/NotificationModal';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <NotificationModal />
      <GradientCard
        title="Syllabus"
        colors={['#4facfe', '#00f2fe']}
        onPress={() => console.log('Navigate to syllabus')}
      />
      <GradientCard
        title="Previous Papers"
        colors={['#43e97b', '#38f9d7']}
      />
    </ScrollView>
  );
}


### 🌗 Theming Support
Every component reads from your theme object:
// src/theme/colors.js
export default {
  light: {
    background: '#ffffff',
    text: '#111111',
    card: '#f2f2f2',
  },
  dark: {
    background: '#000000',
    text: '#f8f8f8',
    card: '#1a1a1a',
  },
};


### 🔔 NotificationModal Example
<NotificationModal
  dataEndpoint="https://script.google.com/macros/s/XXX/exec"
  duration={15000}
  onClose={() => console.log('Notification closed')}
/>


### 💾 Offline Caching (Recommended Pattern)

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function cacheData(key, fetcher, ttlMs = 60000) {
  const cached = await AsyncStorage.getItem(key);
  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < ttlMs) return data;
  }
  const fresh = await fetcher();
  await AsyncStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data: fresh }));
  return fresh;
}


### 🧩 Integration with AIHCA Screens
Used extensively in:
	•	HomeScreen
	•	QuizScreen
	•	MapViewerScreen
	•	InscriptionsScreen
	•	NotesScreen
	•	StudyMaterialScreen
	•	BlogScreen


### 🔗 Related Repositories
	•	AIHCA Clean (Main App)
	•	AIHCA Screens
	•	AIHCA Data (Google Sheets Backend)


### ✉️ Contact

Developer: @parthakshay
Stack: React Native (Expo) · AsyncStorage · Google Apps Script · Offline-first architecture · Theming
