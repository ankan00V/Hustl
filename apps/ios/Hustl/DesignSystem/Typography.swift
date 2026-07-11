import SwiftUI

public enum Typography {
    private static let spaceMonoRegular = "SpaceMono-Regular"
    private static let spaceMonoBold = "SpaceMono-Bold"
    
    // Displays & Headings
    public static let displayLarge = Font.custom(spaceMonoBold, size: 48, relativeTo: .largeTitle)
    public static let displayMedium = Font.custom(spaceMonoBold, size: 36, relativeTo: .largeTitle)
    public static let headingLarge = Font.custom(spaceMonoBold, size: 28, relativeTo: .title)
    public static let headingMedium = Font.custom(spaceMonoBold, size: 22, relativeTo: .title2)
    public static let headingSmall = Font.custom(spaceMonoBold, size: 18, relativeTo: .title3)
    
    // Body Text
    public static let bodyLarge = Font.custom(spaceMonoRegular, size: 17, relativeTo: .body)
    public static let bodyMedium = Font.custom(spaceMonoRegular, size: 15, relativeTo: .subheadline)
    public static let bodySmall = Font.custom(spaceMonoRegular, size: 13, relativeTo: .footnote)
    
    // Monospaced Specific
    public static let monoLarge = Font.custom(spaceMonoBold, size: 24, relativeTo: .title3)
    public static let monoMedium = Font.custom(spaceMonoRegular, size: 16, relativeTo: .body)
    public static let monoSmall = Font.custom(spaceMonoRegular, size: 13, relativeTo: .footnote)
    public static let monoXL = Font.custom(spaceMonoBold, size: 32, relativeTo: .title)
    
    // Labels & Buttons
    public static let label = Font.custom(spaceMonoBold, size: 14, relativeTo: .caption) // uppercase in view
    public static let labelSmall = Font.custom(spaceMonoBold, size: 11, relativeTo: .caption2) // uppercase in view
    public static let button = Font.custom(spaceMonoBold, size: 16, relativeTo: .headline)
}

public extension View {
    func textStyle(_ font: Font, color: Color = Color.Hustl.textPrimary) -> some View {
        self.font(font)
            .foregroundColor(color)
    }
}
