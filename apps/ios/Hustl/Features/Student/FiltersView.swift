import SwiftUI

struct FiltersView: View {
    @Environment(\.dismiss) private var dismiss
    
    // Form state
    @State private var maxDistance: Double = 10
    @State private var minRate: Double = 100
    @State private var selectedTypes: Set<String> = ["Retail"]
    
    let jobTypes = ["Retail", "Food Service", "Events", "Warehouse", "Delivery"]
    
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
                Text("Filters")
                    .textStyle(Typography.headingMedium, color: Color.Hustl.textPrimary)
                Spacer()
                Button(action: {
                    maxDistance = 10
                    minRate = 100
                    selectedTypes.removeAll()
                }) {
                    Text("Reset")
                        .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                        .frame(width: 40, alignment: .trailing)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, Theme.Spacing.md)
            .background(Color.Hustl.bg)
            
            Divider().background(Color.Hustl.border)
            
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                    
                    // Distance filter
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        HStack {
                            Text("MAX DISTANCE")
                                .textStyle(Typography.label, color: Color.Hustl.textSecondary)
                            Spacer()
                            Text("\(Int(maxDistance)) km")
                                .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                        }
                        
                        Slider(value: $maxDistance, in: 1...50, step: 1)
                            .tint(Color.Hustl.lime)
                    }
                    
                    // Min rate filter
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        HStack {
                            Text("MINIMUM PAY RATE")
                                .textStyle(Typography.label, color: Color.Hustl.textSecondary)
                            Spacer()
                            Text("₹\(Int(minRate))/hr")
                                .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                        }
                        
                        Slider(value: $minRate, in: 50...500, step: 10)
                            .tint(Color.Hustl.lime)
                    }
                    
                    // Job type
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Text("SHIFT TYPE")
                            .textStyle(Typography.label, color: Color.Hustl.textSecondary)
                        
                        // Custom flow layout wrapper or just vstack of hstacks for simplicity
                        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                            ForEach(jobTypes, id: \.self) { type in
                                Toggle(isOn: Binding(
                                    get: { selectedTypes.contains(type) },
                                    set: { isSelected in
                                        if isSelected {
                                            selectedTypes.insert(type)
                                        } else {
                                            selectedTypes.remove(type)
                                        }
                                    }
                                )) {
                                    Text(type)
                                        .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                                }
                                .tint(Color.Hustl.lime)
                            }
                        }
                        .padding()
                        .background(Color.Hustl.card)
                        .cornerRadius(Theme.Radii.lg)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radii.lg).stroke(Color.Hustl.border, lineWidth: 1))
                    }
                }
                .padding()
            }
            .background(Color.Hustl.bg)
            
            // Footer
            VStack {
                Divider().background(Color.Hustl.border)
                GradientButton(title: "Show Matches") {
                    // Apply filters logic
                    dismiss()
                }
                .padding()
            }
            .background(Color.Hustl.bg)
        }
    }
}

#Preview {
    FiltersView()
}
