import XCTest
@testable import Hustl

@MainActor
final class WalletStoreTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        WalletStore.shared.clearWallet()
    }
    
    func testClearWallet() {
        let store = WalletStore.shared
        store.wallet = Wallet(balance: "100", pendingBalance: "50", totalEarnings: "150", totalWithdrawals: "0")
        store.transactions = [WalletTransaction(id: "1", type: "CREDIT", amount: "100", status: "COMPLETED", description: "Test", createdAt: "2026-07-10")]
        store.error = "Some error"
        store.transactionsPage = 2
        store.hasMoreTransactions = false
        
        store.clearWallet()
        
        XCTAssertNil(store.wallet)
        XCTAssertTrue(store.transactions.isEmpty)
        XCTAssertNil(store.error)
        XCTAssertEqual(store.transactionsPage, 1)
        XCTAssertTrue(store.hasMoreTransactions)
    }
}
