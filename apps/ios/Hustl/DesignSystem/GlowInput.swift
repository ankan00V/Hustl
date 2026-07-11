import SwiftUI

public struct GlowInput: View {
    public var title: String
    @Binding public var text: String
    public var label: String?
    public var error: String?
    public var isSecure: Bool = false
    
    @FocusState private var isFocused: Bool
    
    public init(
        title: String,
        text: Binding<String>,
        label: String? = nil,
        error: String? = nil,
        isSecure: Bool = false
    ) {
        self.title = title
        self._text = text
        self.label = label
        self.error = error
        self.isSecure = isSecure
    }
    
    private var borderColor: Color {
        if error != nil {
            return Color.Hustl.red
        } else if isFocused {
            return Color.Hustl.lime
        } else {
            return Color.Hustl.border
        }
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            if let label = label {
                Text(label.uppercased())
                    .font(Typography.labelSmall)
                    .foregroundColor(Color.Hustl.textSecondary)
            }
            
            Group {
                if isSecure {
                    SecureField(title, text: $text)
                } else {
                    TextField(title, text: $text)
                }
            }
            .focused($isFocused)
            .font(Typography.bodyLarge)
            .foregroundColor(Color.Hustl.textPrimary)
            .padding(Theme.Spacing.md)
            .frame(minHeight: 48)
            .background(Color.Hustl.card)
            .cornerRadius(Theme.Radii.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radii.md, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            )
            // Remove clear background to respect HIG, relying on standard hit testing
            
            if let error = error {
                Text(error)
                    .font(Typography.bodySmall)
                    .foregroundColor(Color.Hustl.red)
                    .padding(.top, 2)
            }
        }
        .padding(.bottom, Theme.Spacing.base)
    }
}

// Ensure proper placeholder coloring by applying a modifier if needed
public extension View {
    func placeholder<Content: View>(
        when shouldShow: Bool,
        alignment: Alignment = .leading,
        @ViewBuilder placeholder: () -> Content) -> some View {

        ZStack(alignment: alignment) {
            placeholder().opacity(shouldShow ? 1 : 0)
            self
        }
    }
}
