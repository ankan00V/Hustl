import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda exc: errors.append(f"[uncaught] {exc}"))
        
        try:
            print("Navigating...")
            await page.goto("http://localhost:8081", timeout=5000, wait_until="networkidle")
            await asyncio.sleep(2)
        except Exception as e:
            print(f"Navigation error: {e}")
            
        print("--- CONSOLE OUTPUT ---")
        for e in errors:
            print(e)
            
        await browser.close()

asyncio.run(run())
