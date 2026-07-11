import Foundation
import Combine

@MainActor
public class AuthStore: ObservableObject {
    public static let shared = AuthStore()
    
    @Published public var user: AuthUser?
    @Published public var token: String?
    @Published public var isLoading = false
    @Published public var isHydrated = false
    
    private let tokenKey = "hustl_jwt"
    private let userKey = "hustl_user"
    
    private init() {
        NotificationCenter.default.addObserver(self, selector: #selector(handleLogoutNotification), name: NSNotification.Name("HustlLogoutNotification"), object: nil)
    }
    
    @objc private func handleLogoutNotification() {
        Task { await logout() }
    }
    
    public func hydrate() async {
        let savedToken = UserDefaults.standard.string(forKey: tokenKey)
        let savedUserJson = UserDefaults.standard.string(forKey: userKey)
        
        if let savedToken = savedToken, let savedUserJson = savedUserJson, let userData = savedUserJson.data(using: .utf8) {
            do {
                let decodedUser = try JSONDecoder().decode(AuthUser.self, from: userData)
                self.token = savedToken
                self.user = decodedUser
                APIClient.shared.token = savedToken
            } catch {
                UserDefaults.standard.removeObject(forKey: tokenKey)
                UserDefaults.standard.removeObject(forKey: userKey)
            }
        }
        self.isHydrated = true
    }
    
    public func login(emailOrPhone: String, password: String) async throws {
        self.isLoading = true
        defer { self.isLoading = false }
        
        let isEmail = emailOrPhone.contains("@")
        var body: [String: Any] = ["password": password]
        if isEmail {
            body["email"] = emailOrPhone
        } else {
            body["phone"] = emailOrPhone
        }
        
        let response = try await Endpoints.Auth.login(body: body)
        
        try save(user: response.user, token: response.token)
        self.user = response.user
        self.token = response.token
        APIClient.shared.token = response.token
    }
    
    public func register(name: String, email: String?, phone: String?, password: String, role: UserRole) async throws {
        self.isLoading = true
        defer { self.isLoading = false }
        
        var body: [String: Any] = [
            "name": name,
            "password": password,
            "role": role.rawValue
        ]
        if let email = email { body["email"] = email }
        if let phone = phone { body["phone"] = phone }
        
        let response = try await Endpoints.Auth.register(body: body)
        
        try save(user: response.user, token: response.token)
        self.user = response.user
        self.token = response.token
        APIClient.shared.token = response.token
    }
    
    public func logout() async {
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
        self.user = nil
        self.token = nil
        APIClient.shared.token = nil
    }
    
    public func setUser(_ user: AuthUser) throws {
        let data = try JSONEncoder().encode(user)
        let string = String(data: data, encoding: .utf8)
        UserDefaults.standard.set(string, forKey: userKey)
        self.user = user
    }
    
    private func save(user: AuthUser, token: String) throws {
        let data = try JSONEncoder().encode(user)
        let string = String(data: data, encoding: .utf8)
        UserDefaults.standard.set(string, forKey: userKey)
        UserDefaults.standard.set(token, forKey: tokenKey)
    }
}
