from prompts import EMAIL_DRAFT_PROMPT
from services.gemini_service import generate_text


def draft_reorder_email(
    supplier_name: str,
    supplier_email: str,
    products: list[dict],  # [{"name": str, "sku": str, "stock_quantity": int}]
) -> str:
    """Generate a supplier reorder email body using Gemini."""
    products_list = "\n".join(
        f"- {p['name']} (SKU: {p['sku']}, current stock: {p['stock_quantity']} units)"
        for p in products
    )
    prompt = EMAIL_DRAFT_PROMPT.format(
        supplier_name=supplier_name,
        supplier_email=supplier_email,
        products_list=products_list,
    )
    return generate_text(prompt)
