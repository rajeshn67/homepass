"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"

export default function BillsScreen() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/bills`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setBills(data)
      }
    } catch (error) {
      console.error("Error loading bills:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadBills()
    setRefreshing(false)
  }

  const markAsPaid = async (billId) => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/bills/${billId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "paid" }),
      })

      if (response.ok) {
        loadBills()
        Alert.alert("Success", "Bill marked as paid!")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update bill status")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "#27AE60"
      case "overdue":
        return "#E74C3C"
      default:
        return "#F39C12"
    }
  }

  const renderBill = ({ item }) => (
    <View style={styles.billCard}>
      <View style={styles.billHeader}>
        <Text style={styles.billTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
      <Text style={styles.billDue}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
      <Text style={styles.billAssigned}>Assigned to: {item.assignedTo.fullName}</Text>

      {item.status === "pending" && (
        <TouchableOpacity style={styles.payButton} onPress={() => markAsPaid(item._id)}>
          <Text style={styles.payButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={bills}
        renderItem={renderBill}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No bills yet</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  listContainer: {
    padding: 16,
  },
  billCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  billAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E74C3C",
    marginBottom: 4,
  },
  billDue: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  billAssigned: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 12,
  },
  payButton: {
    backgroundColor: "#27AE60",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#BDC3C7",
    marginTop: 16,
  },
})
