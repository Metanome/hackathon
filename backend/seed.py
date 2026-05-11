"""
Seed script for Esnaf Tezgahı.
Run once: python seed.py
Idempotent - skips seeding if products already exist.
"""

import sqlite3
from database import init_db, get_connection


PRODUCTS = [
    ("Sızma Zeytinyağı 500ml", "ZYT-001", "Yağlar", 8, 15, "Güven Gıda Ltd.", "siparis@guvengida.com", 89.90),
    ("Sızma Zeytinyağı 1L", "ZYT-002", "Yağlar", 3, 10, "Güven Gıda Ltd.", "siparis@guvengida.com", 159.90),
    ("Organik Nohut 1kg", "NHT-001", "Kuru Bakliyat", 22, 20, "Anadolu Tarım A.Ş.", "info@anadolutarim.com", 34.50),
    ("Kırmızı Mercimek 1kg", "MRC-001", "Kuru Bakliyat", 18, 20, "Anadolu Tarım A.Ş.", "info@anadolutarim.com", 28.00),
    ("Yeşil Mercimek 1kg", "MRC-002", "Kuru Bakliyat", 5, 15, "Anadolu Tarım A.Ş.", "info@anadolutarim.com", 32.00),
    ("Üzüm Pekmezi 700g", "PKM-001", "Reçel & Pekmez", 12, 10, "Doğal Lezzetler", "satis@dogallezzetler.com", 65.00),
    ("Dut Pekmezi 700g", "PKM-002", "Reçel & Pekmez", 4, 10, "Doğal Lezzetler", "satis@dogallezzetler.com", 72.00),
    ("Susam Tahin 400g", "THN-001", "Tahıl & Tahini", 9, 12, "Güven Gıda Ltd.", "siparis@guvengida.com", 55.00),
    ("Çiçek Balı 450g", "BAL-001", "Bal & Şurup", 6, 10, "Karadeniz Bal Evi", "bal@karadenizbalevi.com", 145.00),
    ("Kestane Balı 450g", "BAL-002", "Bal & Şurup", 2, 8, "Karadeniz Bal Evi", "bal@karadenizbalevi.com", 185.00),
    ("Domates Salçası 700g", "SLC-001", "Konserve & Turşu", 25, 20, "Anadolu Tarım A.Ş.", "info@anadolutarim.com", 42.00),
    ("Biber Salçası 700g", "SLC-002", "Konserve & Turşu", 19, 20, "Anadolu Tarım A.Ş.", "info@anadolutarim.com", 45.00),
    ("Organik Buğday Unu 1kg", "UN-001", "Tahıl & Tahini", 14, 15, "Değirmen AŞ", "info@degirmen.com", 22.00),
    ("Tam Buğday Unu 1kg", "UN-002", "Tahıl & Tahini", 11, 15, "Değirmen AŞ", "info@degirmen.com", 24.50),
    ("Akçaabat Tereyağı 200g", "TRY-001", "Süt Ürünleri", 7, 10, "Karadeniz Süt", "satis@karadenizsut.com", 95.00),
    ("Köy Yumurtası (30'lu)", "YMR-001", "Taze Ürünler", 15, 10, "Çiftlik Doğal", "info@ciftlikdogal.com", 180.00),
    ("Organik Elma Sirkesi 500ml", "SRK-001", "Sirke & Turşu", 8, 8, "Doğal Lezzetler", "satis@dogallezzetler.com", 48.00),
    ("Karabuğday 500g", "KBD-001", "Tahıl & Tahini", 6, 8, "Değirmen AŞ", "info@degirmen.com", 38.00),
    ("Chia Tohumu 250g", "CHI-001", "Tohum & Kuruyemiş", 10, 8, "Doğal Lezzetler", "satis@dogallezzetler.com", 85.00),
    ("Antep Fıstığı 250g", "FST-001", "Tohum & Kuruyemiş", 0, 5, "Güneydoğu Tarım", "info@guneydogutarim.com", 220.00),
]

ORDERS = [
    ("Mehmet Yılmaz", "fulfilled", "manual"),
    ("Ayşe Kara", "fulfilled", "image_order"),
    ("Kooperatif Market", "fulfilled", "manual"),
    ("Fatma Şahin", "pending", "voice"),
    ("Hasan Demir", "pending", "image_order"),
]

ORDER_ITEMS = [
    (1, [(1, 2), (3, 5)]),
    (2, [(9, 1), (10, 1)]),
    (3, [(11, 10), (12, 10), (3, 20)]),
    (4, [(1, 3)]),
    (5, [(7, 2), (10, 1)]),
]

ALERTS = [
    ("low_stock", 2, "Sızma Zeytinyağı 1L stock is low (3 units, threshold: 10).", None, 0),
    ("low_stock", 5, "Yeşil Mercimek 1kg stock is low (5 units, threshold: 15).", None, 0),
    (
        "critical_stock",
        10,
        "Kestane Balı 450g is critically low (2 units, threshold: 8).",
        "Dear Karadeniz Bal Evi team,\n\nI hope this message finds you well. We are running critically low on Kestane Balı 450g (currently only 2 units in stock, well below our minimum threshold of 8 units).\n\nCould you please arrange an urgent restocking order at your earliest convenience? Please confirm availability and estimated delivery date.\n\nBest regards,\nAnadolu Doğal Kooperatifi",
        0,
    ),
    ("critical_stock", 20, "Antep Fıstığı 250g is out of stock (0 units).", None, 0),
    ("low_stock", 8, "Karabuğday 500g stock is low (6 units, threshold: 8).", None, 1),
    ("low_stock", 7, "Dut Pekmezi 700g stock is low (4 units).", None, 1),
]


def seed() -> None:
    init_db()
    conn = get_connection()
    try:
        existing = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if existing > 0:
            print(f"Seed skipped -- {existing} products already exist.")
            return

        print("Seeding products...")
        for p in PRODUCTS:
            conn.execute(
                """INSERT INTO products
                   (name, sku, category, stock_quantity, reorder_threshold,
                    supplier_name, supplier_email, unit_price)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                p,
            )

        print("Seeding orders...")
        for customer, status, source in ORDERS:
            conn.execute(
                "INSERT INTO orders (customer_name, status, source) VALUES (?, ?, ?)",
                (customer, status, source),
            )

        print("Seeding order items...")
        for order_id, items in ORDER_ITEMS:
            product_rows = conn.execute("SELECT id, unit_price FROM products").fetchall()
            price_map = {r["id"]: r["unit_price"] for r in product_rows}
            for product_id, quantity in items:
                conn.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    (order_id, product_id, quantity, price_map.get(product_id, 0.0)),
                )

        print("Seeding alerts...")
        for alert_type, product_id, message, draft_email, resolved in ALERTS:
            conn.execute(
                "INSERT INTO alerts (type, product_id, message, draft_email, resolved) VALUES (?, ?, ?, ?, ?)",
                (alert_type, product_id, message, draft_email, resolved),
            )

        conn.commit()
        print("Seed complete. Anadolu Dogal Kooperatifi is ready.")
    finally:
        conn.close()


if __name__ == "__main__":
    seed()
