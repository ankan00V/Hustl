import SwiftUI

struct DeckView: View {
    @StateObject private var deckStore = DeckStore.shared
    @State private var offset: CGSize = .zero
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Bar
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "bolt.fill")
                        .foregroundColor(Color.Hustl.lime)
                        .font(.system(size: 14))
                    Text("12 / 15 Credits")
                        .textStyle(Typography.bodyMedium, color: Color.Hustl.textPrimary)
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.sm)
                .background(Color.Hustl.elevated)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.Hustl.border, lineWidth: 1))
                
                Spacer()
                
                HStack(spacing: Theme.Spacing.md) {
                    actionButton(icon: "clock") {
                        // Route to Skipped
                    }
                    actionButton(icon: "slider.horizontal.3") {
                        // Route to Filters
                    }
                }
            }
            .padding(.horizontal)
            .padding(.top, Theme.Spacing.base)
            
            // Search Trigger
            Button(action: {
                // Route to Search
            }) {
                HStack(spacing: Theme.Spacing.md) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color.Hustl.textSecondary)
                    Text("Search roles, companies...")
                        .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                    Spacer()
                }
                .padding(.horizontal, Theme.Spacing.base)
                .frame(height: 46)
                .background(Color.Hustl.elevated)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.Hustl.border, lineWidth: 1))
                .padding(.horizontal)
                .padding(.top, Theme.Spacing.base)
            }
            
            // Deck Area
            ZStack {
                if deckStore.deckIndex >= deckStore.listings.count {
                    VStack(spacing: Theme.Spacing.base) {
                        Text("🎯")
                            .font(.system(size: 52))
                        Text("All caught up!")
                            .textStyle(Typography.headingLarge, color: Color.Hustl.textPrimary)
                        Text("New shifts drop every hour. Check back soon.")
                            .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Theme.Spacing.xxl)
                        
                        GradientButton(title: "Refresh") {
                            deckStore.resetDeck()
                        }
                        .padding(.top, Theme.Spacing.base)
                        .padding(.horizontal, Theme.Spacing.xxl)
                    }
                } else {
                    // Next Card (Background)
                    if deckStore.deckIndex + 1 < deckStore.listings.count {
                        GigCardView(listing: deckStore.listings[deckStore.deckIndex + 1])
                            .scaleEffect(0.95)
                            .offset(y: 20)
                            .zIndex(0)
                    }
                    
                    // Current Card (Foreground)
                    GigCardView(listing: deckStore.listings[deckStore.deckIndex])
                        .offset(x: offset.width, y: offset.height * 0.4)
                        .rotationEffect(.degrees(Double(offset.width / 10)))
                        .gesture(
                            DragGesture()
                                .onChanged { gesture in
                                    offset = gesture.translation
                                }
                                .onEnded { _ in
                                    withAnimation(.spring()) {
                                        if offset.width > 100 {
                                            swipeCard(direction: 1)
                                        } else if offset.width < -100 {
                                            swipeCard(direction: -1)
                                        } else {
                                            offset = .zero
                                        }
                                    }
                                }
                        )
                        .zIndex(1)
                }
            }
            .padding(.top, Theme.Spacing.xl)
            .padding(.horizontal, Theme.Spacing.base)
            .frame(maxHeight: .infinity)
            
            // Bottom Action Buttons
            if deckStore.deckIndex < deckStore.listings.count {
                HStack(spacing: Theme.Spacing.xxl) {
                    Button(action: {
                        withAnimation { swipeCard(direction: -1) }
                    }) {
                        ZStack {
                            Circle()
                                .fill(Color.Hustl.elevated)
                                .frame(width: 64, height: 64)
                                .overlay(Circle().stroke(Color.Hustl.border, lineWidth: 1))
                            Image(systemName: "xmark")
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(Color.Hustl.textSecondary)
                        }
                    }
                    
                    Button(action: {
                        withAnimation { swipeCard(direction: 1) }
                    }) {
                        ZStack {
                            Circle()
                                .fill(Color.Hustl.lime)
                                .frame(width: 72, height: 72)
                            Image(systemName: "checkmark")
                                .font(.system(size: 30, weight: .bold))
                                .foregroundColor(Color.Hustl.bg)
                        }
                    }
                }
                .padding(.bottom, Theme.Spacing.xxl)
                .padding(.top, Theme.Spacing.base)
            }
        }
        .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
    }
    
    private func actionButton(icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(Color.Hustl.textPrimary)
                .frame(width: 40, height: 40)
                .background(Color.Hustl.elevated)
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.Hustl.border, lineWidth: 1))
        }
    }
    
    private func swipeCard(direction: CGFloat) {
        offset = CGSize(width: direction * 500, height: 0)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            deckStore.advanceDeck()
            offset = .zero
        }
    }
}

