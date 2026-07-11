import Foundation
import Combine

@MainActor
public class MatchesStore: ObservableObject {
    public static let shared = MatchesStore()
    
    @Published public var matches: [Match] = []
    @Published public var loading = false
    @Published public var error: String? = nil
    
    private init() {}
    
    public func fetchMatches() async {
        self.loading = true
        self.error = nil
        do {
            let response = try await Endpoints.Matches.list()
            self.matches = response.matches
        } catch {
            self.error = error.localizedDescription
        }
        self.loading = false
    }
    
    public func updateMatchStatus(matchId: String, status: String) async throws {
        do {
            let updatedMatch = try await Endpoints.Matches.updateStatus(matchId: matchId, status: status)
            if let index = matches.firstIndex(where: { $0.id == matchId }) {
                matches[index] = updatedMatch
            }
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }
    
    public func cancelMatch(matchId: String, reason: String? = nil) async throws {
        do {
            let updatedMatch = try await Endpoints.Matches.cancel(matchId: matchId, reason: reason)
            if let index = matches.firstIndex(where: { $0.id == matchId }) {
                matches[index] = updatedMatch
            }
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }
    
    public func clearMatches() {
        self.matches = []
        self.error = nil
    }
}
