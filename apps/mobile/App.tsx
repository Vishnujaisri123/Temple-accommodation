import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';

// This is a minimal React Native representation of the web App
export default function App() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vadapalli Temple</Text>
        <Text style={styles.subtitle}>Accommodation Booking</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Room 1</Text>
        <Text style={styles.price}>₹1,000 / day</Text>
        <Text style={styles.description}>Max 2 Adults, 2 Children</Text>
        <Button title="Book Now" color="#f59e0b" onPress={() => {}} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hall (Shared)</Text>
        <Text style={styles.price}>₹300 / bed / day</Text>
        <Text style={styles.description}>5 Individual Beds Available</Text>
        <Button title="Check Availability" color="#0d9488" onPress={() => {}} />
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 5,
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 18,
    color: '#f59e0b',
    marginTop: 5,
    marginBottom: 10,
  },
  description: {
    color: '#64748b',
    marginBottom: 15,
  }
});
