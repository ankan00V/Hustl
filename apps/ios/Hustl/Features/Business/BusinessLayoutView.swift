import SwiftUI

struct BusinessLayoutView: View {
    var body: some View {
        TabView {
            BusinessDashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2")
                }
            
            PostListingView()
                .tabItem {
                    Label("Post", systemImage: "plus.circle")
                }
            
            MatchInboxView()
                .tabItem {
                    Label("Inbox", systemImage: "person.2")
                }
            
            BusinessAnalyticsView()
                .tabItem {
                    Label("Analytics", systemImage: "chart.bar")
                }
            
            BusinessProfileView()
                .tabItem {
                    Label("Profile", systemImage: "storefront")
                }
        }
        .accentColor(Color.Hustl.tabActive)
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.backgroundColor = UIColor(Color.Hustl.tabBar)
            UITabBar.appearance().standardAppearance = appearance
            if #available(iOS 15.0, *) {
                UITabBar.appearance().scrollEdgeAppearance = appearance
            }
        }
    }
}
