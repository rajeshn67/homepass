"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"

export default function HouseholdModal({ visible, onClose, type, onSuccess }) {
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      Alert.alert("Error", `Please enter a ${type === "create" ? "household name" : "invite code"}`)
      return
    }

    setLoading(true)
    try {
      const token = await SecureStore.getItemAsync("userToken")

      if (type === "create") {
        const response = await fetch(`${API_URL}/api/users/create-household`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: inputValue.trim() }),
        })

        const data = await response.json()
        if (response.ok) {
          Alert.alert("Success", `Household "${inputValue}" created!\n\nInvite code: ${data.inviteCode}`, [
            {
              text: "OK",
              onPress: () => {
                setInputValue("")
                onClose()
                onSuccess()
              },
            },
          ])
        } else {
          Alert.alert("Error", data.message || "Failed to create household")
        }
      } else {
        const response = await fetch(`${API_URL}/api/users/join-household`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inviteCode: inputValue.trim().toUpperCase() }),
        })

        const data = await response.json()
        if (response.ok) {
          Alert.alert("Success", `Successfully joined "${data.household.name}"!`, [
            {
              text: "OK",
              onPress: () => {
                setInputValue("")
                onClose()
                onSuccess()
              },
            },
          ])
        } else {
          Alert.alert("Error", data.message || "Failed to join household")
        }
      }
    } catch (error) {
      console.error(`${type} household error:`, error)
      Alert.alert("Error", "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setInputValue("")
    onClose()
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{type === "create" ? "Create Household" : "Join Household"}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>{type === "create" ? "Household Name" : "Invite Code"}</Text>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={type === "create" ? "Enter household name" : "Enter invite code"}
              autoCapitalize={type === "create" ? "words" : "characters"}
              autoCorrect={false}
              maxLength={type === "create" ? 50 : 6}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>{type === "create" ? "Create" : "Join"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8ED",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1E8ED",
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#7F8C8D",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#4A90E2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#BDC3C7",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
