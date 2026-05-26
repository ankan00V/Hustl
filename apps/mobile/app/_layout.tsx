import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "@/stores/auth";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isHydrated, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;

    const inAuth = segments[0] === "(auth)" || segments[0] === undefined;
    const inStudent = segments[0] === "(student)";
    const inBusiness = segments[0] === "(business)";

    if (!user && !inAuth) {
      // Not logged in and not on an auth screen — redirect to onboarding
      router.replace("/");
    } else if (user && inAuth) {
      // Logged in but on auth screen — redirect to appropriate dashboard
      if (user.role === "STUDENT") {
        router.replace("/(student)/deck");
      } else if (user.role === "BUSINESS") {
        router.replace("/(business)/dashboard");
      }
    }
  }, [user, segments, ready]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#D4FF14" />
      </View>
    );
  }

  return <>{children}</>;
}

const StackComponent = Stack as any;
const StatusBarComponent = StatusBar as any;

export default function RootLayout() {
  return (
    <AuthGate>
      <StackComponent
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#050505" },
          animation: "fade",
        }}
      />
      <StatusBarComponent style="light" />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
});
