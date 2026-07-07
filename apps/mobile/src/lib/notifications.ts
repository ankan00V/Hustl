import * as Notifications from "expo-notifications";
import { io } from "socket.io-client";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token?.data;
}

export function connectRealtime(userId: string) {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4000";
  const socket = io(apiUrl, { transports: ["websocket"] });
  socket.on("connect", () => socket.emit("hustl:join_user", userId));
  socket.on("hustl:urgent_listing_nearby", async (listing) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Urgent HUSTL nearby 🚨",
        body: `${listing.title} is hiring now. Tap to view.`,
        data: listing,
        sound: true,
      },
      trigger: null
    });
  });
  return socket;
}
