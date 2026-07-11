import SwiftUI

struct SkippedView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var deckStore = DeckStore.shared
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark")
                        .foregroundColor(Color.Hustl.textPrimary)
                        .font(.system(size: 20, weight: .semibold))
                        .frame(width: 40, height: 40)
                }
                Spacer()
                Text("Skipped Shifts")
                    .textStyle(Typography.headingMedium, color: Color.Hustl.textPrimary)
                Spacer()
                Color.clear.frame(width: 40, height: 40)
            }
            .padding(.horizontal)
            .padding(.vertical, Theme.Spacing.md)
            .background(Color.Hustl.bg)
            
            Divider().background(Color.Hustl.border)
            
            if deckStore.skippedListings.isEmpty {
                VStack(spacing: Theme.Spacing.md) {
                    Spacer()
                    Image(systemName: "archivebox.fill")
                        .font(.system(size: 64))
                        .foregroundColor(Color.Hustl.textSecondary)
                    Text("No Skipped Shifts")
                        .textStyle(Typography.headingMedium, color: Color.Hustl.textPrimary)
                    Text("When you skip shifts in the deck, they will appear here so you can review them later.")
                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Theme.Spacing.xxl)
                    Spacer()
                }
                .frame(maxWidth: .infinity)
                .background(Color.Hustl.bg)
            } else {
                ScrollView {
                    LazyVStack(spacing: Theme.Spacing.md) {
                        ForEach(deckStore.skippedListings) { listing in
                            skippedCard(listing)
                        }
                    }
                    .padding()
                }
                .background(Color.Hustl.bg)
            }
        }
        .task {
            // DeckStore loads skipped automatically in most setups, but just in case
            // await deckStore.fetchSkippedListings() // TODO: Implement in store if needed
        }
    }
    
    private func skippedCard(_ listing: Listing) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Text(listing.title)
                    .textStyle(Typography.headingSmall, color: Color.Hustl.textPrimary)
                Spacer()
                Text("₹\(listing.hourlyRate)/hr")
                    .textStyle(Typography.headingSmall, color: Color.Hustl.lime)
            }
            
            Text(listing.businessName)
                .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
            
            HStack {
                Label(listing.date, systemImage: "calendar")
                    .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                Spacer()
                Label(listing.timeLabel, systemImage: "clock")
                    .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
            }
            
            Divider().background(Color.Hustl.border).padding(.vertical, Theme.Spacing.xs)
            
            HStack {
                Button(action: {
                    // Logic to reconsider shift
                }) {
                    Text("Reconsider")
                        .textStyle(Typography.label, color: Color.Hustl.lime)
                        .padding(.vertical, Theme.Spacing.sm)
                        .frame(maxWidth: .infinity)
                        .background(Color.Hustl.lime.opacity(0.1))
                        .cornerRadius(Theme.Radii.sm)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radii.sm).stroke(Color.Hustl.lime, lineWidth: 1))
                }
                
                Button(action: {
                    // Logic to dismiss permanently
                }) {
                    Text("Remove")
                        .textStyle(Typography.label, color: Color.Hustl.textSecondary)
                        .padding(.vertical, Theme.Spacing.sm)
                        .frame(maxWidth: .infinity)
                        .background(Color.Hustl.elevated)
                        .cornerRadius(Theme.Radii.sm)
                }
            }
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(Theme.Radii.lg)
        .overlay(RoundedRectangle(cornerRadius: Theme.Radii.lg).stroke(Color.Hustl.border, lineWidth: 1))
    }
}

#Preview {
    SkippedView()
}
