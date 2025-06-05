import { View, Text, StyleSheet, ActivityIndicator } from "react-native"

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Homepass</Text>
      <Text style={styles.subtitle}>Household Management</Text>
      <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
})
