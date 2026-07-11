import SwiftUI

struct StudentOnboardingView: View {
    enum Step: Int, CaseIterable {
        case college = 0
        case skills
        case bio
        case avatar
        case availability
        
        var progress: Double {
            switch self {
            case .college: return 20
            case .skills: return 40
            case .bio: return 60
            case .avatar: return 80
            case .availability: return 100
            }
        }
    }
    
    @State private var currentStep: Step = .college
    @State private var collegeName = ""
    @State private var selectedSkills: Set<String> = []
    @State private var bio = ""
    @State private var availability: Set<String> = []
    @State private var isLoading = false
    
    let skillOptions = [
        "Barista", "Waiter", "Cashier", "Sales", "Event Staff",
        "Delivery", "Data Entry", "Content Writing", "Social Media",
        "Photography", "Videography", "Graphic Design", "Teaching", "Tutoring"
    ]
    
    let availabilitySlots = [
        ("Weekday Mornings", "weekday_morning"),
        ("Weekday Afternoons", "weekday_afternoon"),
        ("Weekday Evenings", "weekday_evening"),
        ("Weekend Mornings", "weekend_morning"),
        ("Weekend Afternoons", "weekend_afternoon"),
        ("Weekend Evenings", "weekend_evening")
    ]
    
    var body: some View {
        ZStack(alignment: .bottom) {
            Color.Hustl.bg.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Progress Bar
                VStack(spacing: Theme.Spacing.sm) {
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.Hustl.border)
                                .frame(height: 4)
                                .cornerRadius(2)
                            
                            Rectangle()
                                .fill(Color.Hustl.lime)
                                .frame(width: geometry.size.width * CGFloat(currentStep.progress / 100), height: 4)
                                .cornerRadius(2)
                        }
                    }
                    .frame(height: 4)
                    
