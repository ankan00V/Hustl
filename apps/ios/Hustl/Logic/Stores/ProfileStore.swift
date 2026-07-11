import Foundation
import Combine

@MainActor
public class ProfileStore: ObservableObject {
    public static let shared = ProfileStore()
    
    @Published public var studentProfile: StudentProfile?
    @Published public var businessProfile: BusinessProfile?
    @Published public var badges: [Badge] = []
    @Published public var wallet: WalletBalance?
    @Published public var isProfileLoading = false
    
    private init() {}
    
    public func setStudentProfile(_ profile: StudentProfile) {
        self.studentProfile = profile
    }
    
    public func setBusinessProfile(_ profile: BusinessProfile) {
        self.businessProfile = profile
    }
    
    public func setBadges(_ badges: [Badge]) {
        self.badges = badges
    }
    
    public func setWallet(_ wallet: WalletBalance) {
        self.wallet = wallet
    }
    
    public func clearProfile() {
        self.studentProfile = nil
        self.businessProfile = nil
        self.badges = []
        self.wallet = nil
    }
}
