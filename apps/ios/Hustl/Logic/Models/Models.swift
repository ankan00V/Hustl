import Foundation

// MARK: - Enums
public enum UserRole: String, Codable {
    case student = "STUDENT"
    case business = "BUSINESS"
    case admin = "ADMIN"
}

public enum MatchStatus: String, Codable {
    case pending = "PENDING"
    case accepted = "ACCEPTED"
    case checkedIn = "CHECKED_IN"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
    case noShow = "NO_SHOW"
}

// MARK: - Auth
public struct AuthUser: Codable, Identifiable {
    public let id: String
    public let name: String
    public let email: String?
    public let phone: String?
    public let role: UserRole
    public let avatarUrl: String?
    public let isVerified: Bool
    public let reputationScore: Double
    public let referralCode: String?
}

public struct AuthResponse: Codable {
    public let user: AuthUser
    public let token: String
}

// MARK: - Profile
public struct StudentProfile: Codable {
    public let userId: String
    public let skills: [String]
    public let portfolioUrls: [String]
    public let collegeName: String
    public let badges: [String]
    public let completedShifts: Int
    public let availabilitySlots: [String]
    public let urgentOptIn: Bool
    public let campusId: String?
    public let campusVerifiedAt: String?
}

public struct BusinessProfile: Codable {
    public let userId: String
    public let businessName: String
    public let category: String
    public let address: String
    public let isVerified: Bool
    public let badgeLevel: String?
    public let campusId: String?
    public let currentTier: String
}

public struct Badge: Codable, Identifiable {
    public let id: String
    public let name: String
    public let category: String
    public let earnedAt: String
}

// MARK: - Deck / Listing
public struct Listing: Codable, Identifiable {
    public let id: String
    public let businessId: String
    public let businessName: String
    public let businessCategory: String
    public let businessReputation: Double
    public let businessAvatar: String?
    public let title: String
    public let description: String
    public let skills: [String]
    public let hourlyRate: String
    public let startTime: String
    public let endTime: String
    public let totalHours: Double
    public let isUrgent: Bool
    public let verifiedBadgeOnly: Bool
    public let status: String
    public let distance: Double?
    public let matchScore: Double?
    public let boostedUntil: String?
}

// MARK: - Match
public struct MatchListing: Codable, Identifiable {
    public let id: String
    public let title: String
    public let description: String?
    public let hourlyRate: String
    public let totalHours: Double?
    public let startTime: String
    public let endTime: String
    public let businessName: String
    public let businessCategory: String?
    public let address: String?
}

public struct MatchStudent: Codable, Identifiable {
    public let id: String
    public let name: String
    public let avatarUrl: String?
    public let reputationScore: Double
    public let skills: [String]?
    public let completedShifts: Int?
}

public struct Match: Codable, Identifiable {
    public let id: String
    public let status: MatchStatus
    public let listing: MatchListing?
    public let listingId: String?
    public let student: MatchStudent?
    public let studentId: String?
    public let checkInTime: String?
    public let checkOutTime: String?
    public let agreedHours: Double?
    public let createdAt: String
    public let acceptedAt: String?
    public let completedAt: String?
}

// MARK: - Wallet
public struct WalletTransaction: Codable, Identifiable {
    public let id: String
    public let type: String
    public let amount: String
    public let status: String
    public let description: String
    public let createdAt: String
}

public struct WalletBalance: Codable {
    public let availableBalance: String
    public let pendingBalance: String
    public let currency: String
}

public struct Wallet: Codable {
    public let balance: String
    public let pendingBalance: String
    public let totalEarnings: String
    public let totalWithdrawals: String
}

// MARK: - Chat
public struct ChatMessage: Codable, Identifiable {
    public let id: String
    public let matchId: String
    public let senderId: String
    public let text: String
    public let createdAt: String
    public let readAt: String?
}
