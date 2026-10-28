#!/usr/bin/env python3
"""
scripts/import_maharashtra_centers.py
============================================================================
Imports authorized e-waste recyclers, refurbishers, and dismantlers from
the Maharashtra Pollution Control Board (MPCB) authorization registry PDF
into the PostgreSQL / PostGIS database.

Idempotent: matches existing records and preserves IDs and relationships.
Does NOT modify or remove the four initial Bengaluru seed records.
============================================================================
"""

import json
import logging
import os
import re
import sys
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pdfplumber
import psycopg
from psycopg.rows import dict_row

# Add project root and backend to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.config import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("import_maharashtra_centers")

PDF_PATH = PROJECT_ROOT / "Authorised_E-Waste_Recyclers_&_Refurbishers-March-2024.pdf"

# Category IDs from 008_seed.sql / device_categories
CATEGORY_IDS = {
    "SMARTPHONE": uuid.UUID("11111111-1111-1111-1111-111111110001"),
    "LAPTOP": uuid.UUID("11111111-1111-1111-1111-111111110002"),
    "TABLET": uuid.UUID("11111111-1111-1111-1111-111111110003"),
    "BATTERY": uuid.UUID("11111111-1111-1111-1111-111111110004"),
    "PCB": uuid.UUID("11111111-1111-1111-1111-111111110005"),
    "SMALL_APPLIANCE": uuid.UUID("11111111-1111-1111-1111-111111110006"),
}

ADMIN_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

