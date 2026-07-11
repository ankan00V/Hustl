import SwiftUI

struct SearchView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var query: String = ""
    @State private var isSearching: Bool = false
    
    // Stub recommendations
    let recentSearches = ["Retail", "Barista", "Weekend Shift", "Delivery"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header Search Bar
            HStack(spacing: Theme.Spacing.sm) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(Color.Hustl.textPrimary)
                        .font(.system(size: 20, weight: .semibold))
                }
                
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color.Hustl.textSecondary)
                    TextField("Search roles, places, skills...", text: $query)
                        .foregroundColor(Color.Hustl.textPrimary)
                        .font(Typography.bodyLarge)
                        .submitLabel(.search)
                        .onSubmit {
                            performSearch()
                        }
                    
                    if !query.isEmpty {
                        Button(action: { query = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(Color.Hustl.textSecondary)
                        }
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.sm)
                .background(Color.Hustl.elevated)
                .cornerRadius(Theme.Radii.full)
                .overlay(RoundedRectangle(cornerRadius: Theme.Radii.full).stroke(Color.Hustl.border, lineWidth: 1))
            }
            .padding()
            .background(Color.Hustl.bg)
            
            Divider().background(Color.Hustl.border)
            
            if isSearching {
                // Search Results State
                VStack(spacing: Theme.Spacing.md) {
                    Spacer()
                    ProgressView()
                    Text("Searching for '\(query)'...")
                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
                    Spacer()
                }
                .frame(maxWidth: .infinity)
                .background(Color.Hustl.bg)
            } else {
                // Initial State
                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                        
                        // Recent Searches
                        VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                            HStack {
                                Text("RECENT SEARCHES")
                                    .textStyle(Typography.label, color: Color.Hustl.textSecondary)
                                Spacer()
                                Button("Clear") {
                                    // Clear logic
                                }
                                .textStyle(Typography.bodySmall, color: Color.Hustl.lime)
                            }
                            
                            ForEach(recentSearches, id: \.self) { search in
                                Button(action: {
                                    query = search
                                    performSearch()
                                }) {
                                    HStack {
                                        Image(systemName: "clock.arrow.circlepath")
                                            .foregroundColor(Color.Hustl.textSecondary)
                                        Text(search)
                                            .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                                        Spacer()
                                        Image(systemName: "arrow.up.left")
                                            .foregroundColor(Color.Hustl.textSecondary)
                                    }
                                    .padding(.vertical, Theme.Spacing.sm)
                                }
                            }
                        }
                    }
                    .padding()
                }
                .background(Color.Hustl.bg)
            }
        }
    }
    
    private func performSearch() {
        guard !query.isEmpty else { return }
        isSearching = true
        
        // Mock network delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isSearching = false
            // Here you'd transition to showing a list of `Listing` from DeckStore or SearchStore
        }
    }
}

#Preview {
    SearchView()
}
