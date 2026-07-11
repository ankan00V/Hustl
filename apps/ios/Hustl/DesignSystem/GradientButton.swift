import SwiftUI

public struct GradientButtonStyle: ButtonStyle {
    public var isDisabled: Bool = false
    public var isLoading: Bool = false
    
    public init(isDisabled: Bool = false, isLoading: Bool = false) {
        self.isDisabled = isDisabled
        self.isLoading = isLoading
    }
    
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Typography.button)
            .foregroundColor(isDisabled ? Color.Hustl.textMuted : Color.Hustl.bg)
            .padding(.vertical, Theme.Spacing.base)
            .padding(.horizontal, Theme.Spacing.xl)
            .frame(minHeight: 56)
            .frame(maxWidth: .infinity) // often buttons are full width, or let caller define
            .background(
                Group {
                    if isDisabled {
                        Color.Hustl.elevated
                    } else {
                        Color.Hustl.limeCta
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radii.lg, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeOut(duration: 0.2), value: configuration.isPressed)
            .opacity(isLoading ? 0.8 : 1.0)
    }
}

public struct GradientButton: View {
    public var title: String
    public var action: () -> Void
    public var icon: String? = nil // system icon name
    public var disabled: Bool = false
    public var loading: Bool = false
    
    public init(
        title: String,
        icon: String? = nil,
        disabled: Bool = false,
        loading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.disabled = disabled
        self.loading = loading
        self.action = action
    }
    
    public var body: some View {
        Button(action: {
            if !disabled && !loading {
                action()
            }
        }) {
            HStack(spacing: Theme.Spacing.sm) {
                if let icon = icon, !loading {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                }
                
                if loading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Color.Hustl.textMuted))
                    Text("Loading...")
                } else {
                    Text(title)
                }
            }
        }
        .buttonStyle(GradientButtonStyle(isDisabled: disabled, isLoading: loading))
        .disabled(disabled || loading)
    }
}