# High-precision coordinate patterns for Maharashtra districts, industrial zones & localities
ZONE_COORDS_REFINED = [
    # --- NASHIK DISTRICT LOCALITIES & INDUSTRIAL ZONES ---
    (r"(vilholi|villoli)", 19.9270, 73.7296, "Vilholi, Nashik"),
    (r"ambad", 19.9482, 73.7297, "MIDC Ambad, Nashik"),
    (r"(musalgaon|sinnar)", 19.8660, 73.9877, "Sinnar / Musalgaon, Nashik"),
    (r"(dhakambe|dindori)", 20.1481, 73.8340, "Dhakambe, Dindori, Nashik"),
    
    # --- AHMEDNAGAR DISTRICT ---
    (r"kaudgaon", 19.0660, 74.7210, "Kaudgaon, Ahmednagar"),
    (r"supa.*parner|parner", 18.9660, 74.4500, "Supa, Parner, Ahmednagar"),
    (r"sangamner|jawale.*kadlag|rajapur", 19.5772, 74.2144, "Sangamner, Ahmednagar"),
    (r"akole|khanapur.*akole", 19.5444, 73.9989, "Akole, Ahmednagar"),
    (r"ahmednagar", 19.0952, 74.7496, "Ahmednagar"),

    # --- DHULE & JALGAON DISTRICTS ---
    (r"dondaicha|sindkheda", 21.3283, 74.5683, "Dondaicha, Dhule"),
    (r"dhule", 20.9042, 74.7749, "Dhule"),
    (r"jalgaon", 21.0077, 75.5626, "Jalgaon"),

    # --- BHIWANDI / THANE (Takes precedence over 'Nashik Highway' references) ---
    (r"bhiwandi|borpada|dapoda|anjurphata|pogaon|val village|temghar", 19.2967, 73.0631, "Bhiwandi, Thane"),
    (r"dahisar.*mori|bhandarli|uttarshiv|shilphata|goteghar|waliwali|pimpari|pimpri.*thane", 19.1550, 73.0450, "Shilphata / Dahisar Mori, Thane"),
    (r"mahape|shil-mahape|ttc industrial", 19.1128, 73.0180, "Mahape, Navi Mumbai"),
    (r"pawane|turbhe|nerul|shirawane", 19.0688, 73.0210, "MIDC Turbhe / Pawane, Navi Mumbai"),
    (r"wagle industrial|thane", 19.1933, 72.9511, "Wagle Estate, Thane"),

    # --- PALGHAR DISTRICT ---
    (r"tarapur|boiser", 19.8033, 72.7486, "MIDC Tarapur, Boiser, Palghar"),
    (r"wada|kondla|usar|kelthan|khupri|pali|magathane|sapronde", 19.6542, 73.1389, "Wada, Palghar"),
    (r"talasari|aamgaon", 20.1250, 72.9230, "Talasari, Palghar"),
    (r"sativali|pelhar|waliv|gokhiware|bhoipada|poman|dhaniv|wakanpada", 19.3919, 72.8397, "Vasai East Industrial Area, Palghar"),
    (r"nalasopara", 19.4182, 72.8122, "Nalasopara, Palghar"),
    (r"vasai", 19.3820, 72.8300, "Vasai, Palghar"),
    (r"veour|palghar", 19.6967, 72.7699, "Palghar Town"),

    # --- MUMBAI SUBURBAN ---
    (r"sakinaka|kherani road|andheri", 19.1030, 72.8885, "Sakinaka / Andheri, Mumbai"),
    (r"kurla|jarimari", 19.0728, 72.8826, "Kurla, Mumbai"),
    (r"chembur", 19.0522, 72.8994, "Chembur, Mumbai"),
    (r"ghatkopar", 19.0860, 72.9090, "Ghatkopar, Mumbai"),
    (r"bandra|khar", 19.0688, 72.8358, "Bandra / Khar, Mumbai"),
    (r"jogeshwari", 19.1383, 72.8561, "Jogeshwari, Mumbai"),
    (r"mumbai central", 18.9696, 72.8193, "Mumbai Central"),
    (r"mumbai", 19.0760, 72.8777, "Mumbai"),

    # --- RAIGAD DISTRICT ---
    (r"taloja|tondre|pendhar", 19.0667, 73.1333, "MIDC Taloja, Raigad"),
    (r"panvel|adivali|kiravali|khanda colony|kundevahil", 18.9894, 73.1175, "Panvel, Raigad"),
    (r"khopoli|mulgaon", 18.7833, 73.3500, "Khopoli, Raigad"),
    (r"khalapur|dhekhu", 18.8333, 73.2833, "Khalapur, Raigad"),
    (r"mahad", 18.0833, 73.4167, "MIDC Mahad, Raigad"),
    (r"hedavli|raigad", 18.7333, 73.0833, "Raigad"),

    # --- PUNE DISTRICT ---
    (r"ranjangaon", 18.7758, 74.2464, "MIDC Ranjangaon, Pune"),
    (r"chakan|khalumbre|nanekarwadi|ambethan|mhalunge|kadachi wadi", 18.7597, 73.8584, "Chakan Industrial Area, Pune"),
    (r"kudalwadi|chikhali|jadhavwadi", 18.6655, 73.8180, "Kudalwadi / Chikhali, Pune"),
    (r"bhosari|landge kusti", 18.6298, 73.8444, "MIDC Bhosari, Pune"),
    (r"uruli devachi|autade|handewadi|pisoli|undri|saswad", 18.4735, 73.9430, "Uruli Devachi / Handewadi, Pune"),
    (r"wagholi", 18.5793, 73.9809, "Wagholi, Pune"),
    (r"shindewadi|velu|bhor", 18.3370, 73.8440, "Shindewadi / Bhor, Pune"),
    (r"maval|talegaon|urse|kanhe|sate", 18.7297, 73.6767, "Maval / Talegaon, Pune"),
    (r"marunji|hinjawadi|mulshi", 18.5913, 73.7389, "Hinjawadi / Marunji, Pune"),
    (r"baramati|dhakale", 18.1517, 74.5772, "Baramati, Pune"),
    (r"daund|boribadak", 18.4650, 74.5828, "Daund, Pune"),
    (r"karve nagar|shivane|kothrud", 18.4788, 73.8055, "Karve Nagar / Shivane, Pune"),
    (r"katraj|ambegaon|yewlewadi|phursungi", 18.4485, 73.8588, "Katraj / Ambegaon, Pune"),
    (r"sadashiv peth|mangalwar peth", 18.5133, 73.8533, "Central Pune"),
    (r"manchar", 19.0000, 73.9333, "Manchar, Pune"),
    (r"theur", 18.5256, 74.0489, "Theur, Pune"),
    (r"\bpune\b", 18.5204, 73.8567, "Pune"),

    # --- AURANGABAD / CHHATRAPATI SAMBHAJINAGAR ---
    (r"waluj", 19.8358, 75.2347, "MIDC Waluj, Aurangabad"),
    (r"chitegaon|paithan", 19.6833, 75.3833, "Chitegaon, Paithan, Aurangabad"),
    (r"chikhalthana", 19.8736, 75.3958, "MIDC Chikhalthana, Aurangabad"),
    (r"naregaon|daultabad|karodi|sajapur|mahal pimpri|soyapur", 19.8800, 75.3200, "Aurangabad Outskirts"),
    (r"aurangabad|chhatrapati sambhajinagar", 19.8762, 75.3433, "Aurangabad"),

    # --- NAGPUR DISTRICT ---
    (r"butibori", 20.9167, 78.9833, "MIDC Butibori, Nagpur"),
    (r"kamptee|bhowari|asoli|mahalgaon", 21.2227, 79.1983, "Kamptee, Nagpur"),
    (r"\bnagpur\b", 21.1458, 79.0882, "Nagpur"),

    # --- OTHER DISTRICTS ---
    (r"chincholi|mohol|solapur", 17.7667, 75.8333, "Chincholi / Mohol, Solapur"),
    (r"satara|shindi khurd|maan", 18.0500, 74.0000, "Satara"),
    (r"kagal|hatkanangale|kolhapur|miraj|vita|sangli|shahu market", 16.5772, 74.3167, "Kolhapur / Sangli"),
    (r"mirjole|ratnagiri", 16.9890, 73.3320, "Ratnagiri"),
    (r"khamgaon|buldhana", 20.6860, 76.5680, "Khamgaon, Buldhana"),
    (r"purna|parbhani", 19.1833, 77.0500, "Purna, Parbhani"),
    (r"osmanabad", 18.1856, 76.0422, "Osmanabad"),

    # Pure Nashik City fallback (only if address specifically mentions Nashik without another town)
    (r"\bnashik\b", 19.9975, 73.7898, "Nashik City"),
]


