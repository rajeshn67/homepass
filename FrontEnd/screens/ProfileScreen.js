"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as SecureStore from "expo-secure-store"
import { API_URL } from "../config"
import HouseholdModal from "../components/HouseholdModal"

export default function ProfileScreen({ navigation, signOut }) {
  const [userData, setUserData] = useState(null)
  const [householdData, setHouseholdData] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState("create")
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync("userData")
      if (userDataString) {
        const user = JSON.parse(userDataString)
        setUserData(user)

        if (user.householdId) {
          await loadHouseholdDetails()
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadHouseholdDetails = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_URL}/api/users/household-details`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setHouseholdData(data)
      } else {
        console.error("Failed to load household details")
      }
    } catch (error) {
      console.error("Error loading household details:", error)
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

        if (userForStorage.householdId) {
          await loadHouseholdDetails()
        } else {
          setHouseholdData(null)
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshUserData()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut()
          } catch (error) {
            console.error("Error during logout:", error)
            Alert.alert("Error", "Failed to logout. Please try again.")
          }
        },
      },
    ])
  }

  const handleCreateHousehold = () => {
    setModalType("create")
    setModalVisible(true)
  }

  const handleJoinHousehold = () => {
    setModalType("join")
    setModalVisible(true)
  }

  const handleModalSuccess = async () => {
    await refreshUserData()
  }

  const copyInviteCode = () => {
    if (householdData?.inviteCode) {
      // In a real app, you'd use Clipboard API
      Alert.alert("Invite Code", `Share this code with others to join your household:\n\n${householdData.inviteCode}`)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRoleIcon = (role) => {
    return role === "admin" ? "crown" : "person"
  }

  const getRoleColor = (role) => {
    return role === "admin" ? "#F39C12" : "#4A90E2"
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>Error loading user data</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#4A90E2" />
          </View>
          <Text style={styles.userName}>{userData.fullName}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          <View style={styles.roleContainer}>
            <Ionicons name={getRoleIcon(userData.role)} size={16} color={getRoleColor(userData.role)} />
            <Text style={[styles.userRole, { color: getRoleColor(userData.role) }]}>
              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household Information</Text>
          {householdData ? (
            <View style={styles.householdCard}>
              <View style={styles.householdHeader}>
                <View>
                  <Text style={styles.householdName}>{householdData.name}</Text>
                  {householdData.description && (
                    <Text style={styles.householdDescription}>{householdData.description}</Text>
                  )}
                  <Text style={styles.householdCreated}>Created: {formatDate(householdData.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={copyInviteCode} style={styles.inviteCodeButton}>
                  <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                  <Text style={styles.inviteCode}>{householdData.inviteCode}</Text>
                  <Ionicons name="copy-outline" size={16} color="#4A90E2" />
                </TouchableOpacity>
              </View>

              <View style={styles.membersSection}>
                <Text style={styles.membersTitle}>Members ({householdData.memberCount})</Text>
                {householdData.members.map((member) => (
                  <View key={member._id} style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberHeader}>
                        <Ionicons name="person-circle" size={40} color="#4A90E2" />
                        <View style={styles.memberDetails}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberName}>{member.fullName}</Text>
                            <View style={styles.memberRoleContainer}>
                              <Ionicons name={getRoleIcon(member.role)} size={14} color={getRoleColor(member.role)} />
                              <Text style={[styles.memberRole, { color: getRoleColor(member.role) }]}>
                                {member.role}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                          <Text style={styles.memberJoined}>Joined: {formatDate(member.joinedAt)}</Text>
                        </View>
                      </View>

                      <View style={styles.memberStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="receipt-outline" size={16} color="#FF6B6B" />
                          <Text style={styles.statNumber}>{member.stats.totalBills}</Text>
                          <Text style={styles.statLabel}>Bills</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#4ECDC4" />
                          <Text style={styles.statNumber}>{member.stats.totalChores}</Text>
                          <Text style={styles.statLabel}>Chores</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="card-outline" size={16} color="#F7B731" />
                          <Text style={styles.statNumber}>{member.stats.totalExpenses}</Text>
                          <Text style={styles.statLabel}>Expenses</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noHouseholdCard}>
              <Text style={styles.noHouseholdText}>You're not part of any household yet</Text>
              <TouchableOpacity style={styles.button} onPress={handleCreateHousehold}>
                <Text style={styles.buttonText}>Create Household</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={handleJoinHousehold}>
                <Text style={styles.buttonSecondaryText}>Join Household</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <HouseholdModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalType}
        onSuccess={handleModalSuccess}
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
  profileHeader: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8ED",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userRole: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
  },
  householdCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  householdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  householdName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  householdDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  householdCreated: {
    fontSize: 12,
    color: "#95A5A6",
  },
  inviteCodeButton: {
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1E8ED",
  },
  inviteCodeLabel: {
    fontSize: 10,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  inviteCode: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "bold",
    marginBottom: 4,
  },
  membersSection: {
    borderTopWidth: 1,
    borderTopColor: "#E1E8ED",
    paddingTop: 16,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  memberDetails: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  memberRoleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  memberRole: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
    textTransform: "capitalize",
  },
  memberEmail: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  memberJoined: {
    fontSize: 12,
    color: "#95A5A6",
  },
  memberStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 6,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#7F8C8D",
    marginTop: 2,
  },
  noHouseholdCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
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
  noHouseholdText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
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
  },
  buttonSecondaryText: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: "#E74C3C",
    marginLeft: 12,
    fontWeight: "600",
  },
})
