#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
qr-code-generator.py
Génère les QR Codes (vCard + site) à partir des données du projet (data.json).
Le script NE MODIFIE PAS le fichier data.json — il le lit et utilise ses valeurs.
S'il manque un champ requis, le script s'arrête et indique exactement quoi ajouter
au fichier JSON (aucune modification automatique n'est effectuée).
"""

import json
import os
import sys
from datetime import datetime

# qrcode (et options de style)
try:
    import qrcode
    from qrcode.image.styledpil import StyledPilImage
    from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, CircleModuleDrawer
except Exception:
    print("Erreur: le module 'qrcode' (et Pillow) est requis. Installez-le avec :")
    print("    pip install qrcode[pil]")
    sys.exit(2)


# ---------------------------
# Configuration / Constants
# ---------------------------
# Chemins candidats pour trouver data.json (ne modifie pas le JSON)
CANDIDATE_PATHS = [
    os.path.join(os.getcwd(), "assets", "json", "data.json"),
    os.path.join(os.getcwd(), "data.json"),
    os.path.join(os.path.dirname(__file__), "assets", "json", "data.json"),
    os.path.join(os.path.dirname(__file__), "..", "assets", "json", "data.json"),
]

OUTPUT_DIR = os.path.join("assets", "img", "qr_codes")
QR_SIZE = 20      # box_size
QR_BORDER = 4     # border (modules)
COMMON_BOX_SIZE = 12
QR_VERSION = 10  # None => fit automatically; set to int for fixed size
QR_ERROR_CORRECTION = qrcode.constants.ERROR_CORRECT_H

# Styles: 'normal'|'rounded'|'circles'
DEFAULT_STYLE = "normal"

# ---------------------------
# Helpers
# ---------------------------
def find_data_json():
    for p in CANDIDATE_PATHS:
        if p and os.path.isfile(p):
            return p
    return None


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise
    except json.JSONDecodeError as e:
        raise RuntimeError(f"JSON invalide dans {path}: {e}") from e


def ensure_output_dir():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)


def split_name(full_name):
    """Retourne (family, given). Si impossible, family=full_name, given=''. """
    if not full_name or not full_name.strip():
        return "", ""
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    # last token as family name, rest as given name(s)
    family = parts[-1]
    given = " ".join(parts[:-1])
    return family, given


def make_vcard(data_personal, data_contact, data_social, revision_date=None):
    """
    Construit une vCard 4.0 à partir des objets JSON.
    Champs supportés (s'ils sont présents) :
      - personal.fullName, personal.school, personal.role, personal.street, personal.city,
        personal.department, personal.postal_code, personal.country, personal.photo
      - contact.phone, contact.email
      - social.linkedin, social.github, social.website
    """
    full_name = data_personal.get("fullName", "").strip()
    family, given = split_name(full_name)
    organization = data_personal.get("school", "")
    title = data_personal.get("role", "")
    phone = data_contact.get("phone", "")
    email = data_contact.get("email", "")
    linkedin = data_social.get("linkedin", "")
    github = data_social.get("github", "")
    website = data_social.get("website", "")

    street = data_personal.get("street", "")
    city = data_personal.get("city", "")
    region = data_personal.get("department", "")
    postal = data_personal.get("postal_code", "")
    country = data_personal.get("country", "")

    photo = data_personal.get("photo", "")  # chemin/URL tel que fourni dans JSON

    if not revision_date:
        revision_date = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # build ADR field per vCard: ADR;TYPE=home:post-office;extended;street;locality;region;postal-code;country
    # we have limited data, so leave post-office and extended empty
    adr = f"ADR;TYPE=home:;;{escape_vcard_value(street)};{escape_vcard_value(city)};{escape_vcard_value(region)};{escape_vcard_value(postal)};{escape_vcard_value(country)}"

    lines = [
        "BEGIN:VCARD",
        "VERSION:4.0",
        f"FN:{escape_vcard_value(full_name)}",
        f"N:{escape_vcard_value(family)};{escape_vcard_value(given)};;;",
    ]

    if organization:
        lines.append(f"ORG:{escape_vcard_value(organization)}")
    if title:
        lines.append(f"TITLE:{escape_vcard_value(title)}")
    if phone:
        # Use TEL;TYPE=voice,home etc. Keep simple
        lines.append(f"TEL;VALUE=uri:tel:{escape_vcard_value(phone)}")
    if email:
        lines.append(f"EMAIL:{escape_vcard_value(email)}")
    if website:
        lines.append(f"URL;TYPE=website:{escape_vcard_value(website)}")
    if linkedin:
        lines.append(f"URL;TYPE=linkedin:{escape_vcard_value(linkedin)}")
    if github:
        lines.append(f"URL;TYPE=github:{escape_vcard_value(github)}")
    # ADR (always include, even if empty parts)
    lines.append(adr)
    if photo:
        # PHOTO;MEDIATYPE=image/jpeg:/path/to/photo.jpg
        lines.append(f"PHOTO;MEDIATYPE=image/jpeg:{escape_vcard_value(photo)}")
    lines.append(f"NOTE:Carte de visite numérique - {escape_vcard_value(data_personal.get('nameInitial',''))}")
    lines.append(f"REV:{revision_date}")
    lines.append("END:VCARD")
    return "\n".join(lines)


def escape_vcard_value(value):
    """Échappe les caractères réservés pour vCard (virgule, point-virgule, sauts de ligne)."""
    if value is None:
        return ""
    s = str(value)
    s = s.replace("\n", "\\n").replace(";", "\\;").replace(",", "\\,")
    return s


def generate_qr_code(data_text, filename, color_dark='#000000', color_light='#FFFFFF', style='normal', box_size=QR_SIZE, border=QR_BORDER, version=QR_VERSION):
    """
    Génére et sauvegarde un QR code PNG.
    Retourne le chemin du fichier généré ou None en cas d'erreur.
    """
    try:
        qr = qrcode.QRCode(
            version=version,
            error_correction=QR_ERROR_CORRECTION,
            box_size=box_size,
            border=border,
        )
        qr.add_data(data_text)
        qr.make(fit=True)

        module_drawer = None
        if style == "rounded":
            module_drawer = RoundedModuleDrawer()
        elif style == "circles":
            module_drawer = CircleModuleDrawer()

        if module_drawer:
            img = qr.make_image(
                image_factory=StyledPilImage,
                module_drawer=module_drawer,
                fill_color=color_dark,
                back_color=color_light
            )
        else:
            img = qr.make_image(fill_color=color_dark, back_color=color_light)

        ensure_output_dir()
        out_path = os.path.join(OUTPUT_DIR, f"{filename}.png")
        img.save(out_path)
        return out_path
    except Exception as e:
        print(f"Erreur lors de la génération du QR '{filename}': {e}")
        return None


# ---------------------------
# Validation des données requises
# ---------------------------
def validate_required_fields(data):
    """
    Vérifie la présence des champs minimaux indispensables dans data.json.
    Retourne une liste de tuples (chemin, message) pour les champs manquants.
    """
    missing = []

    # personal.fullName
    if not data.get("personal", {}).get("fullName"):
        missing.append(("personal.fullName", "Nom complet manquant (personal.fullName)"))

    # contact.phone
    if not data.get("contact", {}).get("phone"):
        missing.append(("contact.phone", "Téléphone manquant (contact.phone)"))

    # contact.email
    if not data.get("contact", {}).get("email"):
        missing.append(("contact.email", "Email manquant (contact.email)"))

    # social.website
    if not data.get("social", {}).get("website"):
        missing.append(("social.website", "URL du site manquante (social.website)"))

    # optional but recommended: personal.nameInitial (used in NOTE)
    if not data.get("personal", {}).get("nameInitial"):
        # not fatal, just warn in a separate list
        missing.append(("personal.nameInitial (recommended)", "Champ 'personal.nameInitial' recommandé pour le NOTE"))

    return missing


# ---------------------------
# Main program
# ---------------------------
def main():
    # trouver data.json
    data_path = find_data_json()
    if not data_path:
        print("Impossible de trouver data.json. Cherchez-le à l'un des emplacements suivants :")
        for p in CANDIDATE_PATHS:
            print("  -", p)
        sys.exit(3)

    print(f"Chargement des données depuis : {data_path}")
    try:
        data = load_json(data_path)
    except FileNotFoundError:
        print("Fichier introuvable :", data_path)
        sys.exit(4)
    except RuntimeError as err:
        print(err)
        sys.exit(5)

    # validation minimale
    missing = validate_required_fields(data)
    # separate fatal vs recommended
    fatal = [m for m in missing if not m[0].endswith("(recommended)")]
    recommended = [m for m in missing if m[0].endswith("(recommended)")]

    if fatal:
        print("\nERREUR: champs requis manquants dans data.json :")
        for p, msg in fatal:
            print(f"  - {p} : {msg}")
        print("\nAjoutez ces champs EXACTEMENT comme indiqué dans votre data.json, puis relancez le script.")
        print("Exemple minimal à ajouter (JSON) :")
        print(json.dumps({
            "personal": {"fullName": "NOM Prénom"},
            "contact": {"phone": "+33...", "email": "email@exemple.tld"},
            "social": {"website": "https://votre-site.tld"}
        }, indent=2, ensure_ascii=False))
        sys.exit(6)

    if recommended:
        print("\nAVERTISSEMENT: champs recommandés manquants (non bloquants) :")
        for p, msg in recommended:
            print(f"  - {p} : {msg}")
        print("Vous pouvez ajouter ces champs pour enrichir la vCard (ex: personal.nameInitial).")

    # Extraction des blocs
    personal = data.get("personal", {})
    contact = data.get("contact", {})
    social = data.get("social", {})
    qr_codes = data.get("qrCodes", {})

    # revision_date fallback: use site.version timestamp or current UTC
    revision_date = None
    # try to fetch a revision_date if present anywhere
    revision_date = data.get("site", {}).get("revision_date") or data.get("personal", {}).get("revision_date")
    if not revision_date:
        # fallback: use current UTC timestamp in vCard format
        revision_date = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # build vCard
    vcard_text = make_vcard(personal, contact, social, revision_date=revision_date)

    # Generate contact QR
    print("\nGénération du QR Code vCard (contact)...")
    contact_qr_path = generate_qr_code(
        data_text=vcard_text,
        filename="contact_qr",
        color_dark="#000000",
        color_light="#ffffff",
        style="normal",
        box_size=COMMON_BOX_SIZE,
        border=QR_BORDER,
        version=QR_VERSION
    )
    if contact_qr_path:
        print("QR contact généré :", contact_qr_path)
    else:
        print("Échec génération QR contact.")

    # Generate site QR (use social.website)
    site_url = social.get("website", "")
    if site_url:
        print("\nGénération du QR Code du site...")
        site_qr_path = generate_qr_code(
            data_text=site_url,
            filename="site_qr",
            color_dark="#000000",
            color_light="#ffffff",
            style="normal",
            box_size=COMMON_BOX_SIZE,
            border=QR_BORDER,
            version=QR_VERSION
        )
        if site_qr_path:
            print("QR site généré :", site_qr_path)
        else:
            print("Échec génération QR site.")
    else:
        print("Aucun site trouvé dans data.json -> pas de QR site généré.")

    # Inform about existing qrCodes entries in JSON (we do NOT modify them)
    if qr_codes:
        print("\nNote: votre section 'qrCodes' dans data.json contient :", qr_codes)
        print("Le script n'écrit PAS dans data.json. Si vous souhaitez que data.json référence")
        print("les images nouvellement générées, copiez manuellement les chemins suivants dans")
        print("la section 'qrCodes' :")
        print(f"  site  -> {os.path.join(OUTPUT_DIR, 'site_qr.png')}")
        print(f"  contact -> {os.path.join(OUTPUT_DIR, 'contact_qr.png')}")

    print("\nTerminé.")


if __name__ == "__main__":
    main()
