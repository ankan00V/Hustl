import SwiftUI

struct CampusConnectView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var activeTab: Int = 0 // 0 = Nearby, 1 = My Friends
    
    // Mock students for visual representation (no dedicated store yet)
    private let mockStudents = [
        MatchStudent(id: "1", name: "Sarah K.", avatarUrl: nil, reputationScore: 4.8, skills: ["Coffee", "Register"], completedShifts: 12),
        MatchStudent(id: "2", name: "Rahul M.", avatarUrl: nil, reputationScore: 4.5, skills: ["Greeting", "Logistics"], completedShifts: 8),
        MatchStudent(id: "3", name: "Priya D.", avatarUrl: nil, reputationScore: 5.0, skills: ["Retail"], completedShifts: 24)
    ]
    
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
                Text("Campus Connect")
                    .textStyle(Typography.headingMedium, color: Color.Hustl.textPrimary)
                Spacer()
                Color.clear.frame(width: 40, height: 40)
            }
            .padding(.horizontal)
            .padding(.vertical, Theme.Spacing.md)
            .background(Color.Hustl.bg)
            
            Divider().background(Color.Hustl.border)
            
            VStack {
                // Segmented Control (Tabs)
                Picker("Tabs", selection: $activeTab) {
                    Text("Nearby").tag(0)
                    Text("My Friends").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()
                .onAppear {
                    UISegmentedControl.appearance().selectedSegmentTintColor = UIColor(Color.Hustl.elevated)
                    UISegmentedControl.appearance().setTitleTextAttributes([.foregroundColor: UIColor.white], for: .selected)
                    UISegmentedControl.appearance().setTitleTextAttributes([.foregroundColor: UIColor.gray], for: .normal)
                }
                
                if activeTab == 1 {
                    // Empty State for My Friends
                    VStack(spacing: Theme.Spacing.base) {
                        Spacer()
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 48))
                            .foregroundColor(Color.Hustl.textSecondary)
                        Text("Invite your friends")
                            .textStyle(Typography.headingSmall, color: Color.Hustl.textPrimary)
                        Text("Add friends to see when they are working shifts and coordinate schedules.")
                            .textStyle(Typography.bodyMedium, color: Color.Hustl.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Theme.Spacing.xxl)
                        
                        GradientButton(title: "Invite Friends") {
                            // Invite logic
                        }
                        .padding(.horizontal, Theme.Spacing.xxl)
                        .padding(.top, Theme.Spacing.base)
                        Spacer()
                    }
                } else {
                    // Nearby Students List
                    ScrollView {
                        LazyVStack(spacing: Theme.Spacing.base) {
                            ForEach(mockStudents) { student in
                                studentCard(student)
                            }
                        }
                        .padding()
                    }
                }
            }
            .background(Color.Hustl.surface)
        }
    }
    
    private func studentCard(_ student: MatchStudent) -> some View {
        HStack(spacing: Theme.Spacing.base) {
            ZStack {
                Circle()
                    .fill(Color.Hustl.purple)
                    .frame(width: 48, height: 48)
                Text(String(student.name.prefix(2)).uppercased())
                    .font(Typography.headingSmall)
                    .foregroundColor(Color.Hustl.bg)
            }
            
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text(student.name)
                    .textStyle(Typography.bodyLarge, color: Color.Hustl.textPrimary)
                Text("\(student.completedShifts ?? 0) Shifts Completed")
                    .textStyle(Typography.bodySmall, color: Color.Hustl.textSecondary)
                
                HStack(spacing: Theme.Spacing.xs) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 10))
                        .foregroundColor(Color.Hustl.amber)
                    Text(String(format: "%.1f", student.reputationScore))
                        .textStyle(Typography.labelSmall, color: Color.Hustl.amber)
                }
            }
            
            Spacer()
            
            Button(action: {
                // Handle message action
            }) {
                ZStack {
                    Circle()
                        .fill(Color.Hustl.lime)
                        .frame(width: 40, height: 40)
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 16))
                        .foregroundColor(Color.Hustl.bg)
                }
            }
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(Theme.Radii.lg)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radii.lg)
                .stroke(Color.Hustl.border, lineWidth: 1)
        )
    }
}

#Preview {
    CampusConnectView()
}
