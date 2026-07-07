import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { LucideMousePointer2, Sparkles } from "lucide-react-native";

export default function MobileLanding() {
  return (
    <ImageBackground 
      source={{ uri: "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_111401_56af5012-2263-45d3-849a-8688084d7c2a.png&w=1280&q=85" }} 
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      <LinearGradient
        colors={['rgba(10,10,10,0.4)', 'rgba(10,10,10,0.85)', 'rgba(10,10,10,1)']}
        locations={[0, 0.4, 1]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
            
            {/* Header */}
            <View className="px-6 py-6 flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-[#C8F33A] items-center justify-center">
                  <Sparkles size={16} color="#000" />
                </View>
                <Text className="text-white text-xl font-bold tracking-tight">Hustl.</Text>
              </View>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity className="bg-white/10 px-5 py-2.5 rounded-full border border-white/20">
                  <Text className="text-white font-medium text-sm">Log In</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Hero Content */}
            <View className="flex-1 justify-end px-6 pb-12 pt-10">
              
              <View className="mb-2 relative">
                <Text className="text-white text-[48px] leading-[54px] font-bold tracking-tighter">
                  Top Student
                </Text>
                <Text className="text-[#C8F33A] text-[48px] leading-[54px] font-bold tracking-tighter">
                  Talent
                </Text>
                <Text className="text-white text-[48px] leading-[54px] font-bold tracking-tighter">
                  One Click Away.
                </Text>

                {/* Floating Cursor accent */}
                <View className="absolute top-10 right-4 rotate-[-12deg] items-center">
                  <LucideMousePointer2 size={24} fill="#9D4EDD" color="#9D4EDD" />
                  <View className="bg-[#9D4EDD] px-2.5 py-1 rounded-full mt-1 shadow-lg">
                    <Text className="text-white text-xs font-bold">Alex</Text>
                  </View>
                </View>
              </View>
              
              <Text className="text-white/70 text-base leading-6 mt-6 mb-10 pr-4">
                The elite network for university students to find flexible gigs, build real-world experience, and get paid instantly.
              </Text>

              {/* Action Buttons */}
              <View className="gap-4">
                <Link href="/(student)" asChild>
                  <TouchableOpacity className="bg-[#C8F33A] px-6 py-4 rounded-full flex-row justify-center items-center shadow-[0_0_20px_rgba(200,243,58,0.3)]">
                    <Text className="text-black text-lg font-bold">I'm a Student</Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/(business)" asChild>
                  <TouchableOpacity className="bg-[#060218] border border-[#9D4EDD]/30 px-6 py-4 rounded-full flex-row justify-center items-center overflow-hidden">
                    <Text className="text-white text-lg font-bold">Hire Staff Now</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
            
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