def resolve_coordinates(address: str, regional_office: str) -> Optional[Tuple[float, float, str]]:
    """
    Resolves geographic latitude and longitude coordinates.
    Prioritizes specific address text before regional office fallback.
    Returns (latitude, longitude, resolved_area_name) or None if unresolved.
    """
    addr_lower = address.lower()
    for pattern, lat, lng, name in ZONE_COORDS_REFINED:
        if re.search(pattern, addr_lower):
            return lat, lng, name

    ro_lower = regional_office.lower()
    for pattern, lat, lng, name in ZONE_COORDS_REFINED:
        if re.search(pattern, ro_lower):
            return lat, lng, name

    return None


def parse_pdf_registry(pdf_path: Path) -> List[Dict[str, Any]]:
    """Extracts all table entries from the MPCB PDF document."""
    entries = []
    current_entry = None

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row or not any(row):
                        continue
                    if "Sr. No." in str(row[0]) or "Name and Address" in str(row[1] or ""):
                        continue

                    sr_str = (row[0] or "").strip()
                    if sr_str.isdigit():
                        if current_entry:
                            entries.append(current_entry)
                        current_entry = {
                            "sr_no": int(sr_str),
                            "raw_name_address": (row[1] or "").strip(),
                            "regional_office": (row[2] or "").strip(),
                            "facility_types": [(row[3] or "").strip()] if (row[3] or "").strip() else [],
                            "capacities": [(row[4] or "").strip()] if (row[4] or "").strip() else [],
                            "authorizations": [(row[5] or "").strip()] if (row[5] or "").strip() else [],
                            "validities": [(row[6] or "").strip()] if (row[6] or "").strip() else [],
                            "emails": [(row[7] or "").strip()] if (row[7] or "").strip() else [],
                            "phones": [(row[8] or "").strip()] if (row[8] or "").strip() else [],
                        }
                    else:
                        if current_entry:
                            if row[1] and row[1].strip():
                                current_entry["raw_name_address"] += " " + row[1].strip()
                            if row[2] and row[2].strip() and not current_entry["regional_office"]:
                                current_entry["regional_office"] = row[2].strip()
                            if row[3] and row[3].strip():
                                current_entry["facility_types"].append(row[3].strip())
                            if row[4] and row[4].strip():
                                current_entry["capacities"].append(row[4].strip())
                            if row[5] and row[5].strip():
                                current_entry["authorizations"].append(row[5].strip())
                            if row[6] and row[6].strip():
                                current_entry["validities"].append(row[6].strip())
                            if row[7] and row[7].strip():
                                current_entry["emails"].append(row[7].strip())
                            if row[8] and row[8].strip():
                                current_entry["phones"].append(row[8].strip())

    if current_entry:
        entries.append(current_entry)

    return entries


