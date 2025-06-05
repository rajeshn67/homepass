"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"

export default function AddItemModal({ visible, onClose, type, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [householdMembers, setHouseholdMembers] = useState([])

  // Form states for different types
  const [formData, setFormData] = useState({
    // Bill fields
    title: "",
    amount: "",
    dueDate: "",
    category: "other",
    assignedTo: "",

    // Chore fields
    description: "",
    priority: "medium",

    // Grocery fields
    items: [{ name: "", quantity: "", category: "other", priority: "medium" }],

    // Expense fields
    splitBetween: [],
  })

  useEffect(() => {
    if (visible) {
      loadHouseholdMembers()
      resetForm()
    }
  }, [visible, type])

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      dueDate: "",
      category: "other",
      assignedTo: "",
      description: "",
      priority: "medium",
      items: [{ name: "", quantity: "", category: "other", priority: "medium" }],
      splitBetween: [],
    })
  }

  const loadHouseholdMembers = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.householdId && data.householdId.members) {
          // Get detailed member info
          const memberPromises = data.householdId.members.map(async (memberId) => {
            try {
              const memberResponse = await fetch(`${API_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (memberResponse.ok) {
                const memberData = await memberResponse.json()
                return { id: memberData._id, name: memberData.fullName }
              }
            } catch (error) {
              console.error("Error loading member:", error)
            }
            return null
          })

          const members = await Promise.all(memberPromises)
          setHouseholdMembers(members.filter(Boolean))
        }
      }
    } catch (error) {
      console.error("Error loading household members:", error)
    }
  }

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addGroceryItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: "", category: "other", priority: "medium" }],
    }))
  }

  const updateGroceryItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const removeGroceryItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const token = await SecureStore.getItemAsync("userToken")
      let endpoint = ""
      let body = {}

      switch (type) {
        case "bill":
          endpoint = "/api/bills"
          body = {
            title: formData.title,
            amount: Number.parseFloat(formData.amount),
            dueDate: new Date().toISOString(), // You might want to add a date picker
            category: formData.category,
            assignedTo: formData.assignedTo,
          }
          break

        case "chore":
          endpoint = "/api/chores"
          body = {
            title: formData.title,
            description: formData.description,
            assignedTo: formData.assignedTo,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            priority: formData.priority,
            category: formData.category,
          }
          break

        case "grocery":
          endpoint = "/api/groceries"
          body = {
            title: formData.title || "Grocery List",
            items: formData.items.filter((item) => item.name.trim()),
          }
          break

        case "expense":
          endpoint = "/api/expenses"
          const currentUser = await SecureStore.getItemAsync("userData")
          const userData = JSON.parse(currentUser)
          body = {
            title: formData.title,
            amount: Number.parseFloat(formData.amount),
            category: formData.category,
            description: formData.description,
            splitBetween: [
              {
                user: userData.id,
                amount: Number.parseFloat(formData.amount),
              },
            ],
          }
          break
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (response.ok) {
        Alert.alert("Success", `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`, [
          {
            text: "OK",
            onPress: () => {
              onClose()
              onSuccess()
            },
          },
        ])
      } else {
        Alert.alert("Error", data.message || `Failed to add ${type}`)
      }
    } catch (error) {
      console.error(`Add ${type} error:`, error)
      Alert.alert("Error", "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a title")
      return false
    }

    if ((type === "bill" || type === "expense") && (!formData.amount || isNaN(Number.parseFloat(formData.amount)))) {
      Alert.alert("Error", "Please enter a valid amount")
      return false
    }

    if ((type === "bill" || type === "chore") && !formData.assignedTo) {
      Alert.alert("Error", "Please select who this is assigned to")
      return false
    }

    if (type === "grocery" && !formData.items.some((item) => item.name.trim())) {
      Alert.alert("Error", "Please add at least one grocery item")
      return false
    }

    return true
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const getTitle = () => {
    switch (type) {
      case "bill":
        return "Add Bill"
      case "chore":
        return "Add Chore"
      case "grocery":
        return "Add Grocery List"
      case "expense":
        return "Add Expense"
      default:
        return "Add Item"
    }
  }

  const renderBillForm = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bill Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(value) => updateFormData("title", value)}
          placeholder="e.g., Electricity Bill"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={formData.amount}
          onChangeText={(value) => updateFormData("amount", value)}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => updateFormData("category", value)}
            style={styles.picker}
          >
            <Picker.Item label="Electricity" value="electricity" />
            <Picker.Item label="Water" value="water" />
            <Picker.Item label="Gas" value="gas" />
            <Picker.Item label="Internet" value="internet" />
            <Picker.Item label="Rent" value="rent" />
            <Picker.Item label="Phone" value="phone" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Assigned To *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.assignedTo}
            onValueChange={(value) => updateFormData("assignedTo", value)}
            style={styles.picker}
          >
            <Picker.Item label="Select member..." value="" />
            {householdMembers.map((member) => (
              <Picker.Item key={member.id} label={member.name} value={member.id} />
            ))}
          </Picker>
        </View>
      </View>
    </>
  )

  const renderChoreForm = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Chore Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(value) => updateFormData("title", value)}
          placeholder="e.g., Clean the kitchen"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => updateFormData("description", value)}
          placeholder="Additional details..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.priority}
            onValueChange={(value) => updateFormData("priority", value)}
            style={styles.picker}
          >
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => updateFormData("category", value)}
            style={styles.picker}
          >
            <Picker.Item label="Cleaning" value="cleaning" />
            <Picker.Item label="Cooking" value="cooking" />
            <Picker.Item label="Maintenance" value="maintenance" />
            <Picker.Item label="Shopping" value="shopping" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Assigned To *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.assignedTo}
            onValueChange={(value) => updateFormData("assignedTo", value)}
            style={styles.picker}
          >
            <Picker.Item label="Select member..." value="" />
            {householdMembers.map((member) => (
              <Picker.Item key={member.id} label={member.name} value={member.id} />
            ))}
          </Picker>
        </View>
      </View>
    </>
  )

  const renderGroceryForm = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>List Title</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(value) => updateFormData("title", value)}
          placeholder="e.g., Weekly Shopping"
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Items *</Text>
          <TouchableOpacity onPress={addGroceryItem} style={styles.addButton}>
            <Ionicons name="add-circle" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        {formData.items.map((item, index) => (
          <View key={index} style={styles.groceryItem}>
            <View style={styles.groceryItemRow}>
              <TextInput
                style={[styles.input, styles.groceryInput]}
                value={item.name}
                onChangeText={(value) => updateGroceryItem(index, "name", value)}
                placeholder="Item name"
              />
              <TextInput
                style={[styles.input, styles.groceryQuantity]}
                value={item.quantity}
                onChangeText={(value) => updateGroceryItem(index, "quantity", value)}
                placeholder="Qty"
              />
              {formData.items.length > 1 && (
                <TouchableOpacity onPress={() => removeGroceryItem(index)} style={styles.removeButton}>
                  <Ionicons name="remove-circle" size={24} color="#E74C3C" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={item.category}
                onValueChange={(value) => updateGroceryItem(index, "category", value)}
                style={styles.picker}
              >
                <Picker.Item label="Fruits" value="fruits" />
                <Picker.Item label="Vegetables" value="vegetables" />
                <Picker.Item label="Dairy" value="dairy" />
                <Picker.Item label="Meat" value="meat" />
                <Picker.Item label="Grains" value="grains" />
                <Picker.Item label="Snacks" value="snacks" />
                <Picker.Item label="Beverages" value="beverages" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>
        ))}
      </View>
    </>
  )

  const renderExpenseForm = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Expense Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(value) => updateFormData("title", value)}
          placeholder="e.g., Dinner at restaurant"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={formData.amount}
          onChangeText={(value) => updateFormData("amount", value)}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => updateFormData("category", value)}
            style={styles.picker}
          >
            <Picker.Item label="Food" value="food" />
            <Picker.Item label="Transportation" value="transportation" />
            <Picker.Item label="Entertainment" value="entertainment" />
            <Picker.Item label="Utilities" value="utilities" />
            <Picker.Item label="Healthcare" value="healthcare" />
            <Picker.Item label="Shopping" value="shopping" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => updateFormData("description", value)}
          placeholder="Additional details..."
          multiline
          numberOfLines={3}
        />
      </View>
    </>
  )

  const renderForm = () => {
    switch (type) {
      case "bill":
        return renderBillForm()
      case "chore":
        return renderChoreForm()
      case "grocery":
        return renderGroceryForm()
      case "expense":
        return renderExpenseForm()
      default:
        return null
    }
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderForm()}
          </ScrollView>

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
                <Text style={styles.submitButtonText}>Add {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              )}
            </TouchableOpacity>
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
    maxHeight: "90%",
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
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  picker: {
    height: 50,
  },
  groceryItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  groceryItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  groceryInput: {
    flex: 1,
    marginRight: 8,
  },
  groceryQuantity: {
    width: 80,
    marginRight: 8,
  },
  addButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E1E8ED",
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
