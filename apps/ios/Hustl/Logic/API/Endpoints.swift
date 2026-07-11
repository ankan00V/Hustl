import Foundation

public struct Endpoints {
    
    public struct Auth {
        public static func login(body: [String: Any]) async throws -> AuthResponse {
            let data = try JSONSerialization.data(withJSONObject: body, options: [])
            return try await APIClient.shared.request(path: "/auth/login", method: "POST", body: data)
        }
        
        public static func register(body: [String: Any]) async throws -> AuthResponse {
            let data = try JSONSerialization.data(withJSONObject: body, options: [])
            return try await APIClient.shared.request(path: "/auth/register", method: "POST", body: data)
        }
    }
    
    public struct Matches {
        public struct MatchListResponse: Codable {
            let matches: [Match]
        }
        
        public static func list() async throws -> MatchListResponse {
            return try await APIClient.shared.request(path: "/matches")
        }
        
        public static func updateStatus(matchId: String, status: String) async throws -> Match {
            let body = try JSONSerialization.data(withJSONObject: ["status": status], options: [])
            struct MatchResponse: Codable { let match: Match }
            let response: MatchResponse = try await APIClient.shared.request(path: "/matches/\(matchId)/status", method: "PATCH", body: body)
            return response.match
        }
        
        public static func cancel(matchId: String, reason: String?) async throws -> Match {
            var params: [String: Any] = [:]
            if let reason = reason { params["reason"] = reason }
            let body = try JSONSerialization.data(withJSONObject: params, options: [])
            struct MatchResponse: Codable { let match: Match }
            let response: MatchResponse = try await APIClient.shared.request(path: "/matches/\(matchId)/cancel", method: "POST", body: body)
            return response.match
        }
    }
    
    public struct WalletAPI {
        public struct WalletResponse: Codable {
            let wallet: Wallet
        }
        public struct TransactionsResponse: Codable {
            let transactions: [WalletTransaction]
            let total: Int
        }
        
        public static func getBalance() async throws -> WalletResponse {
            return try await APIClient.shared.request(path: "/wallet")
        }
        
        public static func getTransactions(page: Int, limit: Int) async throws -> TransactionsResponse {
            return try await APIClient.shared.request(path: "/wallet/transactions?page=\(page)&limit=\(limit)")
        }
        
        public static func requestPayout(amount: Double, upiId: String) async throws {
            let body = try JSONSerialization.data(withJSONObject: ["amount": amount, "upiId": upiId], options: [])
            try await APIClient.shared.requestEmpty(path: "/wallet/payout", method: "POST", body: body)
        }
    }
    
    public struct ChatAPI {
        public struct MessagesResponse: Codable {
            let messages: [ChatMessage]
        }
        public struct SingleMessageResponse: Codable {
            let message: ChatMessage
        }
        
        public static func getMessages(matchId: String) async throws -> MessagesResponse {
            return try await APIClient.shared.request(path: "/chat/\(matchId)")
        }
        
        public static func sendMessage(matchId: String, text: String) async throws -> SingleMessageResponse {
            let body = try JSONSerialization.data(withJSONObject: ["text": text], options: [])
            return try await APIClient.shared.request(path: "/chat/\(matchId)", method: "POST", body: body)
        }
        
        public static func markAsRead(matchId: String) async throws {
            try await APIClient.shared.requestEmpty(path: "/chat/\(matchId)/read", method: "POST")
        }
    }
}
