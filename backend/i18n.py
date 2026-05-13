"""Minimal backend i18n for agent action strings."""

_STRINGS: dict[str, dict[str, str]] = {
    "auto_created_product": {
        "en": "[info] Auto-created missing product: '{name}'",
        "tr": "[info] Eksik ürün otomatik oluşturuldu: '{name}'",
    },
    "alert_synced": {
        "en": "[alert] Alert synced for {name}",
        "tr": "[alert] {name} için uyarı senkronize edildi",
    },
    "order_created_customer": {
        "en": "[ok] Order created for customer: {customer}",
        "tr": "[ok] Sipariş oluşturuldu, müşteri: {customer}",
    },
    "transcribed": {
        "en": '[mic] Transcribed: "{text}"',
        "tr": '[mic] Transkript: "{text}"',
    },
    "order_created_voice": {
        "en": "[ok] Order created: {qty}× {name} for {customer}",
        "tr": "[ok] Sipariş oluşturuldu: {customer} için {qty}× {name}",
    },
    "stock_updated": {
        "en": "[ok] Stock updated: +{qty} {name}",
        "tr": "[ok] Stok güncellendi: +{qty} {name}",
    },
    "product_not_found": {
        "en": "[warn] Product '{name}' not found",
        "tr": "[warn] Ürün bulunamadı: '{name}'",
    },
    "stock_query_result": {
        "en": "[info] {name}: {qty} units in stock ({status})",
        "tr": "[info] {name}: stokta {qty} birim ({status})",
    },
    "customer_unknown": {
        "en": "Unknown",
        "tr": "Bilinmeyen",
    },
    "category_needs_setup": {
        "en": "Needs Setup",
        "tr": "Kurulum Gerekiyor",
    },
    "setup_required_message_order": {
        "en": "New product '{name}' was auto-added from an order. Please configure pricing and SKU.",
        "tr": "'{name}' ürünü siparişten otomatik eklendi. Lütfen fiyatlandırma ve SKU bilgilerini yapılandırın.",
    },
    "setup_required_message_voice": {
        "en": "New product '{name}' was auto-added from a voice note. Please configure pricing and SKU.",
        "tr": "'{name}' ürünü sesli nottan otomatik eklendi. Lütfen fiyatlandırma ve SKU bilgilerini yapılandırın.",
    },
    "shelf_alert_synced": {
        "en": "[alert] Alert synced for '{name}' via shelf scan",
        "tr": "[alert] '{name}' için raf taraması uyarısı senkronize edildi",
    },
    "shelf_unknown_alert_message": {
        "en": "Shelf scan detected unknown product '{name}' as {status}.",
        "tr": "Raf taraması '{name}' adlı bilinmeyen ürünü {status} olarak tespit etti.",
    },
    "shelf_unknown_action": {
        "en": "[alert] Alert: '{name}' appears {status} on shelf",
        "tr": "[alert] Uyarı: '{name}' rafta {status} görünüyor",
    },
    "shelf_existing_alert": {
        "en": "[info] Existing alert for unknown product '{name}' already active",
        "tr": "[info] '{name}' bilinmeyen ürünü için mevcut uyarı zaten aktif",
    },
    "alert_stock_message": {
        "en": "{name} is {status} stock ({qty} units).",
        "tr": "{name} stoğu {status} durumda ({qty} birim).",
    },
    "status_ok": {
        "en": "ok",
        "tr": "normal",
    },
    "status_low": {
        "en": "low",
        "tr": "düşük",
    },
    "status_critical": {
        "en": "critical",
        "tr": "kritik",
    },
    "image_log_summary": {
        "en": "{type} detected (confidence: {confidence})",
        "tr": "{type} tespit edildi (güven: {confidence})",
    },
    "voice_log_summary": {
        "en": "Voice note: '{text}'",
        "tr": "Sesli not: '{text}'",
    },
    "api_key_missing": {
        "en": "Gemini API key is not configured. Please set it in Settings.",
        "tr": "Gemini API anahtarı yapılandırılmamış. Lütfen Ayarlar'dan ekleyin.",
    },
}


def t(key: str, lang: str = "en", **kwargs: object) -> str:
    """Return a translated action string, falling back to English."""
    lang = lang if lang in ("en", "tr") else "en"
    template = _STRINGS[key].get(lang) or _STRINGS[key]["en"]
    return template.format(**kwargs) if kwargs else template
