from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Wait for the backend server to be ready by polling the health endpoint
    backend_ready = False
    for _ in range(15):  # Poll for up to 15 seconds
        try:
            response = page.goto("http://localhost:3001/api/health")
            if response and response.ok():
                print("Backend server is ready.")
                backend_ready = True
                break
        except Exception:
            time.sleep(1)

    if not backend_ready:
        raise RuntimeError("Backend server did not start in time.")

    # Login as cajero
    page.goto("http://localhost:5173/login")
    expect(page.get_by_role("heading", name="Sistema de Facturación")).to_be_visible()
    page.get_by_label("Usuario").fill("cajero")
    page.get_by_label("Contraseña").fill("cajero123")
    page.get_by_role("button", name="Iniciar Sesión").click()
    expect(page.get_by_role("button", name="Cerrar Sesión")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/cajero_dashboard.png")
    page.get_by_role("button", name="Cerrar Sesión").click()

    # Login as administrador
    page.goto("http://localhost:5173/login")
    expect(page.get_by_role("heading", name="Sistema de Facturación")).to_be_visible()
    page.get_by_label("Usuario").fill("admin")
    page.get_by_label("Contraseña").fill("admin123")
    page.get_by_role("button", name="Iniciar Sesión").click()
    expect(page.get_by_role("button", name="Cerrar Sesión")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/admin_dashboard.png")
    page.get_by_role("button", name="Cerrar Sesión").click()

    # Login as dev
    page.goto("http://localhost:5173/login")
    expect(page.get_by_role("heading", name="Sistema de Facturación")).to_be_visible()
    page.get_by_label("Usuario").fill("dev")
    page.get_by_label("Contraseña").fill("dev")
    page.get_by_role("button", name="Iniciar Sesión").click()
    expect(page.get_by_role("button", name="Cerrar Sesión")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/dev_dashboard.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)