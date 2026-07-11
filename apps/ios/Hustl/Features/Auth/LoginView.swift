import SwiftUI

struct LoginView: View {
    @StateObject private var authStore = AuthStore.shared
    @State private var phone = ""
    @State private var password = ""
    @State private var selectedRole: UserRole = .student
    
    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.xl) {
                // Header
                VStack(spacing: Theme.Spacing.sm) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 40))
                        .foregroundColor(Color.Hustl.lime)
                    
                    Text("Welcome back")
                        .textStyle(Typography.displayMedium)
                }
                .padding(.top, Theme.Spacing.xxxl)
                
                // Role Selection
                HStack(spacing: Theme.Spacing.base) {
                    RoleCard(
                        title: "Student",
                        description: "Find shifts",
                        icon: "graduationcap",
                        isSelected: selectedRole == .student,
                        action: { selectedRole = .student }
                    )
                    
                    RoleCard(
                        title: "Business",
                        description: "Fill fast",
                        icon: "briefcase",
                        isSelected: selectedRole == .business,
                        action: { selectedRole = .business }
                    )
                }
                
                // Form
                VStack(spacing: Theme.Spacing.base) {
                    GlowInput(
                        title: "Enter your phone number",
                        text: $phone,
                        label: "Phone Number"
                    )
                    .keyboardType(.phonePad)
                    
                    VStack(alignment: .trailing, spacing: Theme.Spacing.xs) {
                        GlowInput(
                            title: "Enter your password",
                            text: $password,
                            label: "Password",
                            isSecure: true
                        )
                        
                        Button("Forgot Password?") {
                            // TODO: Handle forgot password
                        }
                        .textStyle(Typography.labelSmall, color: Color.Hustl.lime)
                    }
                }
                
                // Login Button
                GradientButton(
                    title: "Login →",
                    disabled: phone.isEmpty || password.isEmpty,
                    loading: authStore.isLoading
                ) {
                    Task {
                        do {
                            try await authStore.login(emailOrPhone: phone, password: password)
                        } catch {
                            // TODO: Show error
                            print("Login failed: \(error)")
                        }
                    }
                }
                
                // Social Logins
                HStack(spacing: Theme.Spacing.base) {
                    SocialButton(icon: "globe", title: "Google") 
                    SocialButton(icon: "applelogo", title: "Apple")
                }
                
                // Signup Link
                HStack(spacing: Theme.Spacing.xs) {
                    Text("New to Hustl?")
                        .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                    Button("Sign up") {
                        // TODO: Navigate to Signup
                    }
                    .textStyle(Typography.bodyMedium, color: Color.Hustl.lime)
                }
                .padding(.top, Theme.Spacing.sm)
            }
            .padding(Theme.Spacing.xl)
        }
        .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
    }
}

struct RoleCard: View {
    let title: String
    let description: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(isSelected ? Color.Hustl.lime : Color.Hustl.textSecondary)
                    
                    Spacer()
                    
                    if isSelected {
                        Circle()
                            .fill(Color.Hustl.lime)
                            .frame(width: 20, height: 20)
                            .overlay(
                                Image(systemName: "checkmark")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color.Hustl.bg)
                            )
                    }
                }
                
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text(title)
                        .textStyle(Typography.headingSmall, color: isSelected ? Color.Hustl.lime : Color.Hustl.textPrimary)
                    
                    Text(description)
                        .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                }
            }
            .padding(Theme.Spacing.base)
            .frame(maxWidth: .infinity)
            .background(isSelected ? Color.Hustl.lime.opacity(0.05) : Color.Hustl.card)
            .cornerRadius(Theme.Radii.lg)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radii.lg)
                    .stroke(isSelected ? Color.Hustl.lime : Color.Hustl.border, lineWidth: 1.5)
            )
        }
    }
}

struct SocialButton: View {
    let icon: String
    let title: String
    
    var body: some View {
        Button(action: {}) {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: icon)
                Text(title)
            }
            .textStyle(Typography.button)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.base)
            .background(Color.Hustl.elevated)
            .cornerRadius(Theme.Radii.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radii.md)
                    .stroke(Color.Hustl.borderLight, lineWidth: 1)
            )
        }
    }
}

#Preview {
    LoginView()
}
