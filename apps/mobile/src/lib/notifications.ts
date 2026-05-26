import * as Notifications from "expo-notifications";
import { io } from "socket.io-client";
import Constants from "expo-constants";

export async function registerForPushNotifications() {
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") {
    return null;
  }
  return Notifications.getExpoPushTokenAsync();
}

export function connectRealtime(userId: string) {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4000";
  const socket = io(apiUrl, { transports: ["websocket"] });
  socket.on("connect", () => socket.emit("hustl:join_user", userId));
  socket.on("hustl:urgent_listing_nearby", async (listing) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Urgent HUSTL nearby",
        body: `${listing.title} is hiring now.`,
        data: listing
      },
      trigger: null
    });
  });
  return socket;
}
