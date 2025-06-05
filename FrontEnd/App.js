"use client"

import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import * as SecureStore from "expo-secure-store"

// Import screens
import SplashScreen from "./screens/SplashScreen"
import LoginScreen from "./screens/auth/LoginScreen"
import RegisterScreen from "./screens/auth/RegisterScreen"
import MainNavigator from "./navigation/MainNavigator"

const Stack = createStackNavigator()

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [userToken, setUserToken] = useState(null)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken")
      setUserToken(token)
    } catch (error) {
      console.log("Error checking auth state:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (token, userData) => {
    await SecureStore.setItemAsync("userToken", token)
    await SecureStore.setItemAsync("userData", JSON.stringify(userData))
    setUserToken(token)
  }

  const signOut = async () => {
    await SecureStore.deleteItemAsync("userToken")
    await SecureStore.deleteItemAsync("userData")
    setUserToken(null)
  }

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <Stack.Screen name="Main">{(props) => <MainNavigator {...props} signOut={signOut} />}</Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Login">{(props) => <LoginScreen {...props} signIn={signIn} />}</Stack.Screen>
            <Stack.Screen name="Register">{(props) => <RegisterScreen {...props} signIn={signIn} />}</Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
