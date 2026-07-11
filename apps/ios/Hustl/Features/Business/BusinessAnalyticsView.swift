import SwiftUI

struct BusinessAnalyticsView: View {
    @State private var isPro = false
    @StateObject private var authStore = AuthStore.shared
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Analytics")
                    .font(Typography.headingLarge)
                    .foregroundColor(Color.Hustl.textPrimary)
                    .padding(.horizontal)
                
                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        filterChip(title: "This Week", isSelected: true)
                        filterChip(title: "This Month", isSelected: false)
                        filterChip(title: "All Time", isSelected: false)
                    }
                    .padding(.horizontal)
                }
                
                if !isPro {
                    proGate
                } else {
                    statsGrid
                    bestTimeSection
                    topSkillsSection
                    funnelSection
                }
            }
            .padding(.vertical)
        }
        .background(Color.Hustl.background.edgesIgnoringSafeArea(.all))
    }
    
    private var proGate: some View {
        VStack(spacing: 16) {
            Image(systemName: "lock.fill")
                .font(.system(size: 40))
                .foregroundColor(Color.Hustl.purple)
                .padding(20)
                .background(Color.Hustl.elevated)
                .clipShape(Circle())
            
            Text("Unlock Hustl PRO+")
                .font(Typography.headingMedium)
                .foregroundColor(Color.Hustl.textPrimary)
            
            Text("Get advanced analytics, best times to post, and local skill trends to hire faster.")
                .font(Typography.bodyMedium)
                .multilineTextAlignment(.center)
                .foregroundColor(Color.Hustl.textSecondary)
                .padding(.horizontal)
            
            GradientButton(title: "Upgrade to PRO+ ₹1,999/mo", action: { isPro = true })
        }
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.Hustl.border, lineWidth: 1))
        .padding(.horizontal)
    }
    
    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            statCard(title: "Views", value: "1,248", trend: "+12%", up: true)
            statCard(title: "Applicants", value: "42", trend: "+5%", up: true)
            statCard(title: "Hired", value: "8", trend: "-2%", up: false)
            statCard(title: "Avg Response", value: "1.2h", trend: "Fast", up: true)
        }
        .padding(.horizontal)
    }
    
    private func filterChip(title: String, isSelected: Bool) -> some View {
        Text(title)
            .font(Typography.bodySmall)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.Hustl.lime : Color.Hustl.elevated)
            .foregroundColor(isSelected ? .black : Color.Hustl.textPrimary)
            .cornerRadius(20)
    }
    
    private func statCard(title: String, value: String, trend: String, up: Bool) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(Typography.labelSmall).foregroundColor(Color.Hustl.textSecondary)
            Text(value).font(Typography.headingLarge).foregroundColor(Color.Hustl.textPrimary)
            HStack(spacing: 4) {
                Image(systemName: up ? "arrow.up" : "arrow.down")
                    .foregroundColor(up ? Color.Hustl.lime : Color.Hustl.red)
                    .font(Typography.labelSmall)
                Text(trend).font(Typography.labelSmall).foregroundColor(up ? Color.Hustl.lime : Color.Hustl.red)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.Hustl.border, lineWidth: 1))
    }
    
    private func statBox(title: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(Typography.labelSmall)
                .foregroundColor(Color.Hustl.textSecondary)
            Text(value)
                .font(Typography.headingLarge)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.Hustl.card)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.Hustl.border, lineWidth: 1))
    }
    
    private var bestTimeSection: some View {
        VStack(alignment: .leading) {
            Text("Best Time to Post").font(Typography.labelSmall).foregroundColor(Color.Hustl.textSecondary)
            Text("[Bar Chart Placeholder]")
                .foregroundColor(Color.Hustl.textPrimary)
                .frame(maxWidth: .infinity, minHeight: 100)
                .background(Color.Hustl.card)
                .cornerRadius(12)
        }
    }
    
    private var topSkillsSection: some View {
        VStack(alignment: .leading) {
            Text("Top Skills in Your Area").font(Typography.labelSmall).foregroundColor(Color.Hustl.textSecondary)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack {
                    ForEach(["Barista", "Event Staff", "Photography", "Graphic Design", "Data Entry"], id: \.self) { skill in
                        Text(skill).font(Typography.bodySmall).foregroundColor(Color.Hustl.textPrimary).padding(.horizontal, 12).padding(.vertical, 6).background(Color.Hustl.elevated).cornerRadius(12)
                    }
                }
            }
        }
    }
    
    private var funnelSection: some View {
        VStack(alignment: .leading) {
            Text("Hiring Funnel").font(Typography.labelSmall).foregroundColor(Color.Hustl.textSecondary)
            VStack(spacing: 12) {
                funnelRow(label: "Impressions", value: "1248", pct: 1.0, color: Color.Hustl.purple)
                funnelRow(label: "Swipe Right", value: "312", pct: 0.25, color: Color.Hustl.lime)
                funnelRow(label: "Applied", value: "42", pct: 0.13, color: Color.Hustl.amber)
                funnelRow(label: "Hired", value: "8", pct: 0.19, color: Color.Hustl.blue)
            }
            .padding()
            .background(Color.Hustl.card)
            .cornerRadius(12)
        }
    }
    
    private func funnelRow(label: String, value: String, pct: Double, color: Color) -> some View {
        HStack {
            Text(label).font(Typography.labelSmall).foregroundColor(Color.Hustl.textSecondary).frame(width: 80, alignment: .leading)
            GeometryReader { geo in
                Rectangle()
                    .fill(color)
                    .frame(width: max(geo.size.width * CGFloat(pct), 4))
                    .cornerRadius(4)
            }
            .frame(height: 8)
            .background(Color.Hustl.border)
            .cornerRadius(4)
            Text(value).font(Typography.labelSmall).foregroundColor(Color.Hustl.textPrimary).frame(width: 40, alignment: .trailing)
        }
    }
}
