import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { LucideMousePointer2, Sparkles, Briefcase, GraduationCap } from "lucide-react-native";

export default function MobileLanding() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Cursor float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, pulseAnim]);

  return (
    <View className="flex-1 bg-[#050505]">


      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          
          {/* Header */}
          <View className="px-6 py-6 flex-row justify-between items-center z-10">
            <View className="flex-row items-center gap-3">
              <Animated.View 
                className="w-10 h-10 rounded-none items-center justify-center bg-black border-2 border-white"
                style={{ transform: [{ scale: pulseAnim }] }}
              >
                <View
                  style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#C8F33A', opacity: 0.2 }}
                />
                <Text className="text-white font-bold text-lg">H</Text>
              </Animated.View>
              <Text className="text-white text-2xl font-bold tracking-tight">Hustl.</Text>
            </View>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="bg-white/10 px-5 py-2.5 rounded-none border-2 border-white">
                <Text className="text-white font-semibold text-sm">Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Hero Content */}
          <View className="flex-1 justify-center px-6 pb-12 pt-10">
            
            <View className="items-center mb-10 mt-8">
              <View className="bg-white/5 border-2 border-white px-4 py-2 rounded-none mb-8 flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-none bg-[#C8F33A]" />
                <Text className="text-white/80 font-medium text-xs tracking-wider uppercase">Future of Student Work</Text>
              </View>

              <View className="relative w-full">
                <Text className="text-white text-[56px] leading-[62px] font-bold tracking-tighter text-center">
                  Elite Student
                </Text>
                <Text className="text-transparent text-[56px] leading-[62px] font-bold tracking-tighter text-center">
                  <Text style={{ color: '#C8F33A' }}>Talent</Text>
                </Text>
                <Text className="text-white text-[48px] leading-[54px] font-bold tracking-tighter text-center mt-1">
                  Just a Click Away.
                </Text>

                {/* Floating Cursor accent */}
                <Animated.View 
                  className="absolute top-16 right-4 md:right-10 items-center z-10"
                  style={{ transform: [{ translateY: floatAnim }, { rotate: '-12deg' }] }}
                >
                  <LucideMousePointer2 size={36} fill="#C8F33A" color="#C8F33A" />
                  <View className="bg-[#C8F33A] px-3 py-1.5 rounded-none mt-1 border-2 border-black" style={{ shadowColor: '#000000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }}>
                    <Text className="text-black text-xs font-bold tracking-wide">Alex</Text>
                  </View>
                </Animated.View>
              </View>
            </View>
            
            <Text className="text-white/60 text-lg leading-7 mt-4 mb-14 text-center px-2 font-medium">
              Connect your business with verified, top-tier university students for flexible gigs and part-time roles.
            </Text>

            {/* Feature Cards Mini */}
            <View className="flex-row gap-4 mb-10">
              <View className="flex-1 bg-white/5 border-2 border-white p-4 rounded-none items-center">
                <View className="w-10 h-10 rounded-none bg-[#C8F33A] items-center justify-center mb-3 border-2 border-black">
                  <GraduationCap size={20} color="#000000" />
                </View>
                <Text className="text-white font-semibold text-center">Verified Students</Text>
              </View>
              <View className="flex-1 bg-white/5 border-2 border-white p-4 rounded-none items-center">
                <View className="w-10 h-10 rounded-none bg-[#C8F33A] items-center justify-center mb-3 border-2 border-black">
                  <Briefcase size={20} color="#000000" />
                </View>
                <Text className="text-white font-semibold text-center">Instant Hiring</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-4 w-full">
              <Link href="/(business)" asChild>
                <TouchableOpacity className="bg-[#C8F33A] w-full py-5 rounded-none flex-row justify-center items-center border-4 border-black" style={{ shadowColor: "#000000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }}>
                  <Text className="text-black text-lg font-bold">Hire Talent Now</Text>
                </TouchableOpacity>
              </Link>

              <Link href="/(student)" asChild>
                <TouchableOpacity className="bg-transparent border-4 border-white w-full py-5 rounded-none flex-row justify-center items-center" style={{ shadowColor: "#000000", shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }}>
                  <Text className="text-white text-lg font-bold tracking-wide">Find Gigs (Students)</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
