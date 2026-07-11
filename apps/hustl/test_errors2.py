from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    
    def handle_console(msg):
        print(f"CONSOLE [{msg.type}]: {msg.text}")
            
    def handle_pageerror(exception):
        print(f"UNCAUGHT EXCEPTION: {exception}")

    def handle_request_failed(request):
        print(f"REQUEST FAILED: {request.url} - {request.failure}")
        
    page.on("console", handle_console)
    page.on("pageerror", handle_pageerror)
    page.on("requestfailed", handle_request_failed)
    
    page.goto("http://localhost:3001", wait_until="networkidle")
    page.wait_for_timeout(2000)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
