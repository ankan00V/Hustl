from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    
    def handle_console(msg):
        if msg.type == "error":
            print(f"BROWSER CONSOLE ERROR: {msg.text}")
            
    def handle_pageerror(exception):
        print(f"BROWSER UNCAUGHT EXCEPTION: {exception}")
        
    page.on("console", handle_console)
    page.on("pageerror", handle_pageerror)
    
    page.goto("http://localhost:3001", wait_until="networkidle")
    page.wait_for_timeout(2000)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
