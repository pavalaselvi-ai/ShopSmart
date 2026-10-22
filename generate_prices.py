import csv
import json
import urllib.request
import random


# --------------------------------------------------
# ShopSmart - Generate Prices
# --------------------------------------------------

API_URL = "http://127.0.0.1:8000/products"

OUTPUT_FILE = "data/prices.csv"


# --------------------------------------------------
# Existing Manual Prices
# --------------------------------------------------

manual_prices = {
    "15970": 799,
    "39386": 1299,
    "59263": 2499,
    "21379": 999,
    "53759": 699,
}


# --------------------------------------------------
# Price Ranges
# --------------------------------------------------

price_ranges = {

    # Apparel
    "Apparel": (399, 2499),

    # Footwear
    "Footwear": (699, 3999),

    # Accessories
    "Accessories": (299, 2999),

    # Personal Care
    "Personal Care": (199, 1999),

    # Free Items / Other
    "Free Items": (99, 999),

    # Sporting Goods
    "Sporting Goods": (499, 3999),

    # Default
    "default": (299, 2499),
}


# --------------------------------------------------
# More Specific Article Type Prices
# --------------------------------------------------

article_ranges = {

    "Shirts": (499, 1999),
    "Tshirts": (399, 1499),
    "Tops": (399, 1499),
    "Kurtas": (599, 2499),
    "Kurtis": (499, 1999),

    "Jeans": (799, 2499),
    "Trousers": (699, 2299),
    "Track Pants": (599, 1799),
    "Shorts": (399, 1299),
    "Skirts": (499, 1799),

    "Dresses": (699, 2999),
    "Sarees": (799, 3999),
    "Leggings": (299, 999),

    "Casual Shoes": (899, 2999),
    "Sports Shoes": (999, 3999),
    "Formal Shoes": (999, 3499),
    "Flats": (499, 1999),
    "Heels": (699, 2499),
    "Sandals": (399, 1499),

    "Watches": (799, 4999),
    "Sunglasses": (399, 1999),
    "Belts": (299, 1299),
    "Wallets": (399, 1499),
    "Handbags": (599, 2999),
    "Backpacks": (599, 2499),
    "Jewellery": (399, 4999),

    "Briefs": (299, 999),
    "Bra": (399, 1499),
    "Lingerie": (399, 1999),

    "Caps": (199, 799),
    "Scarves": (199, 999),
    "Gloves": (199, 999),

    "Sports Accessories": (299, 1999),
}


# --------------------------------------------------
# Generate Reasonable Price
# --------------------------------------------------

def generate_price(product):

    article_type = str(
        product.get("articleType", "")
    )

    category = str(
        product.get("masterCategory", "")
    )

    # Use article type first
    if article_type in article_ranges:

        minimum, maximum = article_ranges[
            article_type
        ]

    # Otherwise use category
    elif category in price_ranges:

        minimum, maximum = price_ranges[
            category
        ]

    else:

        minimum, maximum = price_ranges[
            "default"
        ]

    # Generate price ending in 9
    price = random.randint(
        minimum // 100,
        maximum // 100
    ) * 100 - 1

    # Keep price positive
    if price < minimum:
        price = minimum

    return price


# --------------------------------------------------
# Load Products From Backend
# --------------------------------------------------

print("Connecting to ShopSmart backend...")

try:

    with urllib.request.urlopen(
        API_URL
    ) as response:

        products = json.loads(
            response.read().decode("utf-8")
        )

except Exception as error:

    print("\nERROR: Could not connect to backend.")
    print(error)

    print(
        "\nMake sure this is running first:"
    )

    print(
        "uvicorn main:app --reload"
    )

    input("\nPress Enter to exit...")
    raise SystemExit


print(
    f"Products received: {len(products)}"
)


# --------------------------------------------------
# Create Price File
# --------------------------------------------------

rows = []

for product in products:

    product_id = str(
        product["id"]
    )

    # Keep existing manual prices
    if product_id in manual_prices:

        price = manual_prices[
            product_id
        ]

    else:

        price = generate_price(
            product
        )

    rows.append({
        "id": product_id,
        "price": price
    })


# --------------------------------------------------
# Write CSV
# --------------------------------------------------

with open(
    OUTPUT_FILE,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=[
            "id",
            "price"
        ]
    )

    writer.writeheader()

    writer.writerows(rows)


# --------------------------------------------------
# Finished
# --------------------------------------------------

print("\n----------------------------------")
print("PRICE GENERATION COMPLETE")
print("----------------------------------")

print(
    f"Total products priced: {len(rows)}"
)

print(
    f"Price file created: {OUTPUT_FILE}"
)

print("\nManual prices preserved:")

for product_id, price in manual_prices.items():

    print(
        f"{product_id} -> ₹{price}"
    )

print(
    "\nAll 22,036 products now have prices."
)

input("\nPress Enter to exit...")