import SwiftUI

struct PostListingView: View {
    @State private var title = ""
    @State private var description = ""
    @State private var skills = ""
    @State private var hourlyRate = ""
    @State private var totalHours = ""
    @State private var urgent = false
    @State private var submitting = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Post a Shift")
                        .font(Typography.headingLarge)
                        .foregroundColor(Color.Hustl.textPrimary)
                    Text("Fill shifts fast. Students swipe in minutes.")
                        .font(Typography.bodyMedium)
                        .foregroundColor(Color.Hustl.textSecondary)
                    
                    GlowInput(title: "e.g. Evening Barista", text: $title, label: "SHIFT TITLE")
                    GlowInput(title: "What the shift involves...", text: $description, label: "DESCRIPTION")
                    GlowInput(title: "Coffee, POS, Hindi", text: $skills, label: "SKILLS NEEDED")
                    
                    HStack(spacing: 16) {
                        GlowInput(title: "200", text: $hourlyRate, label: "RATE (₹/HR)")
                        GlowInput(title: "4", text: $totalHours, label: "DURATION (HRS)")
                    }
                    
                    urgentHiringCard
                    
                    GradientButton(
                        title: "Post Shift to Decks →",
                        disabled: submitting,
                        loading: submitting,
                        action: handlePost
                    )
                }
                .padding()
            }
            .background(Color.Hustl.bg.edgesIgnoringSafeArea(.all))
            .navigationBarHidden(true)
        }
    }
    
    // Replaced by GlowInput component
    
    private var urgentHiringCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("⚡ URGENT HIRING")
                    .font(Typography.labelSmall)
                    .foregroundColor(Color.Hustl.red)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.Hustl.red.opacity(0.1))
                    .cornerRadius(4)
                
                Text("Push instant alerts to students nearby for immediate fulfillment")
                    .font(Typography.bodySmall)
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            Spacer()
            Toggle("", isOn: $urgent)
                .labelsHidden()
                .tint(Color.Hustl.amber)
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.Hustl.borderLime, lineWidth: 1))
    }
    
    private func handlePost() {
        // API Call to post listing
        submitting = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            submitting = false
            title = ""
            description = ""
            skills = ""
            hourlyRate = ""
            totalHours = ""
            urgent = false
        }
    }
}
