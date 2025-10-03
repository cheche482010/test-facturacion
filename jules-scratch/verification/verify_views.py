from playwright.sync_api import sync_playwright, Page, expect

def verify_all_views(page: Page):
    """
    Navigates to each refactored view and takes a screenshot.
    """
    base_url = "http://localhost:5173"

    # 1. Dashboard
    page.goto(f"{base_url}/")
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()
    page.wait_for_timeout(2000) # Wait for animations and data to load
    page.screenshot(path="jules-scratch/verification/01_dashboard.png")

    # 2. Products
    page.get_by_role("link", name="Productos").click()
    expect(page.get_by_role("heading", name="Gestión de Productos")).to_be_visible()
    page.wait_for_timeout(2000)
    page.screenshot(path="jules-scratch/verification/02_products.png")

    # 3. Sales (Point of Sale)
    page.get_by_role("link", name="Ventas").click()
    # In the new design, clicking "Ventas" might lead to a list. Let's assume we need to click "Nueva Venta" from the dashboard.
    page.goto(f"{base_url}/")
    page.get_by_role("button", name="Nueva Venta").click()
    expect(page.get_by_role("heading", name="Punto de Venta")).to_be_visible()
    page.wait_for_timeout(1000)
    page.screenshot(path="jules-scratch/verification/03_sales_pos.png")

    # 4. Customers
    page.get_by_role("link", name="Clientes").click()
    expect(page.get_by_role("heading", name="Gestión de Clientes")).to_be_visible()
    page.wait_for_timeout(2000)
    page.screenshot(path="jules-scratch/verification/04_customers.png")

    # 5. Inventory
    page.get_by_role("link", name="Inventario").click()
    expect(page.get_by_role("heading", name="Control de Inventario")).to_be_visible()
    page.wait_for_timeout(2000)
    page.screenshot(path="jules-scratch/verification/05_inventory.png")

    # 6. Reports
    page.get_by_role("link", name="Reportes").click()
    expect(page.get_by_role("heading", name="Reportes y Análisis")).to_be_visible()
    page.wait_for_timeout(2000)
    page.screenshot(path="jules-scratch/verification/06_reports.png")

    # 7. Settings
    page.get_by_role("link", name="Configuración").click()
    expect(page.get_by_role("heading", name="Configuración del Sistema")).to_be_visible()
    page.wait_for_timeout(1000)
    page.screenshot(path="jules-scratch/verification/07_settings.png")


def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_all_views(page)
        browser.close()

if __name__ == "__main__":
    run_verification()