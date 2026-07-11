import SwiftUI

struct SignupView: View {
    @StateObject private var authStore = AuthStore.shared
    @State private var name = ""
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
                    
                    Text("Choose your lane")
                        .textStyle(Typography.displayMedium)
                        .multilineTextAlignment(.center)
                    
                    Text("Students find shifts. Businesses fill fast.")
                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
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
                
                // Form Header
                HStack {
                    Text("Create your account")
                        .textStyle(Typography.headingMedium)
                    Spacer()
                }
                .padding(.top, Theme.Spacing.sm)
                
                // Form
                VStack(spacing: Theme.Spacing.base) {
                    GlowInput(
                        title: "Enter your name",
                        text: $name,
                        label: "Name"
                    )
                    
                    GlowInput(
                        title: "Enter your phone number",
                        text: $phone,
                        label: "Phone Number"
                    )
                    .keyboardType(.phonePad)
                    
                    GlowInput(
                        title: "Create a password",
                        text: $password,
                        label: "Password",
                        isSecure: true
                    )
                }
                
                // Signup Button
                GradientButton(
                    title: "Join as \(selectedRole == .student ? "Student" : "Business") →",
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
                                role: selectedRole
                            )
                        } catch {
                            // TODO: Show error
                            print("Signup failed: \(error)")
                        }
                    }
                }
                
                // Login Link
                HStack(spacing: Theme.Spacing.xs) {
                    Text("Already have an account?")
                        .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                    Button("Login") {
                        // TODO: Navigate to Login
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

#Preview {
    SignupView()
}
