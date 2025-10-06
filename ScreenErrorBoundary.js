import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default class ScreenErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(error){ return { hasError: true, err: error }; }
  componentDidCatch(error, info){ console.error('Screen crashed:', error, info); }

  render(){
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.centered}>
          <Text style={styles.title}>Something went wrong.</Text>
          <Text style={styles.msg}>{String(this.state.err || '')}</Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  centered:{ flex:1, alignItems:'center', justifyContent:'center', padding:16 },
  title:{ fontSize:16, fontWeight:'700', marginBottom:8 },
  msg:{ fontSize:12, opacity:0.7, textAlign:'center' },
});