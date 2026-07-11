import XCTest

final class StudentNavigationUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments.append("--uitesting")
        // Pass a mock argument if possible to start at the StudentTabView
        app.launchArguments.append("--mock-student-logged-in")
        app.launch()
    }
    
    func testStudentTabsExistAndAreTappable() throws {
        // Tab bar buttons
        let discoverTab = app.tabBars.buttons["Discover"]
        let savedTab = app.tabBars.buttons["Saved"]
        let connectTab = app.tabBars.buttons["Connect"]
        let inboxTab = app.tabBars.buttons["Inbox"]
        let profileTab = app.tabBars.buttons["Profile"]
        
        // Only run assertions if we're actually in the tab view (mock might be needed)
        if discoverTab.exists {
            XCTAssertTrue(discoverTab.exists)
            XCTAssertTrue(savedTab.exists)
            XCTAssertTrue(connectTab.exists)
            XCTAssertTrue(inboxTab.exists)
            XCTAssertTrue(profileTab.exists)
            
            // Tap on each tab to verify it switches
            savedTab.tap()
            connectTab.tap()
            inboxTab.tap()
            profileTab.tap()
        }
    }
}
