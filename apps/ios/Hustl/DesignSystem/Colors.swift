import SwiftUI

public extension Color {
    enum Hustl {
        // Backgrounds
        public static let bg = Color(hex: "#0A0A0A")
        public static let surface = Color(hex: "#0A0A0A")
        public static let card = Color(hex: "#161616")
        public static let elevated = Color(hex: "#1E1E1E")
        public static let raised = Color(hex: "#2A2A2A")
        
        // Primary Accent (Lime Green)
        public static let lime = Color(hex: "#C8F33A")
        public static let limeLight = Color(hex: "#E5FF5C")
        public static let limeDark = Color(hex: "#AACC00")
        
        // Amber Accent
        public static let amber = Color(hex: "#F59E0B")
        
        // Secondary Accent (Purple)
        public static let purple = Color(hex: "#9D4EDD")
        public static let purpleDark = Color(hex: "#7B2CBF")
        
        // Feedback
        public static let green = Color(hex: "#C8F33A")
        public static let red = Color(hex: "#EF4444")
        
        // Text
        public static let textPrimary = Color(hex: "#FFFFFF")
        public static let textSecondary = Color(hex: "#888888")
        public static let textMuted = Color(hex: "#444444")
        public static let textLime = Color(hex: "#C8F33A")
        
        // Borders
        public static let border = Color(hex: "#242424")
        public static let borderLight = Color(hex: "#2A2A2A")
        public static let borderActive = Color(hex: "#C8F33A")
        public static let borderLime = Color(hex: "#C8F33A").opacity(0.3)
        public static let glass = Color(hex: "#FFFFFF").opacity(0.04)
        
        // Tab bar
        public static let tabBar = Color(hex: "#0A0A0A")
        public static let tabBarBorder = Color(hex: "#1A1A1A")
        public static let tabInactive = Color(hex: "#888888")
        public static let tabActive = Color(hex: "#C8F33A")
        
        // Gradients
        public static let limeCta = LinearGradient(colors: [Color(hex: "#C8F33A"), Color(hex: "#9D4EDD")], startPoint: .leading, endPoint: .trailing)
    }
}

// Helper for Hex initialization
public extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
