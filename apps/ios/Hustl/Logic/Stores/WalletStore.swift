import Foundation
import Combine

@MainActor
public class WalletStore: ObservableObject {
    public static let shared = WalletStore()
    
    @Published public var wallet: Wallet?
    @Published public var transactions: [WalletTransaction] = []
    @Published public var loading = false
    @Published public var error: String? = nil
    @Published public var transactionsPage = 1
    @Published public var hasMoreTransactions = true
    
    private init() {}
    
    public func fetchWallet() async {
        self.loading = true
        self.error = nil
        do {
            let response = try await Endpoints.WalletAPI.getBalance()
            self.wallet = response.wallet
        } catch {
            self.error = error.localizedDescription
        }
        self.loading = false
    }
    
    public func fetchTransactions(page: Int = 1) async {
        self.loading = true
        self.error = nil
        do {
            let response = try await Endpoints.WalletAPI.getTransactions(page: page, limit: 20)
            if page == 1 {
                self.transactions = response.transactions
            } else {
                self.transactions.append(contentsOf: response.transactions)
            }
            self.transactionsPage = page
            self.hasMoreTransactions = response.transactions.count == 20
        } catch {
            self.error = error.localizedDescription
        }
        self.loading = false
    }
    
    public func loadMoreTransactions() async {
        guard hasMoreTransactions, !loading else { return }
        await fetchTransactions(page: transactionsPage + 1)
    }
    
    public func requestPayout(amount: Double, upiId: String) async throws {
        do {
            try await Endpoints.WalletAPI.requestPayout(amount: amount, upiId: upiId)
            await fetchWallet()
            await fetchTransactions(page: 1)
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }
    
    public func refreshWallet() async {
        async let walletTask: () = fetchWallet()
        async let txTask: () = fetchTransactions(page: 1)
        _ = await (walletTask, txTask)
    }
    
    public func clearWallet() {
        self.wallet = nil
        self.transactions = []
        self.error = nil
        self.transactionsPage = 1
        self.hasMoreTransactions = true
    }
}
