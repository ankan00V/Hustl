import SwiftUI

struct MatchesView: View {
    @StateObject private var matchesStore = MatchesStore.shared
    @State private var activeTab: Int = 0 // 0 = Active, 1 = Past
    
    var displayedMatches: [Match] {
        if activeTab == 0 {
            return matchesStore.matches.filter { $0.status == .pending || $0.status == .accepted || $0.status == .checkedIn }
        } else {
            return matchesStore.matches.filter { $0.status == .completed || $0.status == .cancelled || $0.status == .noShow }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                Text("Applications")
                    .textStyle(Typography.displayMedium, color: Color.Hustl.textPrimary)
                
                Picker("Tabs", selection: $activeTab) {
                    Text("Active").tag(0)
                    Text("Past").tag(1)
                }
                .pickerStyle(.segmented)
                .onAppear {
                    UISegmentedControl.appearance().selectedSegmentTintColor = UIColor(Color.Hustl.elevated)
                    UISegmentedControl.appearance().setTitleTextAttributes([.foregroundColor: UIColor.white], for: .selected)
                    UISegmentedControl.appearance().setTitleTextAttributes([.foregroundColor: UIColor.gray], for: .normal)
                }
            }
            .padding()
            .background(Color.Hustl.bg)
            
            Divider().background(Color.Hustl.border)
            
            if matchesStore.loading {
                ProgressView("Loading applications...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .foregroundColor(Color.Hustl.textSecondary)
            } else if displayedMatches.isEmpty {
                VStack(spacing: Theme.Spacing.base) {
                    Image(systemName: activeTab == 0 ? "magnifyingglass" : "clock")
                        .font(.system(size: 48))
                        .foregroundColor(Color.Hustl.textSecondary)
                    Text(activeTab == 0 ? "No active applications" : "No past applications")
                        .textStyle(Typography.headingSmall, color: Color.Hustl.textPrimary)
                    Text(activeTab == 0 ? "You haven't applied to any shifts recently. Check out the deck to find new opportunities." : "Your completed and cancelled shifts will appear here.")
                        .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Theme.Spacing.xxl)
                    
                    if activeTab == 0 {
                        GradientButton(title: "Find Shifts") {
                            // Navigate to Deck
                        }
                        .padding(.horizontal, Theme.Spacing.xxl)
                        .padding(.top, Theme.Spacing.base)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.Hustl.surface)
            } else {
                ScrollView {
                    LazyVStack(spacing: Theme.Spacing.base) {
                        ForEach(displayedMatches) { match in
                            matchCard(match)
                        }
                    }
                    .padding()
                }
                .background(Color.Hustl.surface)
            }
        }
        .task {
            await matchesStore.fetchMatches()
        }
    }
    
    private func matchCard(_ match: Match) -> some View {
        Button(action: {
            // Route to match details
        }) {
            VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                // Top Row
                HStack(alignment: .top, spacing: Theme.Spacing.md) {
                    ZStack {
                        RoundedRectangle(cornerRadius: Theme.Radii.sm)
                            .fill(Color.Hustl.elevated)
                            .frame(width: 48, height: 48)
                            .overlay(RoundedRectangle(cornerRadius: Theme.Radii.sm).stroke(Color.Hustl.border, lineWidth: 1))
                        Text(String(match.listing?.businessName.prefix(2) ?? "B").uppercased())
                            .font(Typography.headingSmall)
                            .foregroundColor(Color.Hustl.textPrimary)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(match.listing?.title ?? "Unknown Title")
                            .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                        Text(match.listing?.businessName ?? "Unknown Business")
                            .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                    }
                    
                    Spacer()
                    
                    Text(statusLabel(match.status))
                        .textStyle(Typography.labelSmall, color: statusColor(match.status))
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, 4)
                        .overlay(Capsule().stroke(statusColor(match.status), lineWidth: 1))
                }
                
                // Details Row
                HStack(spacing: Theme.Spacing.base) {
                    detailItem(icon: "indianrupeesign", text: "₹\(match.listing?.hourlyRate ?? "0")/hr")
                    detailItem(icon: "clock", text: "\(String(format: "%.1f", match.listing?.totalHours ?? 0)) hrs")
                    detailItem(icon: "calendar", text: match.createdAt.prefix(10).description)
                }
                
                // Time Row
                Text("\(match.listing?.startTime ?? "") - \(match.listing?.endTime ?? "")")
                    .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                
                // Action Hint
                if match.status == .accepted {
                    actionHint(icon: "mappin.and.ellipse", text: "Ready to check in", color: Color.Hustl.lime)
                } else if match.status == .checkedIn {
                    actionHint(icon: "checkmark.circle.fill", text: "Currently working", color: Color.Hustl.purple)
                }
            }
            .padding()
            .background(Color.Hustl.card)
            .cornerRadius(Theme.Radii.lg)
            .overlay(RoundedRectangle(cornerRadius: Theme.Radii.lg).stroke(Color.Hustl.border, lineWidth: 1))
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func detailItem(icon: String, text: String) -> some View {
        HStack(spacing: Theme.Spacing.xs) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(Color.Hustl.textSecondary)
            Text(text)
                .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
        }
    }
    
    private func actionHint(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: Theme.Spacing.xs) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(color)
            Text(text)
                .textStyle(Typography.label, color: color)
        }
        .padding(.top, Theme.Spacing.md)
        .overlay(
            Rectangle().frame(height: 1).foregroundColor(Color.Hustl.border),
            alignment: .top
        )
    }
    
    private func statusColor(_ status: MatchStatus) -> Color {
        switch status {
        case .pending: return Color.Hustl.textSecondary
        case .accepted: return Color.Hustl.lime
        case .checkedIn: return Color.Hustl.purple
        case .completed: return Color.Hustl.textSecondary
        case .cancelled, .noShow: return Color.Hustl.red
        }
    }
    
    private func statusLabel(_ status: MatchStatus) -> String {
        switch status {
        case .pending: return "Applied"
        case .accepted: return "Accepted"
        case .checkedIn: return "Checked In"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .noShow: return "No Show"
        }
    }
}

#Preview {
    MatchesView()
}
