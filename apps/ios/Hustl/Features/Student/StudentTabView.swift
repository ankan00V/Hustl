import SwiftUI

struct StudentTabView: View {
    @State private var selectedTab: Int = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DeckView()
                .tabItem {
                    Image(systemName: "bolt.fill")
                    Text("Discover")
                }
                .tag(0)
            
            MatchesView()
                .tabItem {
                    Image(systemName: "heart.fill")
                    Text("Saved")
                }
                .tag(1)
            
            CampusConnectView()
                .tabItem {
                    Image(systemName: "square.grid.2x2.fill")
                    Text("Connect")
                }
                .tag(2)
            
            Text("Inbox Stub")
                .textStyle(Typography.bodyLarge)
                .tabItem {
                    Image(systemName: "envelope.fill")
                    Text("Inbox")
                }
                .tag(3)
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
                .tag(4)
        }
        .tint(Color.Hustl.lime)
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(Color.Hustl.tabBar)
            UITabBar.appearance().standardAppearance = appearance
            if #available(iOS 15.0, *) {
                UITabBar.appearance().scrollEdgeAppearance = appearance
            }
        }
    }
}

#Preview {
    StudentTabView()
}
