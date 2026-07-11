import { useState, useRef, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, spacing, radii, shadows } from "@/constants/theme";
import { HustlLogo } from "./HustlLogo";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
  jobTitle: string;
  recipientInitials: string;
  initialMessages: Message[];
}

export function ChatModal({
  visible,
  onClose,
  recipientName,
  jobTitle,
  recipientInitials,
  initialMessages,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "me",
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Auto reply mock for interactive feel
    setTimeout(() => {
      const replies = [
        "Sounds good! See you soon. ⚡",
        "Awesome, let me know if you need anything else.",
        "Perfect, thanks for confirming! 👍",
      ];
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)]!,
        sender: "them",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={onClose}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{recipientInitials}</Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.recipientName}>{recipientName}</Text>
              <Text style={styles.jobTitle}>{jobTitle}</Text>
            </View>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          {/* Messages List */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messageScroll}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.timestamp}>TODAY</Text>
            
            {messages.map((msg) => {
              const isMe = msg.sender === "me";
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowMe : styles.messageRowThem,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                    ]}
                  >
                    <Text style={[styles.bubbleText, isMe ? styles.textMe : styles.textThem]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeThem]}>
                      {msg.time}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <Pressable style={styles.plusBtn}>
              <Text style={styles.plusIcon}>+</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendIcon}>⚡</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: "#050508",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "#0A0A0F",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  recipientName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  jobTitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  statusText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
  },
  messageScroll: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  messageRow: {
    flexDirection: "row",
    width: "100%",
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageRowThem: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  bubbleMe: {
    backgroundColor: "#8B5CF6", // Purple Bubbles!
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textMe: {
    color: "white",
  },
  textThem: {
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timeMe: {
    color: "rgba(255,255,255,0.6)",
  },
  timeThem: {
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "#0A0A0F",
    gap: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 40 : spacing.md,
  },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  plusIcon: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B5CF6", // Purple Bolt
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.02)",
    shadowOpacity: 0,
  },
  sendIcon: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
});
