"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadExpenses()
    loadSummary()
  }, [])

  const loadExpenses = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error("Error loading expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/expenses/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error("Error loading summary:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadExpenses()
    await loadSummary()
    setRefreshing(false)
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "food":
        return "restaurant"
      case "transportation":
        return "car"
      case "entertainment":
        return "game-controller"
      case "utilities":
        return "flash"
      case "healthcare":
        return "medical"
      case "shopping":
        return "bag"
      default:
        return "card"
    }
  }

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Ionicons name={getCategoryIcon(item.category)} size={24} color="#4A90E2" style={styles.categoryIcon} />
          <View>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text style={styles.expenseCategory}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </View>

      {item.description && <Text style={styles.expenseDescription}>{item.description}</Text>}

      <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
      <Text style={styles.expensePaidBy}>Paid by: {item.paidBy.fullName}</Text>

      {item.splitBetween.length > 1 && (
        <View style={styles.splitInfo}>
          <Text style={styles.splitTitle}>Split between:</Text>
          {item.splitBetween.map((split, index) => (
            <Text key={index} style={styles.splitItem}>
              {split.user.fullName}: ${split.amount.toFixed(2)}
            </Text>
          ))}
        </View>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>${summary.totalExpenses.toFixed(2)}</Text>
        </View>
      )}

      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No expenses yet</Text>
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
  summaryCard: {
    backgroundColor: "#4A90E2",
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
  },
  summaryAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
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
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  expenseInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  expenseCategory: {
    fontSize: 14,
    color: "#7F8C8D",
    textTransform: "capitalize",
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E74C3C",
  },
  expenseDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  expenseDate: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  expensePaidBy: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  splitInfo: {
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
    paddingTop: 8,
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  splitItem: {
    fontSize: 14,
    color: "#7F8C8D",
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
