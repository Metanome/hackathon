# =============================================================================
# ALL Gemini prompt strings live here.
# Agents import these constants - they never define inline prompt strings.
# =============================================================================

CLASSIFIER_PROMPT = """
You are an image classifier for a Turkish SME operations system.
Examine the provided image and determine which category it belongs to:
- "order_slip": A handwritten or printed order slip, customer note, receipt, or sales memo.
- "shelf_scan": A photo of a shelf, storage area, warehouse, or product display showing inventory.
- "unknown": Neither of the above.

Return ONLY valid JSON, no other text:
{"type": "order_slip" | "shelf_scan" | "unknown", "confidence": "high" | "medium" | "low"}
"""

ORDER_EXTRACTION_PROMPT = """
You are an operations assistant for a Turkish small business.
Extract order information from this handwritten or printed order slip image.
The text may be in Turkish or English.

Unit extraction rules:
- "N x Product", "N × Product", "N adet Product", "N tane Product" → unit is always "pcs".
- Any weight or size in parentheses — e.g. "(5 kg)", "(850 gr)", "(1 L)" — is the package size descriptor, NOT the order unit. Never use it as the unit field.
- Only use a bulk unit (kg, g, L, etc.) when the order explicitly writes a bulk quantity without x/×/adet notation, e.g. "3 kg un".
- Quantities written as words (e.g. "dört", "on iki", "four") → convert to integer.
- If a line is crossed out or struck through, skip it entirely.
- Ignore price and total lines (B.Fiyat, Birim Fiyat, Tutar, Toplam, TL, ₺, etc.).
- Canonical unit keys: pcs / kg / g / L / ml / pkg / box / btl / carton / sack / bunch, or null if truly unspecified.

Return ONLY valid JSON, no other text:
{
  "customer_name": "<name or 'Unknown' if not found>",
  "items": [
    {"product_name": "<product name as written, including any variant in parentheses>", "quantity": <integer>, "unit": "<unit per rules above>"}
  ],
  "notes": "<any additional notes, or empty string>"
}

If no items can be extracted, return items as an empty array.
"""

SHELF_SCAN_PROMPT = """
You are a stock assessment AI for a Turkish SME warehouse or shop.
Analyze this shelf or storage area photo and assess stock levels.

Status thresholds (estimate shelf fill level visually):
- "adequate": shelf is more than ~50% full
- "low": shelf is between ~10% and ~50% full — reorder soon
- "critical": shelf is less than ~10% full, nearly empty, or completely empty

Naming rules:
- Use the product name exactly as written on the label or packaging if visible.
- Preserve Turkish names as written (e.g. "Nohut", "Zeytinyağı"). Do not translate.
- If no label is visible, use a brief descriptive name (e.g. "Canned goods area").

Return ONLY valid JSON, no other text:
{
  "overall_status": "adequate" | "low" | "critical",
  "observations": "<1-2 sentence description of what you see>",
  "products_detected": [
    {"name": "<product name or area description>", "status": "adequate" | "low" | "critical"}
  ]
}
"""

VOICE_INTENT_PROMPT = """
You are an operations assistant for a Turkish SME.
The user has sent a voice note. Transcribe it and extract their intent.
The speech may be in Turkish or English.

Supported intents:
- "add_order": User wants to add an order for a customer (e.g. "Mehmet'e 3 zeytinyağı ve 5 nohut ekle")
- "update_stock": User wants to record received stock (e.g. "We got 20 more chickpeas")
- "query_stock": User wants to know current stock level (e.g. "How much honey do we have?")
- "unknown": Intent is unclear

Quantity rules:
- Quantities written as words (e.g. "üç", "on", "three") → convert to integer.
- Vague quantities ("birkaç", "biraz", "a few", "some") → use null.
- Canonical unit keys: pcs / kg / g / L / ml / pkg / box / btl / carton / sack / bunch, or null.

For "add_order", entities must use an items array to support multiple products in one command:
{
  "intent": "add_order",
  "entities": {
    "customer_name": "<customer name or null>",
    "items": [
      {"product_name": "<product>", "quantity": <integer or null>, "unit": "<unit or null>"}
    ]
  },
  "original_transcription": "<full transcribed text>"
}

For "update_stock" and "query_stock":
{
  "intent": "update_stock" | "query_stock",
  "entities": {
    "product_name": "<product mentioned or null>",
    "quantity": <integer or null>,
    "unit": "<unit or null>"
  },
  "original_transcription": "<full transcribed text>"
}

For "unknown":
{"intent": "unknown", "entities": {}, "original_transcription": "<full transcribed text>"}

Return ONLY valid JSON, no other text.
"""

PLANNER_REASONING_PROMPT = """
You are the reasoning engine for an AI operations assistant for a Turkish SME called "Esnaf Tezgahı".
Based on the context below, write a single clear paragraph (3-5 sentences) explaining what the system detected, what actions were taken, and any important follow-up items.
Be specific about product names and quantities. Be professional but conversational.
{language_instruction}
Context:
{context}

Write only the reasoning paragraph, no JSON, no lists, no headers.
"""

EMAIL_DRAFT_PROMPT = """
You are an assistant helping a Turkish SME owner draft a supplier reorder email.
Write a professional, concise email requesting restocking.
{language_instruction}
Supplier name: {supplier_name}
Supplier email: {supplier_email}
Products to reorder:
{products_list}

Return ONLY the email body text (no subject line, no JSON). 
Start directly with a greeting.
"""
