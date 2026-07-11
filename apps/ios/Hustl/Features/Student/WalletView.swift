import SwiftUI

struct WalletView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var walletStore = WalletStore.shared
    @State private var showWithdrawForm: Bool = false
    
    // Mock chart data
    private let chartData: [(label: String, value: CGFloat)] = [
        ("Mon", 0.3), ("Tue", 0.6), ("Wed", 0.4), ("Thu", 0.9),
        ("Fri", 0.5), ("Sat", 1.0), ("Sun", 0.0)
    ]
    
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
                Text("Wallet")
                    .textStyle(Typography.headingMedium, color: Color.Hustl.textPrimary)
                Spacer()
                Color.clear.frame(width: 40, height: 40)
            }
            .padding(.horizontal)
            .padding(.vertical, Theme.Spacing.md)
            .background(Color.Hustl.bg)
            
            Divider().background(Color.Hustl.border)
            
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                    
                    // Main Balance Card
                    VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                        HStack {
                            Text("AVAILABLE BALANCE")
                                .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                            Spacer()
                            Text("+12%")
                                .textStyle(Typography.labelSmall, color: Color.Hustl.lime)
                                .padding(.horizontal, Theme.Spacing.sm)
                                .padding(.vertical, 4)
                                .background(Color.Hustl.lime.opacity(0.1))
                                .clipShape(Capsule())
                                .overlay(Capsule().stroke(Color.Hustl.lime, lineWidth: 1))
                        }
                        
                        Text("₹\(walletStore.wallet?.balance ?? "0.00")")
                            .font(Typography.displayMedium)
                            .foregroundColor(Color.Hustl.textPrimary)
                        
                        GradientButton(title: "Withdraw to UPI") {
                            showWithdrawForm = true
                        }
                    }
                    .padding()
                    .background(Color.Hustl.card)
                    .cornerRadius(Theme.Radii.lg)
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radii.lg).stroke(Color.Hustl.border, lineWidth: 1))
                    
                    // Stats Grid
                    HStack(spacing: 0) {
                        statBox(value: "12", label: "Completed")
                        Divider().background(Color.Hustl.border)
                        statBox(value: "₹\(walletStore.wallet?.pendingBalance ?? "0.00")", label: "Pending")
                        Divider().background(Color.Hustl.border)
                        statBox(value: "₹183", label: "Avg / Hour")
                    }
                    .padding(.vertical)
                    .background(Color.Hustl.card)
                    .cornerRadius(Theme.Radii.lg)
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radii.lg).stroke(Color.Hustl.border, lineWidth: 1))
                    
                    // Chart Card
                    VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                        sectionTitle("EARNINGS PROGRESS")
                        
                        HStack(alignment: .bottom, spacing: Theme.Spacing.sm) {
                            ForEach(chartData, id: \.label) { data in
                                VStack(spacing: Theme.Spacing.sm) {
                                    ZStack(alignment: .bottom) {
                                        RoundedRectangle(cornerRadius: Theme.Radii.xs)
                                            .fill(Color.Hustl.elevated)
                                            .frame(maxWidth: .infinity)
                                        
                                        RoundedRectangle(cornerRadius: Theme.Radii.xs)
                                            .fill(Color.Hustl.lime)
                                            .frame(height: 100 * data.value)
                                            .frame(maxWidth: .infinity)
                                    }
                                    .frame(height: 100)
                                    
                                    Text(data.label)
                                        .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.Hustl.card)
                    .cornerRadius(Theme.Radii.lg)
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radii.lg).stroke(Color.Hustl.border, lineWidth: 1))
                    
                    // Transaction List
                    sectionTitle("RECENT TRANSACTIONS")
                    
                    if walletStore.loading && walletStore.transactions.isEmpty {
                        ProgressView().frame(maxWidth: .infinity)
                    } else if walletStore.transactions.isEmpty {
                        VStack(spacing: Theme.Spacing.sm) {
                            Text("No transactions yet")
                                .textStyle(Typography.headingSmall, color: Color.Hustl.textPrimary)
                            Text("Complete shifts to see ledger records here.")
                                .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Theme.Spacing.xxl)
                        .background(Color.Hustl.card)
                        .cornerRadius(Theme.Radii.lg)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radii.lg).stroke(Color.Hustl.border, lineWidth: 1))
                    } else {
                        LazyVStack(spacing: Theme.Spacing.md) {
                            ForEach(walletStore.transactions) { tx in
                                transactionRow(tx)
                            }
                            if walletStore.hasMoreTransactions {
                                ProgressView()
                                    .onAppear {
                                        Task { await walletStore.loadMoreTransactions() }
                                    }
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color.Hustl.bg)
            .refreshable {
                await walletStore.refreshWallet()
            }
        }
        .task {
            await walletStore.refreshWallet()
        }
        .sheet(isPresented: $showWithdrawForm) {
            NavigationView {
                Text("Withdrawal Form Stub")
                    .textStyle(Typography.bodyLarge)
                    .navigationTitle("Withdraw")
                    .navigationBarItems(trailing: Button("Close") { showWithdrawForm = false }.foregroundColor(Color.Hustl.lime))
            }
        }
    }
    
    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .textStyle(Typography.label, color: Color.Hustl.textSecondary)
    }
    
    private func statBox(value: String, label: String) -> some View {
        VStack(spacing: Theme.Spacing.xs) {
            Text(value)
                .textStyle(Typography.headingSmall, color: Color.Hustl.textPrimary)
            Text(label)
                .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }
    
    private func transactionRow(_ tx: WalletTransaction) -> some View {
        let isDeposit = tx.type == "SHIFT_PAY" || tx.type == "BONUS"
        let iconName = isDeposit ? "arrow.down.left" : "arrow.up.right"
        let color: Color = isDeposit ? Color.Hustl.lime : Color.Hustl.textPrimary
        let prefix = isDeposit ? "+" : "-"
        let title = tx.type.replacingOccurrences(of: "_", with: " ").capitalized
        
        return HStack(spacing: Theme.Spacing.base) {
            ZStack {
                Circle()
                    .fill(Color.Hustl.elevated)
                    .frame(width: 48, height: 48)
                Image(systemName: iconName)
                    .foregroundColor(color)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                Text(tx.createdAt.prefix(10).description)
                    .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
            }
            
            Spacer()
            
            Text("\(prefix)₹\(tx.amount)")
                .textStyle(Typography.headingSmall, color: color)
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(Theme.Radii.md)
        .overlay(RoundedRectangle(cornerRadius: Theme.Radii.md).stroke(Color.Hustl.border, lineWidth: 1))
    }
}

// Ensure theme spacing extension is satisfied if missing xs
extension Theme.Radii {
    static let xs: CGFloat = 4
}

#Preview {
    WalletView()
}
