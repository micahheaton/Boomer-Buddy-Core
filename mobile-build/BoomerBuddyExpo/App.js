import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const activateProtection = () => {
    Alert.alert(
      '🛡️ Boomer Buddy Active',
      'Your device is now protected! Real-time scam detection is monitoring your calls and messages.',
      [{ text: 'Great!', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛡️ Boomer Buddy</Text>
      <Text style={styles.subtitle}>Your Digital Safety Companion</Text>
      
      <TouchableOpacity style={styles.button} onPress={activateProtection}>
        <Text style={styles.buttonText}>🚀 Start Protection</Text>
      </TouchableOpacity>
      
      <View style={styles.features}>
        <Text style={styles.feature}>✓ Call Screening Active</Text>
        <Text style={styles.feature}>✓ SMS Protection Enabled</Text>
        <Text style={styles.feature}>✓ Scam Detection Online</Text>
        <Text style={styles.feature}>✓ Real-time Government Alerts</Text>
        <Text style={styles.feature}>✓ Emergency Family Alerts</Text>
      </View>
      
      <Text style={styles.footer}>Protecting seniors from digital threats since 2025</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17948E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#E8F7F6',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#E3400B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  features: {
    alignItems: 'center',
    marginBottom: 30,
  },
  feature: {
    color: 'white',
    fontSize: 16,
    marginVertical: 4,
    textAlign: 'center',
  },
  footer: {
    color: '#E8F7F6',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
