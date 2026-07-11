import { Image, StyleSheet, View } from "react-native";

export function HustlLogo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeStyles = {
    small: { width: 96, height: 56 },
    default: { width: 136, height: 80 },
    large: { width: 180, height: 106 },
  };

  return (
    <View style={[styles.container, { height: sizeStyles[size].height }]}>
      <Image
        source={require("@/assets/hustl-logo.png")}
        style={[styles.logo, sizeStyles[size]]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    display: "flex",
  },
});
