import logging
import re
from typing import Optional, Tuple
import httpx

logger = logging.getLogger(__name__)

# Curated reference coordinates for Indian cities, localities and PIN codes
KNOWN_LOCATIONS = {
    # Bengaluru & Neighborhoods
    "bengaluru": (12.9716, 77.5946, "Bengaluru, Karnataka"),
    "bangalore": (12.9716, 77.5946, "Bengaluru, Karnataka"),
    "indiranagar": (12.9784, 77.6413, "Indiranagar, Bengaluru, Karnataka"),
    "koramangala": (12.9352, 77.6245, "Koramangala, Bengaluru, Karnataka"),
    "hebbal": (13.0358, 77.5921, "Hebbal, Bengaluru, Karnataka"),
    "whitefield": (12.9698, 77.7500, "Whitefield, Bengaluru, Karnataka"),
    "electronic city": (12.8452, 77.6602, "Electronic City, Bengaluru, Karnataka"),
    "jayanagar": (12.9308, 77.5838, "Jayanagar, Bengaluru, Karnataka"),
    "mg road": (12.9756, 77.6066, "MG Road, Bengaluru, Karnataka"),
    "marathahalli": (12.9591, 77.6974, "Marathahalli, Bengaluru, Karnataka"),
    "hsr layout": (12.9121, 77.6446, "HSR Layout, Bengaluru, Karnataka"),
    "btm layout": (12.9166, 77.6101, "BTM Layout, Bengaluru, Karnataka"),
    "rajajinagar": (12.9982, 77.5530, "Rajajinagar, Bengaluru, Karnataka"),
    "malleswaram": (13.0031, 77.5643, "Malleswaram, Bengaluru, Karnataka"),
    "yelahanka": (13.1007, 77.5963, "Yelahanka, Bengaluru, Karnataka"),
    "mysuru": (12.2958, 76.6394, "Mysuru, Karnataka"),
    "mysore": (12.2958, 76.6394, "Mysuru, Karnataka"),
    "hubballi": (15.3647, 75.1240, "Hubballi, Karnataka"),
    "hubli": (15.3647, 75.1240, "Hubballi, Karnataka"),
    "mangaluru": (12.9141, 74.8560, "Mangaluru, Karnataka"),
    "mangalore": (12.9141, 74.8560, "Mangaluru, Karnataka"),

    # Maharashtra
    "mumbai": (19.0760, 72.8777, "Mumbai, Maharashtra"),
    "bombay": (19.0760, 72.8777, "Mumbai, Maharashtra"),
    "pune": (18.5204, 73.8567, "Pune, Maharashtra"),
    "nashik": (19.9975, 73.7898, "Nashik, Maharashtra"),
    "nasik": (19.9975, 73.7898, "Nashik, Maharashtra"),
    "nagpur": (21.1458, 79.0882, "Nagpur, Maharashtra"),
    "thane": (19.2183, 72.9781, "Thane, Maharashtra"),
    "navi mumbai": (19.0330, 73.0297, "Navi Mumbai, Maharashtra"),
    "aurangabad": (19.8762, 75.3433, "Chhatrapati Sambhajinagar, Maharashtra"),
    "chhatrapati sambhajinagar": (19.8762, 75.3433, "Chhatrapati Sambhajinagar, Maharashtra"),

    # Delhi NCR
    "delhi": (28.6139, 77.2090, "New Delhi, Delhi"),
    "new delhi": (28.6139, 77.2090, "New Delhi, Delhi"),
    "noida": (28.5355, 77.3910, "Noida, Uttar Pradesh"),
    "greater noida": (28.4744, 77.5040, "Greater Noida, Uttar Pradesh"),
    "gurugram": (28.4595, 77.0266, "Gurugram, Haryana"),
    "gurgaon": (28.4595, 77.0266, "Gurugram, Haryana"),
    "faridabad": (28.4089, 77.3178, "Faridabad, Haryana"),
    "ghaziabad": (28.6692, 77.4538, "Ghaziabad, Uttar Pradesh"),

    # Telangana & Andhra Pradesh
    "hyderabad": (17.3850, 78.4867, "Hyderabad, Telangana"),
    "secunderabad": (17.4399, 78.4983, "Secunderabad, Telangana"),
    "visakhapatnam": (17.6868, 83.2185, "Visakhapatnam, Andhra Pradesh"),
    "vizag": (17.6868, 83.2185, "Visakhapatnam, Andhra Pradesh"),
    "vijayawada": (16.5062, 80.6480, "Vijayawada, Andhra Pradesh"),

    # Tamil Nadu
    "chennai": (13.0827, 80.2707, "Chennai, Tamil Nadu"),
    "madras": (13.0827, 80.2707, "Chennai, Tamil Nadu"),
    "coimbatore": (11.0168, 76.9558, "Coimbatore, Tamil Nadu"),
    "madurai": (9.9252, 78.1198, "Madurai, Tamil Nadu"),

    # West Bengal
    "kolkata": (22.5726, 88.3639, "Kolkata, West Bengal"),
    "calcutta": (22.5726, 88.3639, "Kolkata, West Bengal"),

    # Gujarat
    "ahmedabad": (23.0225, 72.5714, "Ahmedabad, Gujarat"),
    "surat": (21.1702, 72.8311, "Surat, Gujarat"),
    "vadodara": (22.3072, 73.1812, "Vadodara, Gujarat"),

    # Rajasthan
    "jaipur": (26.9124, 75.7873, "Jaipur, Rajasthan"),
    "jodhpur": (26.2389, 73.0243, "Jodhpur, Rajasthan"),
    "udaipur": (24.5854, 73.7125, "Udaipur, Rajasthan"),

    # Other Capitals / Major Cities
    "lucknow": (26.8467, 80.9462, "Lucknow, Uttar Pradesh"),
    "kanpur": (26.4499, 80.3319, "Kanpur, Uttar Pradesh"),
    "patna": (25.5941, 85.1376, "Patna, Bihar"),
    "bhopal": (23.2599, 77.4126, "Bhopal, Madhya Pradesh"),
    "indore": (22.7196, 75.8577, "Indore, Madhya Pradesh"),
    "chandigarh": (30.7333, 76.7794, "Chandigarh"),
    "kochi": (9.9312, 76.2673, "Kochi, Kerala"),
    "cochin": (9.9312, 76.2673, "Kochi, Kerala"),
    "thiruvananthapuram": (8.5241, 76.9366, "Thiruvananthapuram, Kerala"),
    "trivandrum": (8.5241, 76.9366, "Thiruvananthapuram, Kerala"),
    "bhubaneswar": (20.2961, 85.8245, "Bhubaneswar, Odisha"),
    "guwahati": (26.1445, 91.7362, "Guwahati, Assam"),
    "dehradun": (30.3165, 78.0322, "Dehradun, Uttarakhand"),
    "ranchi": (23.3441, 85.3096, "Ranchi, Jharkhand"),
    "raipur": (21.2514, 81.6296, "Raipur, Chhattisgarh"),
    "shimla": (31.1048, 77.1734, "Shimla, Himachal Pradesh"),
    "srinagar": (34.0837, 74.7973, "Srinagar, Jammu & Kashmir"),
    "goa": (15.2993, 74.1240, "Panaji, Goa"),
    "panaji": (15.4909, 73.8278, "Panaji, Goa"),
}

