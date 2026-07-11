import XCTest
@testable import Hustl

final class ModelsTests: XCTestCase {
    
    func testAuthUserDecoding() throws {
        let json = """
        {
            "id": "123",
            "name": "John Doe",
            "email": "john@example.com",
            "role": "STUDENT",
            "isVerified": true,
            "reputationScore": 4.5
        }
        """.data(using: .utf8)!
        
        let decoder = JSONDecoder()
        let user = try decoder.decode(AuthUser.self, from: json)
        
        XCTAssertEqual(user.id, "123")
        XCTAssertEqual(user.name, "John Doe")
        XCTAssertEqual(user.email, "john@example.com")
        XCTAssertEqual(user.role, .student)
        XCTAssertTrue(user.isVerified)
        XCTAssertEqual(user.reputationScore, 4.5)
        XCTAssertNil(user.phone)
        XCTAssertNil(user.avatarUrl)
        XCTAssertNil(user.referralCode)
    }
    
    func testMatchStatusEnum() throws {
        XCTAssertEqual(MatchStatus.pending.rawValue, "PENDING")
        XCTAssertEqual(MatchStatus.accepted.rawValue, "ACCEPTED")
        XCTAssertEqual(MatchStatus.checkedIn.rawValue, "CHECKED_IN")
        XCTAssertEqual(MatchStatus.completed.rawValue, "COMPLETED")
        XCTAssertEqual(MatchStatus.cancelled.rawValue, "CANCELLED")
        XCTAssertEqual(MatchStatus.noShow.rawValue, "NO_SHOW")
    }
    
    func testMatchDecoding() throws {
        let json = """
        {
            "id": "match_1",
            "status": "COMPLETED",
            "createdAt": "2026-07-10T12:00:00Z"
        }
        """.data(using: .utf8)!
        
        let decoder = JSONDecoder()
        let match = try decoder.decode(Match.self, from: json)
        
        XCTAssertEqual(match.id, "match_1")
        XCTAssertEqual(match.status, .completed)
        XCTAssertEqual(match.createdAt, "2026-07-10T12:00:00Z")
        XCTAssertNil(match.listing)
        XCTAssertNil(match.student)
    }
}