                    Text("\(Int(currentStep.progress))% Complete")
                        .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                }
                .padding(.horizontal, Theme.Spacing.xl)
                .padding(.top, Theme.Spacing.base)
                
                ScrollView {
                    VStack(spacing: Theme.Spacing.xl) {
                        switch currentStep {
                        case .college: collegeStep
                        case .skills: skillsStep
                        case .bio: bioStep
                        case .avatar: avatarStep
                        case .availability: availabilityStep
                        }
                    }
                    .padding(Theme.Spacing.xl)
                    .padding(.bottom, 100)
                }
            }
            
            // Bottom Actions
            HStack(spacing: Theme.Spacing.base) {
                if currentStep != .college {
                    Button(action: handleBack) {
                        HStack {
                            Image(systemName: "arrow.left")
                            Text("Back")
                        }
                        .textStyle(Typography.button)
                        .padding(.horizontal, Theme.Spacing.lg)
                        .padding(.vertical, Theme.Spacing.base)
                        .background(Color.clear)
                        .cornerRadius(Theme.Radii.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radii.md)
                                .stroke(Color.Hustl.borderLight, lineWidth: 1.5)
                        )
                    }
                }
                
                GradientButton(
                    title: currentStep == .availability ? "Complete →" : "Next →",
                    loading: isLoading
                ) {
                    handleNext()
                }
            }
            .padding(Theme.Spacing.xl)
            .background(Color.Hustl.bg)
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(Color.Hustl.border),
                alignment: .top
            )
        }
    }
    
    private var collegeStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("Which college do you attend?")
                    .textStyle(Typography.headingMedium)
                    .multilineTextAlignment(.center)
                Text("This helps us verify your student status")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            GlowInput(
                title: "e.g., IIT Bombay, BITS Pilani",
                text: $collegeName,
                label: "College Name"
            )
        }
    }
    
    private var skillsStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("What are your skills?")
                    .textStyle(Typography.headingMedium)
                Text("Select up to 5 skills")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 120), spacing: Theme.Spacing.md)], spacing: Theme.Spacing.md) {
                ForEach(skillOptions, id: \.self) { skill in
                    let isSelected = selectedSkills.contains(skill)
                    Button(action: {
                        if isSelected {
                            selectedSkills.remove(skill)
                        } else if selectedSkills.count < 5 {
                            selectedSkills.insert(skill)
                        }
                    }) {
                        HStack(spacing: 6) {
                            Text(skill)
                                .textStyle(Typography.bodyMedium, color: isSelected ? Color.Hustl.lime : Color.Hustl.textSecondary)
                            if isSelected {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(Color.Hustl.lime)
                            }
                        }
                        .padding(.horizontal, Theme.Spacing.md)
                        .padding(.vertical, Theme.Spacing.sm)
                        .frame(maxWidth: .infinity)
                        .background(isSelected ? Color.Hustl.lime.opacity(0.1) : Color.Hustl.card)
                        .cornerRadius(Theme.Radii.xl)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radii.xl)
                                .stroke(isSelected ? Color.Hustl.lime : Color.Hustl.border, lineWidth: 1)
                        )
                    }
                }
            }
            
            Text("\(selectedSkills.count)/5 skills selected")
                .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
        }
    }
    
    private var bioStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("Tell us about yourself")
                    .textStyle(Typography.headingMedium)
                Text("Write a short bio to stand out to employers")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            VStack(alignment: .trailing, spacing: Theme.Spacing.xs) {
                TextEditor(text: $bio)
                    .frame(height: 120)
                    .padding(Theme.Spacing.sm)
                    .font(Typography.bodyLarge)
                    .foregroundColor(Color.Hustl.textPrimary)
                    .background(Color.Hustl.card)
                    .cornerRadius(Theme.Radii.md)
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.Radii.md)
                            .stroke(Color.Hustl.border, lineWidth: 1)
                    )
                    .scrollContentBackground(.hidden)
                
                Text("\(bio.count)/500")
                    .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
            }
        }
    }
    
    private var avatarStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("Add a profile photo")
                    .textStyle(Typography.headingMedium)
                Text("A photo helps employers recognize you")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            // TODO: Add image picker implementation
            Button(action: {}) {
                VStack(spacing: Theme.Spacing.md) {
                    Image(systemName: "camera")
                        .font(.system(size: 32))
                    Text("Upload Photo")
                        .textStyle(Typography.button)
                }
                .foregroundColor(Color.Hustl.lime)
                .frame(width: 140, height: 140)
                .background(Color.Hustl.lime.opacity(0.1))
                .cornerRadius(70)
                .overlay(
                    Circle().stroke(Color.Hustl.lime, style: StrokeStyle(lineWidth: 2, dash: [6]))
                )
            }
            .padding(.vertical, Theme.Spacing.xxl)
            
            Button("Skip for now") {
                withAnimation { currentStep = .availability }
            }
            .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
        }
    }
    
    private var availabilityStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("When are you available?")
                    .textStyle(Typography.headingMedium)
                Text("Select your preferred work times")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            VStack(spacing: Theme.Spacing.md) {
                ForEach(availabilitySlots, id: \.1) { slot in
                    let isSelected = availability.contains(slot.1)
                    Button(action: {
                        if isSelected {
                            availability.remove(slot.1)
                        } else {
                            availability.insert(slot.1)
                        }
                    }) {
                        HStack {
                            Text(slot.0)
                                .textStyle(Typography.button, color: isSelected ? Color.Hustl.lime : Color.Hustl.textSecondary)
                            Spacer()
                            if isSelected {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(Color.Hustl.lime)
                            }
                        }
                        .padding()
                        .background(isSelected ? Color.Hustl.lime.opacity(0.1) : Color.Hustl.card)
                        .cornerRadius(Theme.Radii.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radii.md)
                                .stroke(isSelected ? Color.Hustl.lime : Color.Hustl.border, lineWidth: 1)
                        )
                    }
                }
            }
        }
    }
    
    private func handleNext() {
        switch currentStep {
        case .college:
            withAnimation { currentStep = .skills }
        case .skills:
            withAnimation { currentStep = .bio }
        case .bio:
            withAnimation { currentStep = .avatar }
        case .avatar:
            withAnimation { currentStep = .availability }
        case .availability:
            isLoading = true
            // TODO: API integration for saving student onboarding
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                isLoading = false
            }
        }
    }
    
    private func handleBack() {
        switch currentStep {
        case .college: break
        case .skills: withAnimation { currentStep = .college }
        case .bio: withAnimation { currentStep = .skills }
        case .avatar: withAnimation { currentStep = .bio }
        case .availability: withAnimation { currentStep = .avatar }
        }
    }
}

#Preview {
    StudentOnboardingView()
}
