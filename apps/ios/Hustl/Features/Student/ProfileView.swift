import SwiftUI

struct ProfileView: View {
    @StateObject private var authStore = AuthStore.shared
    @StateObject private var profileStore = ProfileStore.shared
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.xxl) {
                    // Header Section
                    VStack(spacing: Theme.Spacing.xl) {
                        headerTop
                        scoreCard
                    }
                    
                    // Dashboard Section
                    VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                        Text("Dashboard")
                            .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                            .padding(.leading, Theme.Spacing.sm)
                        
                        VStack(spacing: 0) {
                            NavItem(icon: "creditcard", title: "Wallet & Earnings", subtitle: "View balance and payout history")
                            Divider().background(Color.Hustl.border).padding(.horizontal)
                            NavItem(icon: "person.2", title: "Campus Connect", subtitle: "See who's working near you")
                            Divider().background(Color.Hustl.border).padding(.horizontal)
                            NavItem(icon: "clock", title: "Shift History", subtitle: nil)
                            Divider().background(Color.Hustl.border).padding(.horizontal)
                            NavItem(icon: "square.and.arrow.up", title: "Refer a Friend", subtitle: "Earn ₹500 for each referral")
                        }
                        .background(Color.Hustl.card)
                        .cornerRadius(Theme.Radii.lg)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radii.lg)
                                .stroke(Color.Hustl.border, lineWidth: 1)
                        )
                    }
                    
                    // Account Settings
                    VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                        Text("Account")
                            .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                            .padding(.leading, Theme.Spacing.sm)
                        
                        VStack(spacing: 0) {
                            NavItem(icon: "person", title: "Personal Info", subtitle: nil)
                            Divider().background(Color.Hustl.border).padding(.horizontal)
                            
                            // Log Out Button
                            Button(action: {
                                Task { await authStore.logout() }
                            }) {
                                HStack {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: Theme.Radii.sm)
                                            .fill(Color.Hustl.red.opacity(0.1))
                                            .frame(width: 40, height: 40)
                                        Image(systemName: "rectangle.portrait.and.arrow.right")
                                            .foregroundColor(Color.Hustl.red)
                                    }
                                    
                                    Text("Log Out")
                                        .textStyle(Typography.bodyLarge, color: Color.Hustl.red)
                                    
                                    Spacer()
                                }
                                .padding()
                            }
                        }
                        .background(Color.Hustl.card)
                        .cornerRadius(Theme.Radii.lg)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radii.lg)
                                .stroke(Color.Hustl.border, lineWidth: 1)
                        )
                    }
                }
                .padding()
                .padding(.bottom, 40)
            }
            .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
            .navigationTitle("Profile")
            .navigationBarHidden(true)
        }
    }
    
    private var headerTop: some View {
        HStack(spacing: Theme.Spacing.base) {
            ZStack {
                Circle()
                    .fill(Color.Hustl.lime)
                    .frame(width: 64, height: 64)
                
                let initial = String(authStore.user?.name.prefix(2) ?? "US").uppercased()
                Text(initial)
                    .font(Typography.headingMedium)
                    .foregroundColor(Color.Hustl.bg)
            }
            
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text(authStore.user?.name ?? "User Name")
                    .textStyle(Typography.headingSmall, color: Color.Hustl.textPrimary)
                Text(authStore.user?.email ?? "email@example.com")
                    .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
            }
            
            Spacer()
            
            Button(action: {
                // Route to Settings
            }) {
                Image(systemName: "gearshape")
                    .foregroundColor(Color.Hustl.textPrimary)
                    .padding(10)
                    .background(Color.Hustl.elevated)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.Hustl.border, lineWidth: 1))
            }
        }
    }
    
    private var scoreCard: some View {
        VStack(spacing: Theme.Spacing.base) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text("HUSTL SCORE")
                        .textStyle(Typography.label, color: Color.Hustl.textSecondary)
                    Text(String(format: "%.1f / 5.0", authStore.user?.reputationScore ?? 5.0))
                        .textStyle(Typography.displayMedium, color: Color.Hustl.textPrimary)
                }
                Spacer()
                Text("Top 5%")
                    .textStyle(Typography.labelSmall, color: Color.Hustl.lime)
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.vertical, 6)
                    .background(Color.Hustl.lime.opacity(0.1))
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color.Hustl.lime, lineWidth: 1))
            }
            
            Divider().background(Color.Hustl.border)
            
            HStack {
                metricView(value: "\(profileStore.studentProfile?.completedShifts ?? 0)", label: "Shifts")
                Spacer()
                metricView(value: profileStore.wallet?.availableBalance ?? "0.0", label: "Earned", valueColor: Color.Hustl.lime)
                Spacer()
                metricView(value: "98%", label: "Completion")
            }
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(Theme.Radii.lg)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radii.lg)
                .stroke(Color.Hustl.border, lineWidth: 1)
        )
    }
    
    private func metricView(value: String, label: String, valueColor: Color = Color.Hustl.textPrimary) -> some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text(value)
                .textStyle(Typography.headingSmall, color: valueColor)
            Text(label)
                .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
        }
    }
}

struct NavItem: View {
    let icon: String
    let title: String
    let subtitle: String?
    
    var body: some View {
        Button(action: {
            // Route to destination
        }) {
            HStack(spacing: Theme.Spacing.base) {
                ZStack {
                    RoundedRectangle(cornerRadius: Theme.Radii.sm)
                        .fill(Color.Hustl.elevated)
                        .frame(width: 40, height: 40)
                    Image(systemName: icon)
                        .foregroundColor(Color.Hustl.textPrimary)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            .padding()
        }
    }
}

#Preview {
    ProfileView()
}
