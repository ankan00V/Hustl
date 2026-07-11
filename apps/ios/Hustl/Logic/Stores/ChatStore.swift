import Foundation
import Combine

@MainActor
public class ChatStore: ObservableObject {
    public static let shared = ChatStore()
    
    @Published public var messages: [String: [ChatMessage]] = [:]
    @Published public var unreadCounts: [String: Int] = [:]
    @Published public var loading = false
    @Published public var error: String? = nil
    
    @Published public var isConnected = false
    
    private init() {}
    
    public func fetchMessages(matchId: String) async {
        self.loading = true
        self.error = nil
        do {
            let response = try await Endpoints.ChatAPI.getMessages(matchId: matchId)
            self.messages[matchId] = response.messages
        } catch {
            self.error = error.localizedDescription
        }
        self.loading = false
    }
    
    public func sendMessage(matchId: String, text: String) async throws {
        do {
            let response = try await Endpoints.ChatAPI.sendMessage(matchId: matchId, text: text)
            var msgs = self.messages[matchId] ?? []
            msgs.append(response.message)
            self.messages[matchId] = msgs
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }
    
    public func markAsRead(matchId: String) async {
        do {
            try await Endpoints.ChatAPI.markAsRead(matchId: matchId)
            self.unreadCounts[matchId] = 0
            
            if let msgs = self.messages[matchId] {
                let formatter = ISO8601DateFormatter()
                let now = formatter.string(from: Date())
                self.messages[matchId] = msgs.map {
                    ChatMessage(
                        id: $0.id,
                        matchId: $0.matchId,
                        senderId: $0.senderId,
                        text: $0.text,
                        createdAt: $0.createdAt,
                        readAt: $0.readAt ?? now
                    )
                }
            }
        } catch {
            print("Failed to mark messages as read: \(error)")
        }
    }
    
    public func clearChat(matchId: String) {
        self.messages.removeValue(forKey: matchId)
        self.unreadCounts.removeValue(forKey: matchId)
    }
    
    public func clearAllChats() {
        self.messages = [:]
        self.unreadCounts = [:]
        self.error = nil
    }
}
