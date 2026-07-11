import SwiftUI

struct MatchInboxView: View {
    @State private var matches: [Match] = []
    @State private var loading = false
    @State private var selectedStoryStudent: String? = nil
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.Hustl.bg.edgesIgnoringSafeArea(.all)
                
                VStack(alignment: .leading) {
                    Text("Inbox")
                        .font(Typography.headingLarge)
                        .foregroundColor(Color.Hustl.textPrimary)
                        .padding()
                    
                    if loading {
                        Text("Loading applicants...")
                            .foregroundColor(.gray)
                    } else if matches.isEmpty {
                        emptyState
                    } else {
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(matches) { match in
                                    NavigationLink(destination: BusinessChatView(matchId: match.id)) {
                                        inboxRow(match: match)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
            }
            .navigationBarHidden(true)
            .sheet(item: $selectedStoryStudentBinding) { studentNameWrapper in
                Text("Story Viewer for \(studentNameWrapper.name)")
            }
        }
    }
    
    struct StudentWrapper: Identifiable { var id: String { name }; var name: String }
    private var selectedStoryStudentBinding: Binding<StudentWrapper?> {
        Binding(
            get: { selectedStoryStudent.map { StudentWrapper(name: $0) } },
            set: { selectedStoryStudent = $0?.name }
        )
    }
    
    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("📥").font(.system(size: 48))
            Text("No applicants yet").font(.title2).foregroundColor(.white)
            Text("Students will appear here when they swipe right on your listings.").multilineTextAlignment(.center).foregroundColor(.gray)
        }
        .padding(.vertical, 40)
        .frame(maxWidth: .infinity)
    }
    
    private func inboxRow(match: Match) -> some View {
        HStack(spacing: 16) {
            Circle()
                .fill(Color.Hustl.purple)
                .frame(width: 50, height: 50)
                .overlay(Text(String((match.student?.name ?? "ST").prefix(2).uppercased())).font(Typography.bodyLarge).foregroundColor(.white))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(match.student?.name ?? "Student")
                    .font(Typography.bodyLarge)
                    .foregroundColor(Color.Hustl.textPrimary)
                Text(match.listing?.title ?? "Shift")
                    .font(Typography.bodySmall)
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(match.status.rawValue)
                    .font(Typography.labelSmall)
                    .foregroundColor(match.status == .pending ? Color.Hustl.amber : Color.Hustl.lime)
                
                if match.status == .pending {
                    Circle()
                        .fill(Color.Hustl.red)
                        .frame(width: 8, height: 8)
                }
            }
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.Hustl.border, lineWidth: 1))
    }
    
    @ViewBuilder
    private func statusBadge(status: String) -> some View {
        if status == "CHECKED_IN" {
            Text("🟢 Checked In").font(.caption).bold().foregroundColor(.green).padding(.horizontal, 8).padding(.vertical, 2).background(Color.green.opacity(0.2)).cornerRadius(12)
        } else if status == "ACCEPTED" {
            Text("✓ Scheduled").font(.caption).bold().foregroundColor(.orange).padding(.horizontal, 8).padding(.vertical, 2).background(Color.orange.opacity(0.2)).cornerRadius(12)
        } else {
            Text("✓ Completed").font(.caption).bold().foregroundColor(.gray).padding(.horizontal, 8).padding(.vertical, 2).background(Color.gray.opacity(0.2)).cornerRadius(12)
        }
    }
}
