from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import pandas as pd
import numpy as np
import os

from recommendation.recommender import ProductRecommender


# --------------------------------------------------
# FastAPI App
# --------------------------------------------------

app = FastAPI(
    title="ShopSmart API",
    description="E-Commerce Product Recommendation System",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Dataset Paths
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MAIN_DATASET = os.path.join(
    BASE_DIR,
    "../data/YOUR_IMAGE_DATASET.parquet"
)

HIGH_RES_DATASET = os.path.join(
    BASE_DIR,
    "../data/HIGH_RES_PRODUCT_IMAGES.parquet"
)

PRICE_DATASET = os.path.join(
    BASE_DIR,
    "../data/prices.csv"
)


# --------------------------------------------------
# Load Main Dataset
# --------------------------------------------------

try:

    df = pd.read_parquet(
        MAIN_DATASET
    )

    print(
        f"Dataset loaded successfully: "
        f"{len(df)} products"
    )

except Exception as e:

    print(
        "Error loading main dataset:",
        e
    )

    df = pd.DataFrame()


# --------------------------------------------------
# Load Manual Prices
# --------------------------------------------------

try:

    prices_df = pd.read_csv(
        PRICE_DATASET
    )

    # Convert IDs to strings
    df["id"] = df["id"].astype(str)
    prices_df["id"] = prices_df["id"].astype(str)

    # Merge prices
    df = df.merge(
        prices_df,
        on="id",
        how="left"
    )

    print(
        f"Price data loaded: "
        f"{len(prices_df)} prices"
    )

except Exception as e:

    print(
        "Error loading price data:",
        e
    )


# --------------------------------------------------
# Load High Resolution Images
# --------------------------------------------------

try:

    high_res_df = pd.read_parquet(
        HIGH_RES_DATASET
    )

    high_res_images = {
        str(row["id"]): row["image"]["bytes"]
        for _, row in high_res_df.iterrows()
        if isinstance(row["image"], dict)
        and "bytes" in row["image"]
    }

    print(
        f"High-resolution image dataset loaded: "
        f"{len(high_res_images)} images"
    )

except Exception as e:

    print(
        "Error loading high-resolution image dataset:",
        e
    )

    high_res_images = {}


# --------------------------------------------------
# Recommendation Engine
# --------------------------------------------------

try:

    recommender = ProductRecommender(
        MAIN_DATASET
    )

    print(
        "Recommendation engine loaded successfully"
    )

except Exception as e:

    print(
        "Error loading recommendation engine:",
        e
    )

    recommender = None


# --------------------------------------------------
# Clean Data For JSON
# --------------------------------------------------

def clean_for_json(dataframe):

    # Remove image column
    data = dataframe.drop(
        columns=["image"],
        errors="ignore"
    ).copy()

    # Convert to object so None can replace NaN
    data = data.astype(object)

    # Replace infinity values
    data = data.replace(
        [np.inf, -np.inf],
        None
    )

    # Replace all NaN / missing values with None
    data = data.where(
        pd.notna(data),
        None
    )

    return data.to_dict(
        orient="records"
    )


# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "Welcome to ShopSmart API!",
        "status": "running",
        "products": len(df)
    }


# --------------------------------------------------
# Get All Products
# --------------------------------------------------

@app.get("/products")
def get_products():

    if df.empty:

        return []

    return clean_for_json(df)


# --------------------------------------------------
# Get Single Product
# --------------------------------------------------

@app.get("/products/{product_id}")
def get_product(
    product_id: int
):

    if df.empty:

        raise HTTPException(
            status_code=500,
            detail="Dataset is not loaded"
        )

    product = df[
        df["id"] == str(product_id)
    ]

    if product.empty:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product_data = clean_for_json(
        product
    )

    return product_data[0]


# --------------------------------------------------
# Product Image Endpoint
# --------------------------------------------------

@app.get("/images/{product_id}")
def get_product_image(
    product_id: int
):

    product_id = str(product_id)

    if product_id in high_res_images:

        return Response(
            content=high_res_images[product_id],
            media_type="image/jpeg"
        )

    raise HTTPException(
        status_code=404,
        detail="High-resolution image not found"
    )


# --------------------------------------------------
# Recommendation Endpoint
# --------------------------------------------------

@app.get("/recommend/{product_id}")
def recommend_products(
    product_id: int
):

    if recommender is None:

        raise HTTPException(
            status_code=500,
            detail="Recommendation engine is unavailable"
        )

    try:

        recommendations = recommender.recommend(
            product_id,
            number_of_recommendations=5
        )

        return recommendations

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )