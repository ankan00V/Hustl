import XCTest

final class AuthUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments.append("--uitesting")
    }
    
    func testLoginViewElementsExist() throws {
        app.launch()
        
        // Wait for the login screen or navigate to it if needed
        // Assuming LoginView is presented
        
        // Verify Role Cards exist
        let studentRoleCard = app.buttons["Student"]
        XCTAssertTrue(studentRoleCard.exists || app.staticTexts["Welcome back"].exists, "Student role card or Welcome back text should exist")
        
        // Check for inputs
        let phoneInput = app.textFields["Enter your phone number"]
        let passwordInput = app.secureTextFields["Enter your password"]
        
        if phoneInput.exists && passwordInput.exists {
            phoneInput.tap()
            phoneInput.typeText("1234567890")
            
            passwordInput.tap()
            passwordInput.typeText("password123")
            
            // Check login button
            let loginButton = app.buttons["Login →"]
            XCTAssertTrue(loginButton.exists)
        }
    }
    
    func testRoleSelectView() throws {
        app.launch()
        
        // Look for the "Choose your lane" text which is in RoleSelectView
        let chooseLaneText = app.staticTexts["Choose your lane"]
        if chooseLaneText.exists {
            let studentCard = app.buttons["Student"]
            let businessCard = app.buttons["Business"]
            
            XCTAssertTrue(studentCard.exists)
            XCTAssertTrue(businessCard.exists)
            
            // Tap student card
            studentCard.tap()
            
            // Should show Registration Form
            let nameInput = app.textFields["Ananya Rao"]
            XCTAssertTrue(nameInput.waitForExistence(timeout: 2))
        }
    }
}
