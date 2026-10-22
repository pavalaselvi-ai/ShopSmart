import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ProductRecommender:

    def __init__(self, data_path):

        # Load Parquet dataset
        self.products = pd.read_parquet(data_path)

        # Columns used for recommendation
        text_columns = [
            "productDisplayName",
            "gender",
            "masterCategory",
            "subCategory",
            "articleType",
            "baseColour",
            "season",
            "usage"
        ]

        # Convert columns to strings
        for column in text_columns:

            self.products[column] = (
                self.products[column]
                .fillna("")
                .astype(str)
            )

        # Combine product information
        self.products["combined_features"] = (
            self.products["productDisplayName"] + " " +
            self.products["gender"] + " " +
            self.products["masterCategory"] + " " +
            self.products["subCategory"] + " " +
            self.products["articleType"] + " " +
            self.products["baseColour"] + " " +
            self.products["season"] + " " +
            self.products["usage"]
        )

        # TF-IDF Vectorizer
        self.vectorizer = TfidfVectorizer(
            stop_words="english"
        )

        self.feature_matrix = (
            self.vectorizer.fit_transform(
                self.products["combined_features"]
            )
        )

        # Cosine similarity
        self.similarity_matrix = cosine_similarity(
            self.feature_matrix
        )

        print("TF-IDF recommendation model ready")

    def recommend(
        self,
        product_id,
        number_of_recommendations=5
    ):

        # Find selected product
        matches = self.products[
            self.products["id"].astype(str)
            == str(product_id)
        ]

        # Product not found
        if matches.empty:
            return []

        # Get product index
        product_index = matches.index[0]

        # Get similarity scores
        similarity_scores = list(
            enumerate(
                self.similarity_matrix[
                    product_index
                ]
            )
        )

        # Sort by similarity
        similarity_scores = sorted(
            similarity_scores,
            key=lambda x: x[1],
            reverse=True
        )

        recommendations = []

        # Skip selected product
        for index, score in similarity_scores[
            1:number_of_recommendations + 1
        ]:

            product = self.products.iloc[index]

            recommendations.append({

                "id": str(
                    product["id"]
                ),

                "productName": str(
                    product["productDisplayName"]
                ),

                "gender": str(
                    product["gender"]
                ),

                "category": str(
                    product["masterCategory"]
                ),

                "subCategory": str(
                    product["subCategory"]
                ),

                "articleType": str(
                    product["articleType"]
                ),

                "baseColour": str(
                    product["baseColour"]
                ),

                "usage": str(
                    product["usage"]
                ),

                "similarityScore": float(
                    round(float(score), 3)
                )
            })

        return recommendations