import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"

// Import screens
import HomeScreen from "../screens/HomeScreen"
import BillsScreen from "../screens/BillsScreen"
import GroceriesScreen from "../screens/GroceriesScreen"
import ChoresScreen from "../screens/ChoresScreen"
import ExpensesScreen from "../screens/ExpensesScreen"
import ProfileScreen from "../screens/ProfileScreen"

const Tab = createBottomTabNavigator()

export default function MainNavigator({ signOut }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Bills") {
            iconName = focused ? "receipt" : "receipt-outline"
          } else if (route.name === "Groceries") {
            iconName = focused ? "basket" : "basket-outline"
          } else if (route.name === "Chores") {
            iconName = focused ? "checkmark-circle" : "checkmark-circle-outline"
          } else if (route.name === "Expenses") {
            iconName = focused ? "card" : "card-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "#7F8C8D",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E1E8ED",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "#4A90E2",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bills" component={BillsScreen} />
      <Tab.Screen name="Groceries" component={GroceriesScreen} />
      <Tab.Screen name="Chores" component={ChoresScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Profile">{(props) => <ProfileScreen {...props} signOut={signOut} />}</Tab.Screen>
    </Tab.Navigator>
  )
}
