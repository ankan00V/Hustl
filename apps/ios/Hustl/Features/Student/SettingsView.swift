import SwiftUI

struct SettingsView: View {
    @State private var pushEnabled: Bool = true
    @State private var darkEnabled: Bool = true
    @State private var showToast: Bool = false
    @State private var toastMessage: String = ""
    @Environment(\.dismiss) private var dismiss
    
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
                Text("Settings")
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
                    
                    // Preferences
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        sectionTitle("PREFERENCES")
                        
                        cardBackground {
                            VStack(spacing: 0) {
                                toggleRow(icon: "bell", title: "Push Notifications", isOn: $pushEnabled)
                                Divider().background(Color.Hustl.border).padding(.horizontal)
                                toggleRow(icon: "moon", title: "Dark Mode", isOn: $darkEnabled)
                            }
                        }
                    }
                    
                    // Account
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        sectionTitle("ACCOUNT")
                        
                        cardBackground {
                            VStack(spacing: 0) {
                                navRow(icon: "lock", title: "Privacy & Security")
                                Divider().background(Color.Hustl.border).padding(.horizontal)
                                navRow(icon: "doc.text", title: "Tax Documents")
                            }
                        }
                    }
                    
                    // Support
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        sectionTitle("SUPPORT")
                        
                        cardBackground {
                            VStack(spacing: 0) {
                                navRow(icon: "questionmark.circle", title: "Help Center")
                                Divider().background(Color.Hustl.border).padding(.horizontal)
                                navRow(icon: "doc.text", title: "Terms of Service")
                            }
                        }
                    }
                    
                    // Version
                    Text("Hustl App v2.1.0")
                        .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, Theme.Spacing.xxl)
                }
                .padding()
            }
            .background(Color.Hustl.surface)
        }
        .onChange(of: pushEnabled) { newValue in
            toastMessage = newValue ? "Push Enabled. You will now receive urgent shift alerts." : "Push Disabled."
            showToast = true
        }
        .alert(isPresented: $showToast) {
            Alert(title: Text("Notification"), message: Text(toastMessage), dismissButton: .default(Text("OK")))
        }
    }
    
    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .textStyle(Typography.label, color: Color.Hustl.textSecondary)
            .padding(.leading, Theme.Spacing.sm)
    }
    
    private func cardBackground<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .background(Color.Hustl.card)
            .cornerRadius(Theme.Radii.lg)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radii.lg)
                    .stroke(Color.Hustl.border, lineWidth: 1)
            )
    }
    
    private func toggleRow(icon: String, title: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: Theme.Spacing.base) {
            ZStack {
                RoundedRectangle(cornerRadius: Theme.Radii.sm)
                    .fill(Color.Hustl.elevated)
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .foregroundColor(Color.Hustl.textPrimary)
            }
            
            Text(title)
                .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
            
            Spacer()
            
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Color.Hustl.lime)
        }
        .padding()
    }
    
    private func navRow(icon: String, title: String) -> some View {
        Button(action: {
            // Handle navigation
        }) {
            HStack(spacing: Theme.Spacing.base) {
                ZStack {
                    RoundedRectangle(cornerRadius: Theme.Radii.sm)
                        .fill(Color.Hustl.elevated)
                        .frame(width: 36, height: 36)
                    Image(systemName: icon)
                        .foregroundColor(Color.Hustl.textPrimary)
                }
                
                Text(title)
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            .padding()
        }
    }
}

#Preview {
    SettingsView()
}
