import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("home");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [history, setHistory] = useState([]);

  // Load products
  useEffect(() => {
    fetch(`${API}/products`)
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        console.log("ShopSmart products:", data.length);
      })
      .catch((error) => {
        console.error("Backend connection error:", error);
      });

    const savedWishlist =
      JSON.parse(localStorage.getItem("shopsmart-wishlist")) || [];

    const savedCart =
      JSON.parse(localStorage.getItem("shopsmart-cart")) || [];

    const savedHistory =
      JSON.parse(localStorage.getItem("shopsmart-history")) || [];

    setWishlist(savedWishlist);
    setCart(savedCart);
    setHistory(savedHistory);
  }, []);

  // Save wishlist
  useEffect(() => {
    localStorage.setItem(
      "shopsmart-wishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  // Save cart
  useEffect(() => {
    localStorage.setItem(
      "shopsmart-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  // Save search/view history
  useEffect(() => {
    localStorage.setItem(
      "shopsmart-history",
      JSON.stringify(history)
    );
  }, [history]);

  // Search products
  const filteredProducts = products.filter((product) => {
    const text = `
      ${product.productDisplayName}
      ${product.gender}
      ${product.masterCategory}
      ${product.subCategory}
      ${product.articleType}
      ${product.baseColour}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  // Open product
  const openProduct = async (product) => {
    setSelectedProduct(product);
    setView("product");

    const updatedHistory = [
      product,
      ...history.filter((item) => item.id !== product.id),
    ].slice(0, 10);

    setHistory(updatedHistory);

    try {
      const response = await fetch(
        `${API}/recommend/${product.id}`
      );

      const data = await response.json();

      setRecommendations(
        Array.isArray(data)
          ? data
          : data.recommendations || []
      );
    } catch (error) {
      console.error(
        "Recommendation error:",
        error
      );

      setRecommendations([]);
    }
  };

  // Add/remove wishlist
  const toggleWishlist = (product) => {
    const exists = wishlist.some(
      (item) => item.id === product.id
    );

    if (exists) {
      setWishlist(
        wishlist.filter(
          (item) => item.id !== product.id
        )
      );
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  // Add cart
  const addToCart = (product) => {
    const exists = cart.some(
      (item) => item.id === product.id
    );

    if (!exists) {
      setCart([...cart, product]);
    }
  };

  // Search
  const handleSearch = (event) => {
    setSearch(event.target.value);

    if (event.target.value.trim() !== "") {
      setView("products");
    }
  };

  // Home recommendations based on history
  const homeRecommendations =
    history.length > 0
      ? recommendations.length > 0
        ? recommendations
        : products
            .filter(
              (product) =>
                product.subCategory ===
                history[0].subCategory
            )
            .slice(0, 5)
      : products.slice(0, 5);

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <div
          className="logo"
          onClick={() => {
            setView("home");
            setSelectedProduct(null);
          }}
        >
          <span>Shop</span>
          <strong>Smart</strong>
        </div>

        <div className="nav-links">

          <button
            className={view === "home" ? "active" : ""}
            onClick={() => setView("home")}
          >
            Home
          </button>

          <button
            className={view === "products" ? "active" : ""}
            onClick={() => setView("products")}
          >
            Products
          </button>

          <button
            className={view === "categories" ? "active" : ""}
            onClick={() => setView("categories")}
          >
            Categories
          </button>

          <button
            className={view === "wishlist" ? "active" : ""}
            onClick={() => setView("wishlist")}
          >
            ♡ Wishlist
          </button>

          <button
            className={view === "cart" ? "active" : ""}
            onClick={() => setView("cart")}
          >
            🛒 Cart

            {cart.length > 0 && (
              <span className="nav-count">
                {cart.length}
              </span>
            )}
          </button>

        </div>

        <div className="nav-profile">
          <span>👤</span>
          <span>Guest</span>
        </div>

      </nav>


      {/* SEARCH BAR */}

      <div className="search-area">

        <div className="search-box">

          <span>🔎</span>

          <input
            type="text"
            placeholder="Search fashion, shoes, watches, shirts..."
            value={search}
            onChange={handleSearch}
          />

          {search && (
            <button
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}

        </div>

      </div>


      {/* MAIN DASHBOARD */}

      <main className="dashboard">

        {/* HOME */}

        {view === "home" && (
          <section className="home-view">

            <div className="hero-card">

              <div className="hero-content">

                <span className="hero-tag">
                  AI POWERED SHOPPING
                </span>

                <h1>
                  Discover products
                  <br />
                  <span>you'll love.</span>
                </h1>

                <p>
                  Shop smarter with personalized
                  recommendations powered by AI.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => setView("products")}
                >
                  Explore Products →
                </button>

              </div>

              <div className="hero-art">
                🛍️
              </div>

            </div>


            <div className="section-title">

              <div>

                <span className="eyebrow">
                  PERSONALIZED FOR YOU
                </span>

                <h2>
                  {history.length > 0
                    ? "Recommended For You"
                    : "Trending Products"}
                </h2>

              </div>

              <button
                onClick={() => setView("products")}
              >
                View all →
              </button>

            </div>


            <div className="product-grid">

              {homeRecommendations.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={openProduct}
                    onWishlist={toggleWishlist}
                    onCart={addToCart}
                    isWishlisted={wishlist.some(
                      (item) =>
                        item.id === product.id
                    )}
                  />
                )
              )}

            </div>

          </section>
        )}


        {/* PRODUCTS */}

        {view === "products" && (
          <section className="page-view">

            <div className="section-title">

              <div>

                <span className="eyebrow">
                  SHOPSMART CATALOG
                </span>

                <h2>
                  {search
                    ? `Results for "${search}"`
                    : "All Products"}
                </h2>

              </div>

              <span className="result-count">
                {filteredProducts.length} products
              </span>

            </div>


            <div className="product-grid">

              {filteredProducts
                .slice(0, 40)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={openProduct}
                    onWishlist={toggleWishlist}
                    onCart={addToCart}
                    isWishlisted={wishlist.some(
                      (item) =>
                        item.id === product.id
                    )}
                  />
                ))}

            </div>

          </section>
        )}


        {/* CATEGORIES */}

        {view === "categories" && (
          <section className="page-view">

            <div className="section-title">

              <div>

                <span className="eyebrow">
                  EXPLORE
                </span>

                <h2>
                  Shop by Category
                </h2>

              </div>

            </div>


            <div className="category-grid">

              {[
                ["👕", "Apparel"],
                ["👟", "Footwear"],
                ["⌚", "Accessories"],
                ["👜", "Bags"],
                ["💎", "Jewellery"],
                ["🧥", "Topwear"],
                ["👖", "Bottomwear"],
                ["🕶️", "Watches"],
              ].map(
                ([icon, name]) => (
                  <button
                    className="category-card"
                    key={name}
                    onClick={() => {
                      setSearch(name);
                      setView("products");
                    }}
                  >
                    <span>{icon}</span>

                    <h3>{name}</h3>

                    <small>
                      Explore collection →
                    </small>

                  </button>
                )
              )}

            </div>

          </section>
        )}


        {/* WISHLIST */}

        {view === "wishlist" && (
          <section className="page-view">

            <div className="section-title">

              <div>

                <span className="eyebrow">
                  YOUR COLLECTION
                </span>

                <h2>
                  Wishlist ❤️
                </h2>

              </div>

            </div>


            {wishlist.length === 0 ? (

              <div className="empty-state">

                <div>♡</div>

                <h2>Your wishlist is empty</h2>

                <p>
                  Save products you love and
                  find them here later.
                </p>

              </div>

            ) : (

              <div className="product-grid">

                {wishlist.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpen={openProduct}
                      onWishlist={toggleWishlist}
                      onCart={addToCart}
                      isWishlisted={true}
                    />
                  )
                )}

              </div>

            )}

          </section>
        )}


        {/* CART */}

        {view === "cart" && (
          <section className="page-view">

            <div className="section-title">

              <div>

                <span className="eyebrow">
                  SHOPPING BAG
                </span>

                <h2>
                  Your Cart 🛒
                </h2>

              </div>

            </div>


            {cart.length === 0 ? (

              <div className="empty-state">

                <div>🛒</div>

                <h2>Your cart is empty</h2>

                <p>
                  Add something you love.
                </p>

                <button
                  className="primary-btn"
                  onClick={() =>
                    setView("products")
                  }
                >
                  Start Shopping
                </button>

              </div>

            ) : (

              <div className="cart-list">

                {cart.map((product) => (

                  <div
                    className="cart-item"
                    key={product.id}
                  >

                    <img
                      src={`${API}/images/${product.id}`}
                      alt={product.productDisplayName}
                    />

                    <div>

                      <span>
                        {product.articleType}
                      </span>

                      <h3>
                        {product.productDisplayName}
                      </h3>

                      <p>
                        {product.baseColour}
                      </p>

                      {/* PRICE */}
                      {product.price != null && (
                        <strong className="product-price">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </strong>
                      )}

                    </div>

                    <button
                      onClick={() =>
                        setCart(
                          cart.filter(
                            (item) =>
                              item.id !== product.id
                          )
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>
        )}


        {/* PRODUCT DETAIL */}

        {view === "product" &&
          selectedProduct && (

            <section className="product-page">

              <button
                className="back-btn"
                onClick={() => setView("products")}
              >
                ← Back to Products
              </button>


              <div className="product-detail-layout">

                <div className="detail-image">

                  <img
                    src={`${API}/images/${selectedProduct.id}`}
                    alt={
                      selectedProduct.productDisplayName
                    }
                  />

                </div>


                <div className="detail-info">

                  <span className="eyebrow">
                    {selectedProduct.articleType}
                  </span>

                  <h1>
                    {selectedProduct.productDisplayName}
                  </h1>

                  <p className="detail-category">
                    {selectedProduct.gender} •{" "}
                    {selectedProduct.subCategory}
                  </p>


                  {/* PRICE */}
                  {selectedProduct.price != null ? (

                    <div className="detail-price">
                      ₹
                      {Number(
                        selectedProduct.price
                      ).toLocaleString("en-IN")}
                    </div>

                  ) : (

                    <div className="detail-price">
                      Price unavailable
                    </div>

                  )}


                  <div className="detail-tags">

                    <span>
                      {selectedProduct.baseColour}
                    </span>

                    <span>
                      {selectedProduct.usage}
                    </span>

                    <span>
                      {selectedProduct.season}
                    </span>

                  </div>


                  <div className="detail-actions">

                    <button
                      className="primary-btn"
                      onClick={() =>
                        addToCart(selectedProduct)
                      }
                    >
                      Add to Cart 🛒
                    </button>

                    <button
                      className="wishlist-btn"
                      onClick={() =>
                        toggleWishlist(
                          selectedProduct
                        )
                      }
                    >
                      ♡
                    </button>

                  </div>


                  <button className="external-btn">
                    🔗 Search this product online
                  </button>

                </div>

              </div>


              <div className="recommendation-area">

                <div className="section-title">

                  <div>

                    <span className="eyebrow">
                      AI RECOMMENDATIONS
                    </span>

                    <h2>
                      You may also like
                    </h2>

                  </div>

                </div>


                <div className="product-grid">

                  {recommendations.map(
                    (product) => (

                      <div
                        className="product-card"
                        key={product.id}
                      >

                        <div className="product-image">

                          <img
                            src={`${API}/images/${product.id}`}
                            alt={product.productName}
                          />

                          <span className="match-badge">
                            {Math.round(
                              product.similarityScore *
                              100
                            )}
                            % match
                          </span>

                        </div>


                        <div className="product-info">

                          <span className="product-type">
                            {product.articleType}
                          </span>

                          <h3>
                            {product.productName}
                          </h3>

                          <p>
                            {product.baseColour}
                          </p>

                          {/* RECOMMENDATION PRICE */}
                          {(() => {

                            const recommendedProduct =
                              products.find(
                                (item) =>
                                  String(item.id) ===
                                  String(product.id)
                              );

                            return recommendedProduct?.price != null ? (

                              <div className="product-price">
                                ₹
                                {Number(
                                  recommendedProduct.price
                                ).toLocaleString("en-IN")}
                              </div>

                            ) : null;

                          })()}


                          <button
                            className="product-btn"
                            onClick={() => {

                              const found =
                                products.find(
                                  (item) =>
                                    String(item.id) ===
                                    String(product.id)
                                );

                              if (found) {
                                openProduct(found);
                              }

                            }}
                          >
                            View Product →
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            </section>

          )}

      </main>

    </div>
  );
}


// --------------------------------------------------
// PRODUCT CARD
// --------------------------------------------------

function ProductCard({
  product,
  onOpen,
  onWishlist,
  onCart,
  isWishlisted,
}) {

  return (

    <div className="product-card">

      <div
        className="product-image"
        onClick={() => onOpen(product)}
      >

        <img
          src={`http://127.0.0.1:8000/images/${product.id}`}
          alt={product.productDisplayName}
        />

        <button
          className="heart-btn"
          onClick={(event) => {
            event.stopPropagation();
            onWishlist(product);
          }}
        >
          {isWishlisted ? "♥" : "♡"}
        </button>

      </div>


      <div className="product-info">

        <span className="product-type">
          {product.articleType}
        </span>

        <h3>
          {product.productDisplayName}
        </h3>

        <p className="product-meta">
          {product.gender} •{" "}
          {product.baseColour}
        </p>


        {/* PRICE */}
        {product.price != null ? (

          <div className="product-price">
            ₹
            {Number(
              product.price
            ).toLocaleString("en-IN")}
          </div>

        ) : (

          <div className="product-price unavailable">
            Price unavailable
          </div>

        )}


        <div className="product-actions">

          <button
            className="product-btn"
            onClick={() => onOpen(product)}
          >
            View Product
          </button>

          <button
            className="cart-mini"
            onClick={() => onCart(product)}
          >
            🛒
          </button>

        </div>

      </div>

    </div>

  );
}

export default App;