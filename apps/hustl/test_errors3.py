from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3001", wait_until="networkidle")
    page.wait_for_timeout(2000)
    
    # take screenshot to see what playwright sees
    page.screenshot(path="pw_screenshot.png")
    
    # count DOM elements
    body_content = page.evaluate("document.body.innerHTML.substring(0, 500)")
    print("BODY:", body_content)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
