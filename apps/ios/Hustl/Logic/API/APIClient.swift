import Foundation

public enum APIError: Error {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case serverError(statusCode: Int, message: String, code: String?)
}

public class APIClient {
    public static let shared = APIClient()
    
    // In a real app, you might inject this from configuration
    private let baseURL = "http://localhost:4000"
    public var token: String?
    
    private init() {}
    
    public func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        headers: [String: String] = [:]
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError(statusCode: 0, message: "Invalid Response", code: nil)
        }
        
        if !(200...299).contains(httpResponse.statusCode) {
            if httpResponse.statusCode == 401 {
                // Post notification for AuthStore to catch and log out
                NotificationCenter.default.post(name: NSNotification.Name("HustlLogoutNotification"), object: nil)
            }
            throw APIError.serverError(statusCode: httpResponse.statusCode, message: "Request failed with status \(httpResponse.statusCode)", code: nil)
        }
        
        do {
            let decoder = JSONDecoder()
            // Depending on the backend, you might need decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
    
    public func requestEmpty(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        headers: [String: String] = [:]
    ) async throws {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError(statusCode: 0, message: "Invalid Response", code: nil)
        }
        
        if !(200...299).contains(httpResponse.statusCode) {
            if httpResponse.statusCode == 401 {
                NotificationCenter.default.post(name: NSNotification.Name("HustlLogoutNotification"), object: nil)
            }
            throw APIError.serverError(statusCode: httpResponse.statusCode, message: "Request failed with status \(httpResponse.statusCode)", code: nil)
        }
    }
}
