import SwiftUI

struct BusinessProfileView: View {
    @StateObject private var authStore = AuthStore.shared
    @StateObject private var profileStore = ProfileStore.shared
    @State private var showingEditProfile = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerSection
                walletSection
                aboutSection
                actionSection
            }
            .padding(.vertical)
        }
        .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
    }
    
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(profileStore.businessProfile?.name ?? "Brew Lane Cafe")
                    .font(Typography.headingLarge)
                    .foregroundColor(Color.Hustl.textPrimary)
                Text(profileStore.businessProfile?.category ?? "Café / Food & Bev")
                    .font(Typography.bodyMedium)
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            Spacer()
        }
        .padding(.horizontal)
    }
    
    private var walletSection: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("WALLET BALANCE")
                    .font(Typography.labelSmall)
                    .foregroundColor(Color.Hustl.textSecondary)
                Text("₹" + String(format: "%.2f", profileStore.wallet?.balance ?? 12500.00))
                    .font(Typography.headingLarge)
                    .foregroundColor(Color.Hustl.lime)
            }
            Spacer()
            Button(action: { /* Navigate to add funds */ }) {
                Text("Add Funds")
                    .font(Typography.bodyMedium)
                    .foregroundColor(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.Hustl.lime)
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ABOUT")
                .font(Typography.labelSmall)
                .foregroundColor(Color.Hustl.textSecondary)
            
            Text(profileStore.businessProfile?.description ?? "We're a fast-paced specialty coffee shop in the heart of the city. We love working with enthusiastic students who want to learn about coffee!")
                .font(Typography.bodyMedium)
                .foregroundColor(Color.Hustl.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
            
            Divider().background(Color.Hustl.border).padding(.vertical, 8)
            
            VStack(alignment: .leading, spacing: 8) {
                infoRow(icon: "mappin.and.ellipse", text: profileStore.businessProfile?.address ?? "Koramangala, Bangalore")
                infoRow(icon: "globe", text: profileStore.businessProfile?.website ?? "thelocalcafe.com")
            }
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    private var actionSection: some View {
        VStack(spacing: 12) {
            Button("Edit Company Profile") { showingEditProfile = true }
                .font(Typography.bodyMedium)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.Hustl.card)
                .cornerRadius(12)
            
            Button("Log Out") { authStore.logout() }
                .font(Typography.bodyMedium)
                .foregroundColor(.red)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.Hustl.card)
                .cornerRadius(12)
        }
        .padding(.horizontal)
    }
    
    private func infoRow(icon: String, text: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundColor(Color.Hustl.purple).frame(width: 24)
            Text(text).font(Typography.bodyMedium).foregroundColor(Color.Hustl.textPrimary)
        }
    }
}
