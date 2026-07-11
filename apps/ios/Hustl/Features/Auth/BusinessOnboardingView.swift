import SwiftUI

struct BusinessOnboardingView: View {
    enum Step: Int, CaseIterable {
        case company = 0
        case details
        case location
        case logo
        
        var progress: Double {
            switch self {
            case .company: return 25
            case .details: return 50
            case .location: return 75
            case .logo: return 100
            }
        }
    }
    
    @State private var currentStep: Step = .company
    
    // Company state
    @State private var companyName = ""
    @State private var selectedIndustry = ""
    
    // Details state
    @State private var employeeCount = ""
    @State private var description = ""
    
    // Location state
    @State private var street = ""
    @State private var city = ""
    @State private var state = ""
    @State private var zip = ""
    
    @State private var isLoading = false
    
    let industries = [
        "Restaurant/Food Service",
        "Retail",
        "Events/Entertainment",
        "Hospitality",
        "Technology",
        "Delivery/Logistics",
        "Education",
        "Other"
    ]
    
    let employeeRanges = [
        "1-10", "11-50", "51-200", "201-500", "500+"
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
                        case .company: companyStep
                        case .details: detailsStep
                        case .location: locationStep
                        case .logo: logoStep
                        }
                    }
                    .padding(Theme.Spacing.xl)
                    .padding(.bottom, 100)
                }
            }
            
            // Bottom Actions
            HStack(spacing: Theme.Spacing.base) {
                if currentStep != .company {
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
                    title: currentStep == .logo ? "Complete Setup →" : "Next →",
                    disabled: !canProceed,
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
    
    private var canProceed: Bool {
        switch currentStep {
        case .company:
            return !companyName.isEmpty && !selectedIndustry.isEmpty
        case .details:
            return !employeeCount.isEmpty && !description.isEmpty
        case .location:
            return !street.isEmpty && !city.isEmpty && !state.isEmpty && !zip.isEmpty
        case .logo:
            return true // Logo is optional
        }
    }
    
    private var companyStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("Tell us about your business")
                    .textStyle(Typography.headingMedium)
                    .multilineTextAlignment(.center)
                Text("Let's get your company profile set up")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            GlowInput(
                title: "e.g., Acme Corp",
                text: $companyName,
                label: "Company Name"
            )
            
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("INDUSTRY")
                    .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                
                Menu {
                    ForEach(industries, id: \.self) { industry in
                        Button(industry) {
                            selectedIndustry = industry
                        }
                    }
                } label: {
                    HStack {
                        Text(selectedIndustry.isEmpty ? "Select Industry" : selectedIndustry)
                            .font(Typography.bodyLarge)
                            .foregroundColor(selectedIndustry.isEmpty ? Color.Hustl.textSecondary : Color.Hustl.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.down")
                            .foregroundColor(Color.Hustl.textSecondary)
                    }
                    .padding(Theme.Spacing.md)
                    .frame(minHeight: 48)
                    .background(Color.Hustl.card)
                    .cornerRadius(Theme.Radii.md)
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.Radii.md)
                            .stroke(Color.Hustl.border, lineWidth: 1)
                    )
                }
            }
        }
    }
    
    private var detailsStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("Business Details")
                    .textStyle(Typography.headingMedium)
                Text("This helps students know who they are working for")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("NUMBER OF EMPLOYEES")
                    .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: Theme.Spacing.md)], spacing: Theme.Spacing.md) {
                    ForEach(employeeRanges, id: \.self) { range in
                        let isSelected = employeeCount == range
                        Button(action: {
                            employeeCount = range
                        }) {
                            Text(range)
                                .textStyle(Typography.bodyMedium, color: isSelected ? Color.Hustl.lime : Color.Hustl.textSecondary)
                                .padding(.vertical, Theme.Spacing.md)
                                .frame(maxWidth: .infinity)
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
            
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("COMPANY DESCRIPTION")
                    .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                
                TextEditor(text: $description)
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
                
                Text("\(description.count)/500")
                    .textStyle(Typography.labelSmall, color: Color.Hustl.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
    }
    
    private var locationStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("Where are you located?")
                    .textStyle(Typography.headingMedium)
                Text("This helps us match you with local students")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            VStack(alignment: .leading, spacing: Theme.Spacing.base) {
                GlowInput(
                    title: "123 Main St",
                    text: $street,
                    label: "Street Address"
                )
                
                GlowInput(
                    title: "San Francisco",
                    text: $city,
                    label: "City"
                )
                
                HStack(spacing: Theme.Spacing.base) {
                    GlowInput(
                        title: "CA",
                        text: $state,
                        label: "State"
                    )
                    
                    GlowInput(
                        title: "94105",
                        text: $zip,
                        label: "ZIP Code"
                    )
                    .keyboardType(.numberPad)
                }
            }
        }
    }
    
    private var logoStep: some View {
        VStack(spacing: Theme.Spacing.xl) {
            VStack(spacing: Theme.Spacing.sm) {
                Text("Add your company logo")
                    .textStyle(Typography.headingMedium)
                Text("Make your job postings stand out")
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textSecondary)
            }
            
            // TODO: Add image picker implementation
            Button(action: {}) {
                VStack(spacing: Theme.Spacing.md) {
                    Image(systemName: "photo.badge.plus")
                        .font(.system(size: 32))
                    Text("Upload Logo")
                        .textStyle(Typography.button)
                }
                .foregroundColor(Color.Hustl.lime)
                .frame(width: 140, height: 140)
                .background(Color.Hustl.lime.opacity(0.1))
                .cornerRadius(Theme.Radii.lg)
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radii.lg)
                        .stroke(Color.Hustl.lime, style: StrokeStyle(lineWidth: 2, dash: [6]))
                )
            }
            .padding(.vertical, Theme.Spacing.xxl)
            
            Button("Skip for now") {
                withAnimation { handleNext() }
            }
            .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
        }
    }
    
    private func handleNext() {
        switch currentStep {
        case .company:
            withAnimation { currentStep = .details }
        case .details:
            withAnimation { currentStep = .location }
        case .location:
            withAnimation { currentStep = .logo }
        case .logo:
            isLoading = true
            // TODO: API integration for saving business onboarding
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                isLoading = false
            }
        }
    }
    
    private func handleBack() {
        switch currentStep {
        case .company: break
        case .details: withAnimation { currentStep = .company }
        case .location: withAnimation { currentStep = .details }
        case .logo: withAnimation { currentStep = .location }
        }
    }
}

#Preview {
    BusinessOnboardingView()
}
