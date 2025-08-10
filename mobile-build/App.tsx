import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';

const BoomerBuddyApp = () => {
  const checkForScams = () => {
    Alert.alert('Boomer Buddy', 'Scam detection activated! Your device is now protected.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛡️ Boomer Buddy</Text>
      <Text style={styles.subtitle}>Your Digital Safety Companion</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkForScams}>
        <Text style={styles.buttonText}>Start Protection</Text>
      </TouchableOpacity>
      
      <View style={styles.features}>
        <Text style={styles.feature}>✓ Call Screening</Text>
        <Text style={styles.feature}>✓ SMS Protection</Text>
        <Text style={styles.feature}>✓ Scam Detection</Text>
        <Text style={styles.feature}>✓ Real-time Alerts</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#17948E'},
  title: {fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10},
  subtitle: {fontSize: 18, color: 'white', marginBottom: 30},
  button: {backgroundColor: '#E3400B', padding: 20, borderRadius: 10, marginBottom: 30},
  buttonText: {color: 'white', fontSize: 18, fontWeight: 'bold'},
  features: {alignItems: 'center'},
  feature: {color: 'white', fontSize: 16, marginVertical: 5}
});

export default BoomerBuddyApp;
