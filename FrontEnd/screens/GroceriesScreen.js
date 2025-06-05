"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"

export default function GroceriesScreen() {
  const [groceryLists, setGroceryLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadGroceryLists()
  }, [])

  const loadGroceryLists = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/groceries`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setGroceryLists(data)
      }
    } catch (error) {
      console.error("Error loading grocery lists:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadGroceryLists()
    setRefreshing(false)
  }

  const markItemAsPurchased = async (listId, itemId) => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/groceries/${listId}/items/${itemId}/purchase`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        loadGroceryLists()
      }
    } catch (error) {
      console.error("Error marking item as purchased:", error)
    }
  }

  const renderGroceryItem = (item, listId) => (
    <View key={item._id} style={[styles.groceryItem, item.purchased && styles.purchasedItem]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.purchased && styles.purchasedText]}>{item.name}</Text>
        <Text style={[styles.itemQuantity, item.purchased && styles.purchasedText]}>{item.quantity}</Text>
      </View>
      {!item.purchased ? (
        <TouchableOpacity style={styles.checkButton} onPress={() => markItemAsPurchased(listId, item._id)}>
          <Ionicons name="checkmark" size={20} color="#27AE60" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
      )}
    </View>
  )

  const renderGroceryList = ({ item }) => (
    <View style={styles.listCard}>
      <Text style={styles.listTitle}>{item.title}</Text>
      <Text style={styles.listCreator}>Created by: {item.createdBy.fullName}</Text>

      <View style={styles.itemsContainer}>
        {item.items.map((groceryItem) => renderGroceryItem(groceryItem, item._id))}
      </View>

      <View style={styles.listStats}>
        <Text style={styles.statsText}>
          {item.items.filter((i) => i.purchased).length} / {item.items.length} completed
        </Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={groceryLists}
        renderItem={renderGroceryList}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No grocery lists yet</Text>
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
  listCard: {
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
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  listCreator: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 12,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  groceryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
  },
  purchasedItem: {
    opacity: 0.6,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: "#2C3E50",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  purchasedText: {
    textDecorationLine: "line-through",
  },
  checkButton: {
    padding: 4,
  },
  listStats: {
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
    paddingTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
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