KNOWN_PIN_CODES = {
    # Bengaluru specific
    "560038": (12.9784, 77.6413, "Indiranagar, Bengaluru - 560038"),
    "560034": (12.9352, 77.6245, "Koramangala, Bengaluru - 560034"),
    "560024": (13.0358, 77.5921, "Hebbal, Bengaluru - 560024"),
    "560001": (12.9756, 77.6066, "Bengaluru G.P.O. - 560001"),
    "560066": (12.9698, 77.7500, "Whitefield, Bengaluru - 560066"),
    "560100": (12.8452, 77.6602, "Electronic City, Bengaluru - 560100"),
    "560011": (12.9308, 77.5838, "Jayanagar, Bengaluru - 560011"),
    "560010": (12.9982, 77.5530, "Rajajinagar, Bengaluru - 560010"),
    "560003": (13.0031, 77.5643, "Malleswaram, Bengaluru - 560003"),
    "560064": (13.1007, 77.5963, "Yelahanka, Bengaluru - 560064"),
    "560037": (12.9591, 77.6974, "Marathahalli, Bengaluru - 560037"),
    "560102": (12.9121, 77.6446, "HSR Layout, Bengaluru - 560102"),
    "560076": (12.9166, 77.6101, "BTM Layout, Bengaluru - 560076"),

    # Mumbai specific
    "400001": (18.9322, 72.8347, "Fort, Mumbai - 400001"),
    "400050": (19.0596, 72.8295, "Bandra West, Mumbai - 400050"),
    "400051": (19.0607, 72.8661, "BKC, Mumbai - 400051"),
    "400076": (19.1176, 72.9060, "Powai, Mumbai - 400076"),
    "400099": (19.0886, 72.8679, "Airport Area, Mumbai - 400099"),

    # Pune
    "411001": (18.5204, 73.8567, "Pune Station, Pune - 411001"),
    "411014": (18.5529, 73.9352, "Viman Nagar, Pune - 411014"),
    "411057": (18.5913, 73.7389, "Hinjawadi, Pune - 411057"),

    # Nashik
    "422001": (19.9975, 73.7898, "Nashik City - 422001"),
    "422002": (19.9920, 73.7710, "Nashik Road - 422002"),
    "422009": (19.9680, 73.7540, "Indira Nagar, Nashik - 422009"),

    # Delhi
    "110001": (28.6289, 77.2155, "Connaught Place, New Delhi - 110001"),
    "110016": (28.5494, 77.2001, "Hauz Khas, New Delhi - 110016"),
    "110020": (28.5303, 77.2680, "Okhla, New Delhi - 110020"),
    "110092": (28.6360, 77.3015, "Laxmi Nagar, New Delhi - 110092"),

    # Hyderabad
    "500001": (17.3850, 78.4867, "Hyderabad G.P.O. - 500001"),
    "500081": (17.4435, 78.3772, "Hitech City, Hyderabad - 500081"),
    "500034": (17.4265, 78.4526, "Banjara Hills, Hyderabad - 500034"),

    # Chennai
    "600001": (13.0827, 80.2707, "Chennai G.P.O. - 600001"),
    "600096": (12.9698, 80.2458, "Perungudi, Chennai - 600096"),

    # Kolkata
    "700001": (22.5726, 88.3639, "Kolkata G.P.O. - 700001"),
    "700091": (22.5802, 88.4272, "Salt Lake, Kolkata - 700091"),
}

