import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { InAppNotification } from "@/components/InAppNotification";
import { connectRealtime } from "@/lib/notifications";
import * as Notifications from "expo-notifications";
import { 
  useFonts,
  SpaceMono_400Regular,
  SpaceMono_400Regular_Italic,
  SpaceMono_700Bold,
  SpaceMono_700Bold_Italic
} from "@expo-google-fonts/space-mono";

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
  const { user } = useAuthStore();
  const [toast, setToast] = useState<{ title: string; body: string; type: any } | null>(null);

  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_400Regular_Italic,
    SpaceMono_700Bold,
    SpaceMono_700Bold_Italic,
  });

  useEffect(() => {
    if (!user) return;
    
    // Connect to real-time socket for push notifications
    const socket = connectRealtime(user.id);

    // Listen for foreground notifications
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      setToast({
        title: notification.request.content.title || "New Alert",
        body: notification.request.content.body || "",
        type: "info"
      });
    });

    return () => {
      socket.disconnect();
      sub.remove();
    };
  }, [user]);

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#C8F33A" />
      </View>
    );
  }

  return (
    <AuthGate>
      <StackComponent
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#050505" },
          animation: "fade",
        }}
      />
      {toast && (
        <InAppNotification 
          id="toast-global"
          {...toast}
          onDismiss={() => setToast(null)}
        />
      )}
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
