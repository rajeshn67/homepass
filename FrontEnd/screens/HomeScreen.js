"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"
import HouseholdModal from "../components/HouseholdModal"
import AddItemModal from "../components/AddItemModal"

export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    pendingBills: 0,
    pendingChores: 0,
    groceryItems: 0,
    totalExpenses: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [householdModalVisible, setHouseholdModalVisible] = useState(false)
  const [addItemModalVisible, setAddItemModalVisible] = useState(false)
  const [modalType, setModalType] = useState("create") // 'create' or 'join'
  const [addItemType, setAddItemType] = useState("bill") // 'bill', 'chore', 'grocery', 'expense'

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (userData && userData.householdId) {
      loadDashboardData()
    }
  }, [userData])

  const loadUserData = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync("userData")
      if (userDataString) {
        const user = JSON.parse(userDataString)
        setUserData(user)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const refreshUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const updatedUser = await response.json()
        const userForStorage = {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          householdId: updatedUser.householdId,
          role: updatedUser.role,
        }
        await SecureStore.setItemAsync("userData", JSON.stringify(userForStorage))
        setUserData(userForStorage)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  const loadDashboardData = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      if (!token) return

      let pendingBills = 0
      let pendingChores = 0
      let groceryItems = 0
      let totalExpenses = 0

      // Load bills with error handling
      try {
        const billsResponse = await fetch(`${API_URL}/api/bills`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (billsResponse.ok) {
          const bills = await billsResponse.json()
          if (Array.isArray(bills)) {
            pendingBills = bills.filter((bill) => bill.status === "pending").length
          }
        }
      } catch (error) {
        console.error("Error loading bills:", error)
      }

      // Load chores with error handling
      try {
        const choresResponse = await fetch(`${API_URL}/api/chores`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (choresResponse.ok) {
          const chores = await choresResponse.json()
          if (Array.isArray(chores)) {
            pendingChores = chores.filter((chore) => chore.status === "pending").length
          }
        }
      } catch (error) {
        console.error("Error loading chores:", error)
      }

      // Load groceries with error handling
      try {
        const groceriesResponse = await fetch(`${API_URL}/api/groceries`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (groceriesResponse.ok) {
          const groceries = await groceriesResponse.json()
          if (Array.isArray(groceries)) {
            groceryItems = groceries.reduce(
              (total, list) => total + (list.items ? list.items.filter((item) => !item.purchased).length : 0),
              0,
            )
          }
        }
      } catch (error) {
        console.error("Error loading groceries:", error)
      }

      // Load expenses summary with error handling
      try {
        const expensesResponse = await fetch(`${API_URL}/api/expenses/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (expensesResponse.ok) {
          const expensesSummary = await expensesResponse.json()
          totalExpenses = expensesSummary.totalExpenses || 0
        }
      } catch (error) {
        console.error("Error loading expenses:", error)
      }

      setDashboardData({
        pendingBills,
        pendingChores,
        groceryItems,
        totalExpenses,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshUserData()
    if (userData && userData.householdId) {
      await loadDashboardData()
    }
    setRefreshing(false)
  }

  const handleCreateHousehold = () => {
    setModalType("create")
    setHouseholdModalVisible(true)
  }

  const handleJoinHousehold = () => {
    setModalType("join")
    setHouseholdModalVisible(true)
  }

  const handleAddItem = (type) => {
    setAddItemType(type)
    setAddItemModalVisible(true)
  }

  const handleModalSuccess = async () => {
    await refreshUserData()
  }

  const handleAddItemSuccess = async () => {
    await loadDashboardData()
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {userData.fullName}!</Text>
          <Text style={styles.subGreeting}>Welcome to Homepass</Text>
        </View>

        {!userData.householdId ? (
          <View style={styles.noHouseholdContainer}>
            <Ionicons name="home-outline" size={64} color="#BDC3C7" style={styles.noHouseholdIcon} />
            <Text style={styles.noHouseholdText}>You're not part of any household yet</Text>
            <Text style={styles.noHouseholdSubtext}>Create a new household or join an existing one to get started</Text>
            <TouchableOpacity style={styles.button} onPress={handleCreateHousehold}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Create Household</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleJoinHousehold}>
              <Ionicons name="people-outline" size={20} color="#4A90E2" style={styles.buttonIcon} />
              <Text style={styles.buttonSecondaryText}>Join Household</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <TouchableOpacity
                  style={[styles.statCard, { backgroundColor: "#FF6B6B" }]}
                  onPress={() => navigation.navigate("Bills")}
                >
                  <Ionicons name="receipt-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{dashboardData.pendingBills}</Text>
                  <Text style={styles.statLabel}>Pending Bills</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statCard, { backgroundColor: "#4ECDC4" }]}
                  onPress={() => navigation.navigate("Chores")}
                >
                  <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{dashboardData.pendingChores}</Text>
                  <Text style={styles.statLabel}>Pending Chores</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsRow}>
                <TouchableOpacity
                  style={[styles.statCard, { backgroundColor: "#45B7D1" }]}
                  onPress={() => navigation.navigate("Groceries")}
                >
                  <Ionicons name="basket-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{dashboardData.groceryItems}</Text>
                  <Text style={styles.statLabel}>Grocery Items</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statCard, { backgroundColor: "#F7B731" }]}
                  onPress={() => navigation.navigate("Expenses")}
                >
                  <Ionicons name="card-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>${dashboardData.totalExpenses.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Total Expenses</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <View style={styles.actionGroup}>
                  <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("Bills")}>
                    <Ionicons name="receipt" size={32} color="#4A90E2" />
                    <Text style={styles.actionText}>View Bills</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addActionButton} onPress={() => handleAddItem("bill")}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionGroup}>
                  <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("Chores")}>
                    <Ionicons name="checkmark-circle" size={32} color="#4A90E2" />
                    <Text style={styles.actionText}>View Chores</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addActionButton} onPress={() => handleAddItem("chore")}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionGroup}>
                  <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("Groceries")}>
                    <Ionicons name="basket" size={32} color="#4A90E2" />
                    <Text style={styles.actionText}>Groceries</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addActionButton} onPress={() => handleAddItem("grocery")}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionGroup}>
                  <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("Expenses")}>
                    <Ionicons name="card" size={32} color="#4A90E2" />
                    <Text style={styles.actionText}>Expenses</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addActionButton} onPress={() => handleAddItem("expense")}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <HouseholdModal
        visible={householdModalVisible}
        onClose={() => setHouseholdModalVisible(false)}
        type={modalType}
        onSuccess={handleModalSuccess}
      />

      <AddItemModal
        visible={addItemModalVisible}
        onClose={() => setAddItemModalVisible(false)}
        type={addItemType}
        onSuccess={handleAddItemSuccess}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8ED",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  subGreeting: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 4,
  },
  noHouseholdContainer: {
    padding: 40,
    alignItems: "center",
  },
  noHouseholdIcon: {
    marginBottom: 20,
  },
  noHouseholdText: {
    fontSize: 18,
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  noHouseholdSubtext: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: "#4A90E2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonSecondaryText: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 4,
    textAlign: "center",
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionGroup: {
    width: "48%",
    marginBottom: 16,
    position: "relative",
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    fontSize: 14,
    color: "#2C3E50",
    marginTop: 8,
    textAlign: "center",
  },
  addActionButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#27AE60",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
