import SwiftUI

// Dashboard specific models
struct DashStats {
    var activeListings: Int
    var pendingMatches: Int
    var weeklySpend: String
    var avgRating: String
}

struct BusinessDashboardView: View {
    @StateObject private var authStore = AuthStore.shared
    @State private var stats = DashStats(activeListings: 4, pendingMatches: 12, weeklySpend: "₹18.5K", avgRating: "4.9")
    @State private var recentMatches: [Match] = []
    @State private var isRefreshing = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    headerView
                    postShiftCTA
                    statsGrid
                    recentApplicantsSection
                    quickActionsSection
                }
                .padding(.vertical)
            }
            .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
            .refreshable {
                // Load real matches from MatchesStore
            }
            .navigationBarHidden(true)
        }
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Good morning 👋")
                    .foregroundColor(Color.Hustl.textSecondary)
                    .font(Typography.bodyMedium)
                Text(authStore.user?.name ?? "Your Business")
                    .foregroundColor(Color.Hustl.textPrimary)
                    .font(Typography.headingLarge)
            }
            Spacer()
            Button(action: { /* Navigate to inbox */ }) {
                Image(systemName: "bell")
                    .padding()
                    .background(Color.Hustl.elevated)
                    .clipShape(Circle())
                    .foregroundColor(Color.Hustl.textPrimary)
            }
        }
        .padding(.horizontal)
    }
    
    private var postShiftCTA: some View {
        Button(action: { /* Route to Post Shift */ }) {
            HStack {
                Image(systemName: "bolt.fill")
                    .foregroundColor(.black)
                VStack(alignment: .leading) {
                    Text("Post a Shift")
                        .font(Typography.headingSmall)
                        .foregroundColor(.black)
                    Text("Students swipe in minutes")
                        .font(Typography.bodySmall)
                        .foregroundColor(.black.opacity(0.6))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(.black)
            }
            .padding()
            .background(Color.Hustl.limeCta)
            .cornerRadius(12)
            .padding(.horizontal)
        }
    }
    
    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            statCard(label: "Active Shifts", value: "\(stats.activeListings)", icon: "doc.text", trend: "+2 this week")
            statCard(label: "New Applicants", value: "\(stats.pendingMatches)", icon: "person.2", trend: "Review now")
            statCard(label: "Week Spend", value: stats.weeklySpend, icon: "banknote", trend: "+15% vs last")
            statCard(label: "Avg Rating", value: stats.avgRating, icon: "star", trend: "Top 5%")
        }
        .padding(.horizontal)
    }
    
    private func statCard(label: String, value: String, icon: String, trend: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                    .font(Typography.labelSmall)
                    .foregroundColor(Color.Hustl.textSecondary)
                Spacer()
                Image(systemName: icon)
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            Text(value)
                .font(Typography.headingLarge)
                .foregroundColor(Color.Hustl.textPrimary)
            Text(trend)
                .font(Typography.labelSmall)
                .foregroundColor(trend.contains("-") ? Color.Hustl.red : Color.Hustl.lime)
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.Hustl.border, lineWidth: 1)
        )
    }
    
    private var recentApplicantsSection: some View {
        VStack(alignment: .leading) {
            HStack {
                Text("RECENT APPLICANTS")
                    .font(Typography.labelSmall)
                    .foregroundColor(Color.Hustl.textSecondary)
                Spacer()
                Button("See all →") { /* Go to inbox */ }
                    .font(Typography.bodySmall)
                    .foregroundColor(Color.Hustl.lime)
            }
            .padding(.horizontal)
            
            VStack(spacing: 12) {
                ForEach(recentMatches) { match in
                    recentApplicantRow(match: match)
                }
            }
            .padding(.horizontal)
        }
    }
    
    private func recentApplicantRow(match: Match) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.Hustl.purple)
                .frame(width: 44, height: 44)
                .overlay(Text(String((match.student?.name ?? "ST").prefix(2).uppercased())).font(Typography.label).foregroundColor(.white))
            
            VStack(alignment: .leading) {
                Text(match.student?.name ?? "Student")
                    .font(Typography.bodyMedium)
                    .foregroundColor(Color.Hustl.textPrimary)
                Text(match.listing?.title ?? "Shift")
                    .font(Typography.bodySmall)
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            Spacer()
            VStack(alignment: .trailing) {
                if let score = match.student?.reputationScore {
                    Text("★ \(score, specifier: "%.1f")")
                        .font(Typography.bodySmall)
                        .foregroundColor(Color.Hustl.lime)
                }
                HStack(spacing: 4) {
                    Circle()
                        .fill(match.status == .checkedIn ? Color.Hustl.lime : Color.Hustl.textSecondary)
                        .frame(width: 6, height: 6)
                    Text(match.status.rawValue)
                        .font(Typography.labelSmall)
                        .foregroundColor(Color.Hustl.textSecondary)
                }
            }
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.Hustl.border, lineWidth: 1))
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading) {
            Text("QUICK ACTIONS")
                .font(Typography.labelSmall)
                .foregroundColor(Color.Hustl.textSecondary)
                .padding(.horizontal)
            
            HStack(spacing: 12) {
                quickActionBtn(icon: "person.2", label: "Review Inbox", color: Color.Hustl.purple)
                quickActionBtn(icon: "chart.bar", label: "Analytics", color: Color.Hustl.lime)
                quickActionBtn(icon: "person", label: "My Profile", color: Color.Hustl.amber)
            }
            .padding(.horizontal)
        }
    }
    
    private func quickActionBtn(icon: String, label: String, color: Color) -> some View {
        Button(action: { /* navigation */ }) {
            VStack(spacing: 8) {
                Circle()
                    .fill(color.opacity(0.2))
                    .frame(width: 48, height: 48)
                    .overlay(Image(systemName: icon).foregroundColor(color))
                Text(label)
                    .font(Typography.labelSmall)
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.Hustl.card)
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.Hustl.border, lineWidth: 1))
        }
    }
}
