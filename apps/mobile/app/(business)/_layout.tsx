import { Tabs, Slot } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { DesktopSidebar, DesktopRightPanel } from "@/components/DesktopShell";
import { colors } from "@/constants/theme";

const DESKTOP_BREAKPOINT = 900;

const TAB_COLORS = {
  active: "#D4FF14",
  inactive: "#52525B",
  bg: "#0A0A0A",
  border: "rgba(255, 255, 255, 0.06)",
};

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

const TabsComponent = Tabs as any;
const TabsScreenComponent = Tabs.Screen as any;
const IoniconsComponent = Ionicons as any;

function MobileLayout() {
  return (
    <TabsComponent
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <TabsScreenComponent
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }: any) => (
            <IoniconsComponent name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <TabsScreenComponent
        name="post"
        options={{
          title: "Post",
          tabBarIcon: ({ color, size }: any) => (
            <IoniconsComponent name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <TabsScreenComponent
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }: any) => (
            <IoniconsComponent name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <TabsScreenComponent
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }: any) => (
            <IoniconsComponent name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
    </TabsComponent>
  );
}

export default function BusinessLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  if (isDesktop) return <DesktopLayout />;
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
    backgroundColor: TAB_COLORS.bg,
    borderTopColor: TAB_COLORS.border,
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 28,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

