import SwiftUI

struct BusinessChatView: View {
    var matchId: String
    @State private var messageText = ""
    @State private var messages: [ChatMessage] = []
    
    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(messages) { msg in
                        messageBubble(msg: msg)
                    }
                }
                .padding()
            }
            
            inputArea
        }
        .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
        .navigationTitle("Chat")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func messageBubble(msg: ChatMessage) -> some View {
        let isMe = msg.senderId == AuthStore.shared.user?.id
        return HStack {
            if isMe { Spacer() }
            
            Text(msg.content)
                .font(Typography.bodyMedium)
                .padding(12)
                .background(isMe ? Color.Hustl.purple : Color.Hustl.card)
                .foregroundColor(isMe ? .white : Color.Hustl.textPrimary)
                .cornerRadius(16)
            
            if !isMe { Spacer() }
        }
    }
    
    private var inputArea: some View {
        HStack(spacing: 12) {
            TextField("Type a message...", text: $messageText)
                .font(Typography.bodyMedium)
                .padding(12)
                .background(Color.Hustl.card)
                .foregroundColor(Color.Hustl.textPrimary)
                .cornerRadius(20)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.Hustl.border, lineWidth: 1))
            
            Button(action: sendMessage) {
                Image(systemName: "paperplane.fill")
                    .foregroundColor(messageText.isEmpty ? Color.Hustl.textMuted : Color.Hustl.lime)
                    .font(.system(size: 24))
            }
            .disabled(messageText.isEmpty)
        }
        .padding()
        .background(Color.Hustl.bg)
    }
    
    private func sendMessage() {
        // Send message API
        messageText = ""
    }
}
