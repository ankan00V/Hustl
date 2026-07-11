import SwiftUI

struct OnboardingView: View {
    enum Step {
        case phone
        case otp
        case role
    }
    
    @StateObject private var authStore = AuthStore.shared
    @State private var currentStep: Step = .phone
    @State private var phone = ""
    @State private var otp = ""
    @State private var name = ""
    @State private var role: UserRole? = nil
    @State private var resendTimer = 0
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ScrollView {
            VStack {
                switch currentStep {
                case .phone:
                    phoneStep
                case .otp:
                    otpStep
                case .role:
                    roleStep
                }
            }
            .padding(Theme.Spacing.xl)
        }
        .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
        .onReceive(timer) { _ in
            if resendTimer > 0 {
                resendTimer -= 1
            }
        }
    }
    
    private var phoneStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            // Header
            VStack(spacing: Theme.Spacing.sm) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 40))
                    .foregroundColor(Color.Hustl.lime)
                
                Text("Welcome to Hustl")
                    .textStyle(Typography.displayMedium)
                
                Text("Enter your phone number to get started")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, Theme.Spacing.xxxl)
            
            // Phone Input
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("PHONE NUMBER")
                    .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                
                HStack(spacing: 0) {
                    Text("🇮🇳 +91")
                        .textStyle(Typography.bodyLarge, color: .white)
                        .padding(.horizontal, Theme.Spacing.base)
                        .padding(.vertical, 14)
                        .background(Color.Hustl.card)
                    
                    Divider()
                        .background(Color.Hustl.border)
                    
                    TextField("9876543210", text: $phone)
                        .keyboardType(.phonePad)
                        .font(Typography.bodyLarge)
                        .foregroundColor(.white)
                        .padding(.horizontal, Theme.Spacing.base)
                        .padding(.vertical, 14)
                        .background(Color.Hustl.card)
                }
                .cornerRadius(Theme.Radii.md)
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radii.md)
                        .stroke(Color.Hustl.border, lineWidth: 1)
                )
            }
            
            // Send OTP Button
            GradientButton(
                title: "Send OTP →",
                disabled: phone.isEmpty,
                loading: authStore.isLoading
            ) {
                handleSendOTP()
            }
        }
        .transition(.opacity)
    }
    
    private var otpStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            // Header
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Button(action: {
                    withAnimation { currentStep = .phone }
                }) {
                    Image(systemName: "arrow.left")
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                }
                .padding(.bottom, Theme.Spacing.base)
                
                Text("Enter OTP")
                    .textStyle(Typography.displayMedium)
                
                Text("We sent a 6-digit code to +91\(phone)")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, Theme.Spacing.lg)
            
            // OTP Input
            GlowInput(
                title: "OTP",
                text: $otp
            )
            .keyboardType(.numberPad)
            
            // Resend
            if resendTimer > 0 {
                Text("Resend OTP in \(resendTimer)s")
                    .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
            } else {
                Button("Resend OTP") {
                    handleSendOTP()
                }
                .textStyle(Typography.button, color: Color.Hustl.purple)
            }
            
            // Verify Button
            GradientButton(
                title: "Verify →",
                disabled: otp.count < 6,
                loading: authStore.isLoading
            ) {
                handleVerifyOTP()
            }
        }
        .transition(.opacity)
    }
    
    private var roleStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            // Header
            VStack(spacing: Theme.Spacing.sm) {
                Text("Choose your role")
                    .textStyle(Typography.displayMedium)
                
                Text("Are you a student or business?")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            .padding(.top, Theme.Spacing.xxxl)
            
            // Role Selection Cards
            VStack(spacing: Theme.Spacing.base) {
                RoleSelectionCard(
                    title: "Student",
                    description: "Find flexible work opportunities",
                    icon: "graduationcap",
                    isSelected: role == .student,
                    action: { withAnimation { role = .student } }
                )
                
                RoleSelectionCard(
                    title: "Business",
                    description: "Hire students for shifts",
                    icon: "briefcase",
                    isSelected: role == .business,
                    action: { withAnimation { role = .business } }
                )
            }
            
            // Name Input
            GlowInput(
                title: role == .student ? "Ananya Rao" : "Brew Lane Cafe",
                text: $name,
                label: "Your Name"
            )
            
            // Continue Button
            GradientButton(
                title: "Continue →",
                disabled: role == nil || name.isEmpty,
                loading: authStore.isLoading
            ) {
                handleCompleteRegistration()
            }
        }
        .transition(.opacity)
    }
    
    private func handleSendOTP() {
        authStore.isLoading = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            authStore.isLoading = false
            withAnimation {
                currentStep = .otp
                resendTimer = 60
            }
        }
    }
    
    private func handleVerifyOTP() {
        authStore.isLoading = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            authStore.isLoading = false
            withAnimation {
                currentStep = .role
            }
        }
    }
    
    private func handleCompleteRegistration() {
        guard let role = role else { return }
        Task {
            do {
                try await authStore.register(
                    name: name,
                    email: nil,
                    phone: phone,
                    password: "password", // Typically handled later or generated if OTP
                    role: role
                )
            } catch {
                print("Registration failed: \(error)")
            }
        }
    }
}

#Preview {
    OnboardingView()
}
