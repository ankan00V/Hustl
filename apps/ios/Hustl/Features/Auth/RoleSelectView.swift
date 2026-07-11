import SwiftUI

struct RoleSelectView: View {
    @StateObject private var authStore = AuthStore.shared
    @State private var name = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var selectedRole: UserRole? = nil
    
    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.xl) {
                // Header
                VStack(spacing: Theme.Spacing.sm) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 40))
                        .foregroundColor(Color.Hustl.lime)
                    
                    Text("Choose your lane")
                        .textStyle(Typography.displayMedium)
                        .multilineTextAlignment(.center)
                    
                    Text("Students find shifts. Businesses fill shifts fast.")
                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, Theme.Spacing.xxxl)
                
                // Role Selection Cards
                VStack(spacing: Theme.Spacing.base) {
                    RoleSelectionCard(
                        title: "Student",
                        description: "Swipe through nearby work, unlock badges, build your HUSTL score.",
                        icon: "graduationcap",
                        isSelected: selectedRole == .student,
                        action: {
                            withAnimation(.spring()) {
                                selectedRole = .student
                            }
                        }
                    )
                    
                    RoleSelectionCard(
                        title: "Business",
                        description: "Post shifts, review students, hire urgent help in real time.",
                        icon: "briefcase",
                        isSelected: selectedRole == .business,
                        action: {
                            withAnimation(.spring()) {
                                selectedRole = .business
                            }
                        }
                    )
                }
                
                // Registration Form
                if let role = selectedRole {
                    VStack(spacing: Theme.Spacing.base) {
                        Text("Create your account")
                            .textStyle(Typography.headingMedium)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        GlowInput(
                            title: role == .student ? "Ananya Rao" : "Brew Lane Cafe",
                            text: $name,
                            label: "Your Name"
                        )
                        
                        GlowInput(
                            title: "Enter your phone number",
                            text: $phone,
                            label: "Phone Number"
                        )
                        .keyboardType(.phonePad)
                        
                        GlowInput(
                            title: "Min 6 characters",
                            text: $password,
                            label: "Password",
                            isSecure: true
                        )
                        
                        GradientButton(
                            title: "Join as \(role == .student ? "Student" : "Business") →",
                            disabled: name.isEmpty || phone.isEmpty || password.isEmpty,
                            loading: authStore.isLoading
                        ) {
                            Task {
                                do {
                                    try await authStore.register(
                                        name: name,
                                        email: nil,
                                        phone: phone,
                                        password: password,
                                        role: role
                                    )
                                } catch {
                                    print("Register error: \(error)")
                                }
                            }
                        }
                        
                        // Login Link
                        HStack(spacing: Theme.Spacing.xs) {
                            Text("Already have an account?")
                                .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                            Button("Log in") {
                                // TODO: Navigate to Login
                            }
                            .textStyle(Typography.bodyMedium, color: Color.Hustl.purple)
                        }
                        .padding(.top, Theme.Spacing.sm)
                    }
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                
                // Footer
                VStack(spacing: Theme.Spacing.xs) {
                    Text("By continuing, you agree to our")
                        .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                    HStack(spacing: Theme.Spacing.xs) {
                        Button("Terms") { }
                            .textStyle(Typography.bodySmall, color: Color.Hustl.purple)
                        Text("and")
                            .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                        Button("Privacy Policy") { }
                            .textStyle(Typography.bodySmall, color: Color.Hustl.purple)
                    }
                }
                .padding(.top, Theme.Spacing.base)
            }
            .padding(Theme.Spacing.xl)
        }
        .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
    }
}

struct RoleSelectionCard: View {
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
                        .font(.system(size: 24))
                        .foregroundColor(isSelected ? Color.Hustl.lime : Color.Hustl.textSecondary)
                    
                    Text(title)
                        .textStyle(Typography.headingMedium, color: .white)
                    
                    Spacer()
                }
                
                Text(description)
                    .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                    .multilineTextAlignment(.leading)
                
                if isSelected {
                    Text("✓ Selected")
                        .textStyle(Typography.labelSmall, color: Color.Hustl.lime)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, Theme.Spacing.xs)
                        .background(Color.Hustl.lime.opacity(0.15))
                        .cornerRadius(Theme.Radii.pill)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radii.pill)
                                .stroke(Color.Hustl.lime.opacity(0.3), lineWidth: 1)
                        )
                }
            }
            .padding(Theme.Spacing.base)
            .frame(maxWidth: .infinity)
            .background(isSelected ? Color.Hustl.lime.opacity(0.05) : Color.Hustl.glass)
            .cornerRadius(Theme.Radii.lg)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radii.lg)
                    .stroke(isSelected ? Color.Hustl.lime : Color.Hustl.glass, lineWidth: 1.5)
            )
        }
    }
}

#Preview {
    RoleSelectView()
}
