import Foundation
import Combine

@MainActor
public class DeckStore: ObservableObject {
    public static let shared = DeckStore()
    
    @Published public var listings: [Listing] = []
    @Published public var skippedListings: [Listing] = []
    @Published public var deckIndex: Int = 0
    @Published public var isDeckLoading = false
    @Published public var deckError: String? = nil
    
    // For matches inside DeckStore
    @Published public var matches: [Match] = []
    @Published public var isMatchesLoading = false
    
    private init() {}
    
    public func setListings(_ listings: [Listing]) {
        self.listings = listings
        self.deckIndex = 0
        self.deckError = nil
    }
    
    public func addListing(_ listing: Listing) {
        self.listings.append(listing)
    }
    
    public func advanceDeck() {
        if deckIndex < listings.count {
            let skipped = listings[deckIndex]
            skippedListings.append(skipped)
        }
        deckIndex += 1
    }
    
    public func resetDeck() {
        deckIndex = 0
    }
    
    public func setMatches(_ matches: [Match]) {
        self.matches = matches
    }
    
    // Helper to update match inline if needed
    public func updateMatch(matchId: String, updates: (Match) -> Match) {
        if let index = matches.firstIndex(where: { $0.id == matchId }) {
            matches[index] = updates(matches[index])
        }
    }
}
