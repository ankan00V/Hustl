import sys
import time
import socket
import subprocess
from playwright.sync_api import sync_playwright

def is_port_open(port):
    # Try IPv4
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            s.connect(('127.0.0.1', port))
            return True
    except:
        pass
    # Try IPv6
    try:
        with socket.socket(socket.AF_INET6, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            s.connect(('::1', port))
            return True
    except:
        pass
    # Try getaddrinfo (resolving localhost)
    try:
        for res in socket.getaddrinfo('localhost', port, socket.AF_UNSPEC, socket.SOCK_STREAM):
            af, socktype, proto, canonname, sa = res
            try:
                with socket.socket(af, socktype, proto) as s:
                    s.settimeout(0.5)
                    s.connect(sa)
                    return True
            except:
                pass
    except:
        pass
    return False

def main():
    server_process = None
    started_server = False
    port = 3001
    
    if not is_port_open(port):
        print(f"Port {port} is closed. Starting dev server...")
        server_process = subprocess.Popen(
            "pnpm --filter hustl-web dev",
            shell=True,
            cwd="/Users/ankanghosh/Desktop/Hustl",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        started_server = True
        
        # Wait for the server to start
        timeout = 20
        start_time = time.time()
        while not is_port_open(port):
            # Check if process has terminated
            if server_process.poll() is not None:
                out, err = server_process.communicate()
                print(f"Server process terminated early. Exit code: {server_process.returncode}")
                print(f"Stdout: {out}")
                print(f"Stderr: {err}")
                sys.exit(1)
            if time.time() - start_time > timeout:
                print("Timeout waiting for dev server to start on port 3001")
                if server_process:
                    server_process.terminate()
                sys.exit(1)
            time.sleep(0.5)
        print("Dev server started successfully on port 3001.")
    else:
        print("Dev server is already running on port 3001.")
        
    errors = []
    
    def handle_pageerror(err):
        print(f"Page error detected: {err}")
        errors.append(f"PageError: {err}")

    def handle_console(msg):
        if msg.type == "error":
            print(f"Console error detected: {msg.text}")
            # Ignore favicon.ico 404 or other network resource errors if they are not JS errors
            if "favicon.ico" not in msg.text and "Failed to load resource" not in msg.text:
                errors.append(f"ConsoleError: {msg.text}")

    try:
        with sync_playwright() as p:
            # Launch chromium in headless mode
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            page.on("pageerror", handle_pageerror)
            page.on("console", handle_console)
            
            print("Navigating to http://localhost:3001...")
            page.goto("http://localhost:3001")
            page.wait_for_load_state("networkidle")
            
            # Verify body has contents initially
            has_content = page.evaluate("document.body.children.length > 0")
            if not has_content:
                errors.append("Page body is empty on load.")
                
            print("Starting scroll simulation for 20 seconds...")
            start_scroll = time.time()
            scroll_duration = 20
            direction = 1
            
            while time.time() - start_scroll < scroll_duration:
                # scroll
                if direction == 1:
                    page.evaluate("window.scrollBy(0, 150)")
                else:
                    page.evaluate("window.scrollBy(0, -150)")
                
                # Check scroll positions
                scroll_y = page.evaluate("window.scrollY")
                max_scroll_y = page.evaluate("document.documentElement.scrollHeight - window.innerHeight")
                
                if direction == 1 and scroll_y >= max_scroll_y - 10:
                    direction = -1
                elif direction == -1 and scroll_y <= 10:
                    direction = 1
                
                # Check responsiveness and white screen
                try:
                    res = page.evaluate("1 + 1")
                    if res != 2:
                        errors.append("Page became unresponsive during scrolling.")
                except Exception as eval_err:
                    errors.append(f"Page evaluate failed (possible crash): {eval_err}")
                    break
                    
                has_content = page.evaluate("document.body.children.length > 0")
                if not has_content:
                    errors.append("Page body became empty during scrolling.")
                    break
                
                time.sleep(0.05) # ~20 scrolls per second
                
            print("Scroll simulation complete.")
            
            # Final check
            if len(errors) > 0:
                print(f"Verification failed with errors: {errors}")
                success = False
            else:
                print("Verification succeeded with no page errors or unresponsive behavior.")
                success = True
                
            browser.close()
    except Exception as e:
        print(f"An exception occurred during testing: {e}")
        success = False
    finally:
        if started_server and server_process:
            print("Stopping the started dev server...")
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server_process.kill()
            print("Dev server stopped.")
            
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
