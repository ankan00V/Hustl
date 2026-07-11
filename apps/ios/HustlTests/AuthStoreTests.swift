import XCTest
@testable import Hustl

@MainActor
final class AuthStoreTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        UserDefaults.standard.removeObject(forKey: "hustl_jwt")
        UserDefaults.standard.removeObject(forKey: "hustl_user")
        AuthStore.shared.token = nil
        AuthStore.shared.user = nil
    }
    
    func testHydrateWithNoData() async throws {
        let store = AuthStore.shared
        await store.hydrate()
        
        XCTAssertTrue(store.isHydrated)
        XCTAssertNil(store.user)
        XCTAssertNil(store.token)
    }
    
    func testHydrateWithValidData() async throws {
        let user = AuthUser(id: "1", name: "Test User", email: "test@example.com", phone: nil, role: .student, avatarUrl: nil, isVerified: true, reputationScore: 5.0, referralCode: nil)
        let token = "test_token_123"
        
        let userData = try JSONEncoder().encode(user)
        let userString = String(data: userData, encoding: .utf8)
        
        UserDefaults.standard.set(userString, forKey: "hustl_user")
        UserDefaults.standard.set(token, forKey: "hustl_jwt")
        
        let store = AuthStore.shared
        await store.hydrate()
        
        XCTAssertTrue(store.isHydrated)
        XCTAssertEqual(store.token, token)
        XCTAssertEqual(store.user?.id, "1")
        XCTAssertEqual(store.user?.name, "Test User")
    }
    
    func testLogout() async throws {
        UserDefaults.standard.set("dummy_token", forKey: "hustl_jwt")
        UserDefaults.standard.set("dummy_user", forKey: "hustl_user")
        
        let store = AuthStore.shared
        store.token = "dummy_token"
        await store.logout()
        
        XCTAssertNil(store.user)
        XCTAssertNil(store.token)
        XCTAssertNil(APIClient.shared.token)
        XCTAssertNil(UserDefaults.standard.string(forKey: "hustl_jwt"))
        XCTAssertNil(UserDefaults.standard.string(forKey: "hustl_user"))
    }
}
