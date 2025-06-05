"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"

export default function ChoresScreen() {
  const [chores, setChores] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadChores()
  }, [])

  const loadChores = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/chores`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setChores(data)
      }
    } catch (error) {
      console.error("Error loading chores:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadChores()
    setRefreshing(false)
  }

  const updateChoreStatus = async (choreId, status) => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/chores/${choreId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        loadChores()
        Alert.alert("Success", `Chore marked as ${status}!`)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update chore status")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#27AE60"
      case "in-progress":
        return "#F39C12"
      default:
        return "#E74C3C"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#E74C3C"
      case "medium":
        return "#F39C12"
      default:
        return "#27AE60"
    }
  }

  const renderChore = ({ item }) => (
    <View style={styles.choreCard}>
      <View style={styles.choreHeader}>
        <Text style={styles.choreTitle}>{item.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>

      {item.description && <Text style={styles.choreDescription}>{item.description}</Text>}

      <Text style={styles.choreDue}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
      <Text style={styles.choreAssigned}>Assigned to: {item.assignedTo.fullName}</Text>

      <View style={styles.choreFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace("-", " ").toUpperCase()}</Text>
        </View>

        {item.status !== "completed" && (
          <View style={styles.actionButtons}>
            {item.status === "pending" && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#F39C12" }]}
                onPress={() => updateChoreStatus(item._id, "in-progress")}
              >
                <Text style={styles.actionButtonText}>Start</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#27AE60" }]}
              onPress={() => updateChoreStatus(item._id, "completed")}
            >
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={chores}
        renderItem={renderChore}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No chores yet</Text>
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
  choreCard: {
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
  choreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  choreDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  choreDue: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  choreAssigned: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 12,
  },
  choreFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
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
