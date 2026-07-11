import { Stack } from "expo-router";

const StackComponent = Stack as any;

export default function AuthLayout() {
  return (
    <StackComponent
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#050505" },
        animation: "slide_from_right",
      }}
    />
  );
}