struct GigCardView: View {
    let listing: Listing
    
    var body: some View {
        VStack(spacing: 0) {
            // Hero Image Placeholder
            ZStack(alignment: .bottomLeading) {
                Rectangle()
                    .fill(LinearGradient(colors: [Color(white: 0.15), Color.Hustl.card], startPoint: .top, endPoint: .bottom))
                    .frame(height: 200)
                
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    if listing.isUrgent {
                        HStack(spacing: Theme.Spacing.xs) {
                            Image(systemName: "bolt.fill")
                            Text("URGENT")
                        }
                        .font(Typography.labelSmall)
                        .foregroundColor(Color.Hustl.bg)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, Theme.Spacing.xs)
                        .background(Color.Hustl.lime)
                        .clipShape(Capsule())
                    }
                    
                    HStack(spacing: Theme.Spacing.sm) {
                        Text("☕")
                            .font(.system(size: 24))
                        Text(listing.businessCategory)
                            .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                    }
                }
                .padding()
            }
            
            // Content
            VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                HStack(spacing: Theme.Spacing.md) {
                    ZStack {
                        RoundedRectangle(cornerRadius: Theme.Radii.sm)
                            .fill(Color.Hustl.elevated)
                            .frame(width: 48, height: 48)
                            .overlay(RoundedRectangle(cornerRadius: Theme.Radii.sm).stroke(Color.Hustl.border, lineWidth: 1))
                        Text(String(listing.businessName.prefix(2)).uppercased())
                            .font(Typography.headingSmall)
                            .foregroundColor(Color.Hustl.textPrimary)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(listing.title)
                            .textStyle(Typography.headingSmall, color: Color.Hustl.textPrimary)
                            .lineLimit(1)
                        Text("\(listing.businessName) • \(String(format: "%.1f", listing.distance ?? 0.0))mi")
                            .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                            .lineLimit(1)
                    }
                }
                
                HStack {
                    Text("₹\(listing.hourlyRate)")
                        .textStyle(Typography.headingLarge, color: Color.Hustl.textPrimary)
                    Text("/hr")
                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
                    
                    Circle()
                        .fill(Color.Hustl.textSecondary)
                        .frame(width: 4, height: 4)
                        .padding(.horizontal, Theme.Spacing.sm)
                    
                    Text("\(String(format: "%.1f", listing.totalHours)) hrs")
                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
                }
                
                Text("\(listing.startTime.prefix(5)) – \(listing.endTime.prefix(5))") // Simplified for mock string logic
                    .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                
                HStack(spacing: Theme.Spacing.sm) {
                    ForEach(listing.skills.prefix(4), id: \.self) { skill in
                        Text(skill)
                            .textStyle(Typography.label, color: Color.Hustl.textPrimary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.Hustl.elevated)
                            .clipShape(Capsule())
                    }
                }
                
                Spacer()
                
                HStack {
                    Spacer()
                    Image(systemName: "info.circle")
                        .foregroundColor(Color.Hustl.textSecondary)
                        .font(.caption)
                    Text("Tap for details")
                        .textStyle(Typography.label, color: Color.Hustl.textSecondary)
                    Spacer()
                }
            }
            .padding()
            .frame(maxHeight: .infinity)
            .background(Color.Hustl.card)
        }
        .cornerRadius(Theme.Radii.xxl)
        .overlay(RoundedRectangle(cornerRadius: Theme.Radii.xxl).stroke(Color.Hustl.border, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.1), radius: 10, y: 5)
    }
}

#Preview {
    DeckView()
}
