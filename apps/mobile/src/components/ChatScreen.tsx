import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
// react-native-reanimated removed — using plain View
import { useAuthStore } from '@/stores/auth';
import { api, chatApi } from '@/lib/api';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { Screen } from '@/components/Screen';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  read?: boolean;
}

export function ChatScreenComponent({ role }: { role: 'STUDENT' | 'BUSINESS' }) {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchMatchDetails();
    fetchMessages();
    setupSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      const response = await api<any>(`/matches/${matchId}`);
      setMatchDetails(response.match);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await chatApi.getMessages(matchId as string);
      setMessages(response.messages || []);
      // Mark as read
      await chatApi.markAsRead(matchId as string);
    } catch (error) {
      console.error(error);
    }
  };

  const setupSocket = () => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    socketRef.current = io(API_URL, {
      auth: { token },
      autoConnect: true,
    });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('joinMatch', matchId);
    });

    socketRef.current.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
      chatApi.markAsRead(matchId as string).catch(console.error);
    });
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const tempId = Date.now().toString();
    const newMsg: Message = {
      id: tempId,
      senderId: user?.id || 'temp',
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    try {
      await chatApi.sendMessage(matchId as string, newMsg.text);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    
    const prevItem = index > 0 ? messages[index - 1] : null;
    const isNewDay = prevItem ? new Date(item.createdAt).toDateString() !== new Date(prevItem.createdAt).toDateString() : true;

    return (
      <View>
        {isNewDay && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        )}
        <View 
          style={[styles.messageBubbleWrapper, isMe ? styles.messageMeWrapper : styles.messageThemWrapper]}
        >
          <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageThem]}>
            <Text style={[styles.messageText, isMe ? styles.messageMeText : styles.messageThemText]}>{item.text}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Ionicons 
                name={item.read ? "checkmark-done" : "checkmark"} 
                size={14} 
                color={item.read ? colors.lime : colors.textMuted} 
                style={styles.readReceipt}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {role === 'STUDENT' ? matchDetails?.listing?.business?.name || 'Business' : matchDetails?.student?.name || 'Student'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {matchDetails?.listing?.title || 'Shift Details'}
          </Text>
        </View>
      </View>

      {matchDetails && (
        <View style={styles.matchDetailCard}>
          <View style={styles.matchDetailHeader}>
            <Text style={styles.matchDetailTitle}>{matchDetails?.listing?.title || 'Barista Needed'}</Text>
            <View style={styles.payBadge}>
              <Text style={styles.payBadgeText}>₹{matchDetails?.listing?.hourlyRate || '700'}/hr</Text>
            </View>
          </View>
          <Text style={styles.matchDetailSubtitle}>
            {matchDetails?.listing?.totalHours || '4'} hrs · {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric'})}
          </Text>

          {/* Timeline Checkboxes */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineBox, styles.timelineBoxChecked]}>
                <Ionicons name="checkmark" size={14} color="#C8F33A" />
              </View>
              <Text style={styles.timelineText}>Matched</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <View style={styles.timelineBox}></View>
              <Text style={styles.timelineText}>Checked In</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <View style={styles.timelineBox}></View>
              <Text style={styles.timelineText}>Paid</Text>
            </View>
          </View>
          
          {role === 'STUDENT' && (
            <View style={styles.checkInBox}>
              <Text style={styles.checkInText}>Ready to check in</Text>
              <TouchableOpacity style={styles.checkInButton}>
                <Text style={styles.checkInButtonText}>Check In Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={inputText.trim() ? sendMessage : undefined}
          >
            <Ionicons name={inputText.trim() ? "send" : "mic"} size={20} color={!inputText.trim() ? colors.textMuted : colors.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: 60, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  headerInfo: { flex: 1 },
  headerTitle: { ...typography.headingSmall, color: colors.textPrimary },
  headerSubtitle: { ...typography.bodySmall, color: colors.textSecondary },
  
  matchDetailCard: { margin: spacing.lg, padding: spacing.lg, backgroundColor: '#161616', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  matchDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  matchDetailTitle: { color: '#FAFAFA', fontSize: 18, fontWeight: '800' },
  payBadge: { backgroundColor: 'rgba(200, 243, 58, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  payBadgeText: { color: '#C8F33A', fontSize: 14, fontWeight: '700' },
  matchDetailSubtitle: { color: '#A1A1AA', fontSize: 14, marginBottom: 16 },
  
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 8 },
  timelineItem: { alignItems: 'center', gap: 6 },
  timelineBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#333', backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  timelineBoxChecked: { borderColor: '#C8F33A', backgroundColor: 'rgba(200,243,58,0.1)' },
  timelineText: { color: '#A1A1AA', fontSize: 10, fontWeight: '600' },
  timelineLine: { flex: 1, height: 2, backgroundColor: '#333', marginHorizontal: 8, marginTop: -16 },

  checkInBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111111', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  checkInText: { color: '#FAFAFA', fontSize: 14, fontWeight: '600' },
  checkInButton: { backgroundColor: '#C8F33A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  checkInButtonText: { color: '#000', fontSize: 13, fontWeight: '800' },

  messagesList: { padding: spacing.lg, gap: spacing.md },
  dateSeparator: { alignItems: 'center', marginVertical: spacing.md },
  dateSeparatorText: { ...typography.labelSmall, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  messageBubbleWrapper: { marginBottom: spacing.sm, maxWidth: '80%' },
  messageMeWrapper: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageThemWrapper: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  messageBubble: { padding: spacing.md, borderRadius: radii.lg },
  messageMe: { backgroundColor: '#C8F33A', borderBottomRightRadius: radii.sm },
  messageThem: { backgroundColor: '#161616', borderWidth: 1, borderColor: 'transparent', borderBottomLeftRadius: radii.sm },
  messageText: { ...typography.bodyMedium },
  messageMeText: { color: '#000', fontWeight: '500' },
  messageThemText: { color: '#FFF' },
  timeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  timeText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 10 },
  readReceipt: { marginTop: 1 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  attachButton: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, backgroundColor: colors.elevated, borderRadius: radii.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, color: colors.textPrimary, ...typography.bodyMedium, maxHeight: 120 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#C8F33A', alignItems: 'center', justifyContent: 'center', shadowColor: '#C8F33A', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  sendButtonDisabled: { backgroundColor: colors.elevated, shadowOpacity: 0 },
});