def clean_name_address(raw_text: str) -> Tuple[str, str]:
    """Splits raw name and address cell into clean Name and Address components."""
    raw_text = re.sub(r"\s+", " ", raw_text).strip()
    addr_match = re.search(
        r"[,;]?\s*\b(Plot\s+No|Gat\s+No|Gut\s+No|S\.?\s*No|Sr\.?\s*No|Survey\s+No|Shop\s+No|Shed\s+No|Gala\s+No|H\.?\s*No|Unit\s+No|Property\s+No|Bldg\s+No|OS-\d+|P-\d+|C/\d+|At\s+Post|Near\s+|Behind\s+|Opp\s+|Opp\.)\b",
        raw_text,
        re.IGNORECASE,
    )
    if addr_match and addr_match.start() > 3:
        name = raw_text[:addr_match.start()].strip(" ,.")
        address = raw_text[addr_match.start():].strip(" ,.")
    else:
        parts = raw_text.split(",", 1)
        name = parts[0].strip()
        address = parts[1].strip() if len(parts) > 1 else raw_text

    return name, address


def extract_dates(validity_list: List[str]) -> List[date]:
    """Extracts valid calendar dates from validity strings."""
    parsed = []
    for item in validity_list:
        for token in item.replace("\n", " ").split():
            clean = re.sub(r"[^\d/\-]", "", token)
            for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"]:
                try:
                    d = datetime.strptime(clean, fmt).date()
                    parsed.append(d)
                    break
                except ValueError:
                    pass
    return sorted(parsed)


def determine_verification_status(valid_dates: List[date], as_of_date: date) -> Tuple[str, Optional[date], Optional[str]]:
    """
    Determines verification status based on source authorization validity.
    Returns (status, latest_valid_date, reason)
    """
    if not valid_dates:
        return "pending", None, "No authorization validity date specified in MPCB registry; requires verification"

    latest = valid_dates[-1]
    if latest >= as_of_date:
        return "verified", latest, None
    else:
        return "expired", latest, f"MPCB authorization validity expired on {latest.strftime('%Y-%m-%d')}; requires revalidation"


def get_categories_for_types(facility_types: List[str]) -> List[uuid.UUID]:
    """Maps facility types to accepted device category UUIDs."""
    cats = {CATEGORY_IDS["SMARTPHONE"], CATEGORY_IDS["LAPTOP"], CATEGORY_IDS["TABLET"]}
    has_recycler_or_dismantler = any("recycler" in t.lower() or "dismantler" in t.lower() for t in facility_types)
    if has_recycler_or_dismantler:
        cats.add(CATEGORY_IDS["BATTERY"])
        cats.add(CATEGORY_IDS["PCB"])
        cats.add(CATEGORY_IDS["SMALL_APPLIANCE"])
    return list(cats)


