import { Tabs, Slot, Stack } from "expo-router";
import { Zap, Heart, Grid2x2, Mail, User } from "lucide-react-native";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { DesktopSidebar, DesktopRightPanel } from "@/components/DesktopShell";
import { colors } from "@/constants/theme";

const DESKTOP_BREAKPOINT = 900;

function DesktopLayout() {
  return (
    <View style={desktopStyles.shell}>
      <DesktopSidebar />
      <View style={desktopStyles.main}>
        <Slot />
      </View>
      <DesktopRightPanel />
    </View>
  );
}

function MobileLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="deck"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Zap size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="campus_connect"
        options={{
          title: "Connect",
          tabBarIcon: ({ color, size }) => <Grid2x2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => <Mail size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      
      {/* Hidden Routes */}
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="checkin/[matchId]" options={{ href: null }} />
      <Tabs.Screen name="match/[id]" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="filters" options={{ href: null }} />
      <Tabs.Screen name="skipped" options={{ href: null }} />
    </Tabs>
  );
}

export default function StudentLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  if (isDesktop) return <DesktopLayout />;
  
  // Note: Modals and extra screens should ideally be managed via Stack if we are completely replacing the layout, 
  // but since we are within a Tabs layout we just hide them via `href: null`.
  return <MobileLayout />;
}

const desktopStyles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.bg,
  },
  main: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBarBorder,
    borderTopWidth: 1,
    height: 64, // Updated height
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