PIN_PREFIX_DIRECTORY = [
    ("560", (12.9716, 77.5946, "Bengaluru Postal Zone")),
    ("400", (19.0760, 72.8777, "Mumbai Postal Zone")),
    ("411", (18.5204, 73.8567, "Pune Postal Zone")),
    ("422", (19.9975, 73.7898, "Nashik Postal Zone")),
    ("110", (28.6139, 77.2090, "Delhi Postal Zone")),
    ("500", (17.3850, 78.4867, "Hyderabad Postal Zone")),
    ("600", (13.0827, 80.2707, "Chennai Postal Zone")),
    ("700", (22.5726, 88.3639, "Kolkata Postal Zone")),
    ("380", (23.0225, 72.5714, "Ahmedabad Postal Zone")),
    ("302", (26.9124, 75.7873, "Jaipur Postal Zone")),
    ("226", (26.8467, 80.9462, "Lucknow Postal Zone")),
    ("682", (9.9312, 76.2673, "Kochi Postal Zone")),
    ("440", (21.1458, 79.0882, "Nagpur Postal Zone")),
    ("452", (22.7196, 75.8577, "Indore Postal Zone")),
    ("800", (25.5941, 85.1376, "Patna Postal Zone")),
    ("751", (20.2961, 85.8245, "Bhubaneswar Postal Zone")),
    ("530", (17.6868, 83.2185, "Visakhapatnam Postal Zone")),
    ("641", (11.0168, 76.9558, "Coimbatore Postal Zone")),
    ("570", (12.2958, 76.6394, "Mysuru Postal Zone")),
    ("160", (30.7333, 76.7794, "Chandigarh Postal Zone")),
    ("122", (28.4595, 77.0266, "Gurugram Postal Zone")),
    ("201", (28.5355, 77.3910, "Noida / Ghaziabad Postal Zone")),
]


async def resolve_location_query(query: str) -> Optional[Tuple[float, float, str]]:
    """
    Resolves a human query (city name, locality, or 6-digit Indian PIN code)
    to (latitude, longitude, display_name).
    Uses curated dictionary first; falls back to OpenStreetMap Nominatim when available.
    """
    clean = query.strip().lower()

    # 1. Direct match in known cities/localities
    if clean in KNOWN_LOCATIONS:
        lat, lng, name = KNOWN_LOCATIONS[clean]
        return lat, lng, name

    # 2. Direct match in known specific PIN codes
    digits = re.sub(r"\D", "", clean)
    if digits in KNOWN_PIN_CODES:
        lat, lng, name = KNOWN_PIN_CODES[digits]
        return lat, lng, name

    # 3. Check 3-digit PIN code postal zone prefix
    if len(digits) == 6:
        for prefix, (lat, lng, name) in PIN_PREFIX_DIRECTORY:
            if digits.startswith(prefix):
                return lat, lng, f"{name} ({digits})"

    # 4. Partial substring match in known locations
    for k, (lat, lng, name) in KNOWN_LOCATIONS.items():
        if k in clean or clean in k:
            return lat, lng, name

    # 5. External Nominatim lookup (with short timeout)
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": f"{query}, India", "format": "json", "limit": 1},
                headers={"User-Agent": "EcoCycle-EWastePlatform/1.0"},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    lat = float(data[0]["lat"])
                    lng = float(data[0]["lon"])
                    display = data[0].get("display_name", query)
                    return lat, lng, display
    except Exception as e:
        logger.warning("External geocoding lookup failed for '%s': %s", query, str(e))

    return None