def run_import(dry_run: bool = False):
    settings = get_settings()
    logger.info("Connecting to PostgreSQL at %s:%s/%s...", settings.POSTGRES_HOST, settings.POSTGRES_PORT, settings.POSTGRES_DB)

    if not PDF_PATH.exists():
        logger.error("Authorization PDF not found at %s", PDF_PATH)
        sys.exit(1)

    logger.info("Parsing MPCB Authorization PDF: %s", PDF_PATH.name)
    raw_entries = parse_pdf_registry(PDF_PATH)
    logger.info("Extracted %d facility entries from PDF.", len(raw_entries))

    conninfo = (
        f"host={settings.POSTGRES_HOST} "
        f"port={settings.POSTGRES_PORT} "
        f"dbname={settings.POSTGRES_DB} "
        f"user={settings.POSTGRES_USER} "
        f"password={settings.POSTGRES_PASSWORD}"
    )

    imported_count = 0
    updated_count = 0
    skipped_duplicate_count = 0
    unresolved_coords_count = 0
    verified_count = 0
    expired_count = 0
    pending_count = 0
    nashik_district_count = 0

    current_evaluation_date = date.today()

    with psycopg.connect(conninfo, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Check existing centers to avoid duplicates and allow coordinate refinement
            cur.execute("SELECT center_id, LOWER(name) as norm_name, LOWER(address) as norm_address FROM recycling_centers")
            existing_rows = cur.fetchall()
            existing_facility_keys = {(r["norm_name"], r["norm_address"][:35]): r["center_id"] for r in existing_rows}
            existing_ids = {r["center_id"] for r in existing_rows}

            logger.info("Database currently contains %d existing recycling center(s).", len(existing_rows))

            for entry in raw_entries:
                sr_no = entry["sr_no"]
                name, address = clean_name_address(entry["raw_name_address"])

                # Determine coordinates
                coord_res = resolve_coordinates(address, entry["regional_office"])
                if not coord_res:
                    unresolved_coords_count += 1
                    logger.warning("Sr. %d: Coordinates unresolved for '%s' (%s)", sr_no, name, address[:60])
                    continue

                lat, lng, area_name = coord_res

                # Determine validity & status
                valid_dates = extract_dates(entry["validities"])
                status_val, valid_until, reason = determine_verification_status(valid_dates, current_evaluation_date)

                if status_val == "verified":
                    verified_count += 1
                elif status_val == "expired":
                    expired_count += 1
                else:
                    pending_count += 1

                # Generate deterministic UUID based on serial number and name
                center_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"maharashtra-center-sr-{sr_no}")

                # Prepare contact details
                clean_phone = entry["phones"][0].replace("\n", "").strip() if entry["phones"] else None
                clean_email = entry["emails"][0].replace("\n", "").strip() if entry["emails"] else None
                if clean_phone and len(clean_phone) > 50:
                    clean_phone = clean_phone[:50]
                if clean_email and len(clean_email) > 250:
                    clean_email = clean_email[:250]

                types_str = ", ".join(entry["facility_types"]) if entry["facility_types"] else "Authorized Facility"
                capacities_str = ", ".join(entry["capacities"]) if entry["capacities"] else None
                auth_str = " | ".join(entry["authorizations"]) if entry["authorizations"] else None

                operational_hours = {
                    "monday_to_saturday": "09:00 - 18:00",
                    "facility_type": types_str,
                    "mpcb_regional_office": entry["regional_office"],
                    "capacity_mta": capacities_str,
                    "mpcb_authorization": auth_str,
                    "source": "MPCB Maharashtra E-Waste Registry (March 2024)",
                    "mpcb_sr_no": sr_no,
                    "geocoded_area": area_name,
                }

                if "nashik" in address.lower() or "vilholi" in address.lower() or "sinnar" in address.lower() or "dindori" in address.lower() or "ambad" in address.lower():
                    nashik_district_count += 1

                facility_key = (name.lower(), address[:35].lower())
                already_exists = facility_key in existing_facility_keys or center_uuid in existing_ids

                if not dry_run:
                    if already_exists:
                        # Update coordinates and metadata idempotently
                        matched_id = existing_facility_keys.get(facility_key) or center_uuid
                        cur.execute(
                            """
                            UPDATE recycling_centers
                            SET location = ST_SetSRID(ST_MakePoint(%s, %s), 4326),
                                operational_hours = %s::jsonb,
                                current_verification_status = %s,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE center_id = %s
                            """,
                            (
                                lng,
                                lat,
                                json.dumps(operational_hours),
                                status_val,
                                matched_id,
                            ),
                        )
                        updated_count += 1
                    else:
                        # 1. Insert center with PostGIS Point geometry: ST_MakePoint(longitude, latitude)
                        cur.execute(
                            """
                            INSERT INTO recycling_centers (
                                center_id, name, address, contact_phone, contact_email,
                                location, operational_hours, current_verification_status,
                                created_by, created_at, updated_at
                            ) VALUES (
                                %s, %s, %s, %s, %s,
                                ST_SetSRID(ST_MakePoint(%s, %s), 4326),
                                %s::jsonb, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                            )
                            ON CONFLICT (center_id) DO NOTHING
                            """,
                            (
                                center_uuid,
                                name[:200],
                                address,
                                clean_phone,
                                clean_email,
                                lng,  # ST_MakePoint expects longitude first
                                lat,  # ST_MakePoint expects latitude second
                                json.dumps(operational_hours),
                                status_val,
                                ADMIN_USER_ID,
                            ),
                        )

                        # 2. Insert accepted categories
                        target_cats = get_categories_for_types(entry["facility_types"])
                        for cat_id in target_cats:
                            cur.execute(
                                """
                                INSERT INTO center_accepted_categories (center_id, category_id)
                                VALUES (%s, %s)
                                ON CONFLICT (center_id, category_id) DO NOTHING
                                """,
                                (center_uuid, cat_id),
                            )

                        # 3. Insert verification lifecycle record
                        verif_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"maharashtra-verif-sr-{sr_no}")
                        cur.execute(
                            """
                            INSERT INTO center_verifications (
                                verification_id, center_id, status, reviewer_id,
                                valid_until, rejection_reason, reviewed_at, created_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                            ON CONFLICT (verification_id) DO NOTHING
                            """,
                            (verif_uuid, center_uuid, status_val, ADMIN_USER_ID, valid_until, reason),
                        )

                        # 4. Insert status history audit record
                        hist_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"maharashtra-history-sr-{sr_no}")
                        cur.execute(
                            """
                            INSERT INTO center_status_history (
                                history_id, center_id, old_status, new_status,
                                changed_by, reason, changed_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                            ON CONFLICT (history_id) DO NOTHING
                            """,
                            (
                                hist_uuid,
                                center_uuid,
                                None,
                                status_val,
                                ADMIN_USER_ID,
                                f"Imported from MPCB Official Registry (Sr. No. {sr_no})",
                            ),
                        )
                        imported_count += 1
                        existing_facility_keys[facility_key] = center_uuid
                        existing_ids.add(center_uuid)
                else:
                    if already_exists:
                        skipped_duplicate_count += 1
                    else:
                        imported_count += 1

            if not dry_run:
                conn.commit()
                logger.info("Transaction committed successfully.")

    print("\n" + "=" * 65)
    print("MAHARASHTRA E-WASTE FACILITIES IMPORT SUMMARY")
    print("=" * 65)
    print(f"Total Facilities in PDF:               {len(raw_entries)}")
    if dry_run:
        print(f"Total Facilities to Import:            {imported_count}")
        print(f"Duplicates Skipped:                    {skipped_duplicate_count}")
    else:
        print(f"Total Facilities Newly Inserted:       {imported_count}")
        print(f"Existing Facilities Updated/Preserved: {updated_count}")
        print(f"Duplicates Skipped:                    {len(raw_entries) - imported_count - updated_count}")
    print(f"Facilities with Unresolved Coords:     {unresolved_coords_count}")
    print(f"Authorization Status Breakdown:")
    print(f"  - Confirmed Valid ('verified'):       {verified_count}")
    print(f"  - Expired / Requires Reval:          {expired_count}")
    print(f"  - Pending Verification:              {pending_count}")
    print(f"Nashik District Facilities:            {nashik_district_count}")
    print("=" * 65)


if __name__ == "__main__":
    is_dry = "--dry-run" in sys.argv
    run_import(dry_run=is_dry)
