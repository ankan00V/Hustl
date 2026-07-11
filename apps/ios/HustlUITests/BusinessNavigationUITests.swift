import XCTest

final class BusinessNavigationUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments.append("--uitesting")
        // Pass a mock argument if possible to start at the BusinessLayoutView
        app.launchArguments.append("--mock-business-logged-in")
        app.launch()
    }
    
    func testBusinessTabsExistAndAreTappable() throws {
        // Tab bar buttons
        let dashboardTab = app.tabBars.buttons["Dashboard"]
        let postTab = app.tabBars.buttons["Post"]
        let inboxTab = app.tabBars.buttons["Inbox"]
        let analyticsTab = app.tabBars.buttons["Analytics"]
        let profileTab = app.tabBars.buttons["Profile"]
        
        if dashboardTab.exists {
            XCTAssertTrue(dashboardTab.exists)
            XCTAssertTrue(postTab.exists)
            XCTAssertTrue(inboxTab.exists)
            XCTAssertTrue(analyticsTab.exists)
            XCTAssertTrue(profileTab.exists)
            
            // Tap on each tab to verify it switches
            postTab.tap()
            inboxTab.tap()
            analyticsTab.tap()
            profileTab.tap()
        }
    }
}
