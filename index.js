import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";

const app = express();
const port = 3000;
app.use(session({
  secret: 'SecretSessionsKey',
  resave: false,
  saveUninitialized: false
}));

const db = new pg.Client('postgresql://neondb_owner:npg_kwA5DtLVfZn6@ep-small-bush-a1ctfpi5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// --- No changes to these routes ---
app.get("/", (req, res) => {
  res.render("login.ejs", { error: null });
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { error: null });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs", { message: null });
});

app.get("/index", (req, res) => {
  res.render("index.ejs");
});

app.get("/faq", (req, res) => {
  res.render("faq.ejs");
});

// --- MODIFIED /products route ---
// This route now fetches product data from the database to dynamically render the page.
app.get("/products", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY id ASC");
    res.render("products.ejs", { products: result.rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Could not load products.");
  }
});

// --- No changes to auth routes ---
app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, password]);
      res.render("signup.ejs", { message: "Successfully Registered!" });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      const checkpassword = user.password;
      if (password === checkpassword) {
        req.session.userId = user.id;
        res.redirect("/products"); // Redirect to products page after login
      } else {
        res.render("login.ejs", { error: "Incorrect Password" });
      }
    } else {
      res.render("login.ejs", { error: "User Not Found" });
    }
  } catch (err) {
    console.log(err);
  }
});

// --- MODIFIED /addtocart route ---
// This route is slightly changed to get product ID directly instead of by name.
app.post("/addtocart", async (req, res) => {
  const { productId, quantity } = req.body;
  const user_id = req.session.userId;

  if (!user_id) {
    return res.redirect("/login");
  }

  try {
    const checkItemEntry = await db.query("SELECT * FROM cart WHERE user_id = $1 AND product_id = $2", [user_id, productId]);
    if (checkItemEntry.rows.length > 0) {
      await db.query("UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3", [quantity, user_id, productId]);
    } else {
      await db.query("INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)", [user_id, productId, quantity]);
    }
    res.redirect("/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding to cart.");
  }
});

// --- MODIFIED /cart route ---
// This now passes an optional error message to the template.
app.get("/cart", async (req, res) => {
  const user_id = req.session.userId;
  if (!user_id) {
    return res.redirect("/login");
  }

  try {
    const result = await db.query(`
      SELECT p.id AS product_id, p.name, p.price, c.quantity 
      FROM cart c
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = $1
    `, [user_id]);
    
    // Pass an empty error message by default
    res.render("cart.ejs", { p: result.rows, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading cart.");
  }
});

// --- NEW /remove-from-cart route ---
// This route handles removing an item from the cart.
app.post("/remove-from-cart", async (req, res) => {
  const { productId } = req.body;
  const user_id = req.session.userId;

  if (!user_id) {
    return res.redirect("/login");
  }

  try {
    await db.query("DELETE FROM cart WHERE user_id = $1 AND product_id = $2", [user_id, productId]);
    res.redirect("/cart");
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).send("Could not remove item from cart.");
  }
});


// --- NEW /buy-all route (replaces old /buy) ---
// This route processes the purchase for ALL items in the cart.
app.post("/buy-all", async (req, res) => {
  const user_id = req.session.userId;
  if (!user_id) {
    return res.redirect("/login");
  }

  await db.query("BEGIN"); // Start a transaction

  try {
    // Get all items in the user's cart, joining with products to check stock
    const cartItemsResult = await db.query(`
      SELECT p.id, p.name, p.stock, c.quantity 
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [user_id]);

    const cartItems = cartItemsResult.rows;

    // 1. Check stock for all items BEFORE making any changes
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await db.query("ROLLBACK"); // Abort the transaction
        // Re-render cart with an error message
        const currentCartData = await db.query(`
            SELECT p.id AS product_id, p.name, p.price, c.quantity FROM cart c
            JOIN products p ON c.product_id = p.id WHERE c.user_id = $1`, [user_id]);
        return res.render("cart.ejs", { 
            p: currentCartData.rows, 
            error: `Not enough stock for ${item.name}. Only ${item.stock} available.` 
        });
      }
    }

    // 2. If all stock is sufficient, update stock for each product
    for (const item of cartItems) {
      await db.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.id]);
    }

    // 3. Clear the user's cart
    await db.query("DELETE FROM cart WHERE user_id = $1", [user_id]);
    
    await db.query("COMMIT"); // Commit all changes if successful
    res.send("Purchase successful! Thank you for shopping with us.");

  } catch (err) {
    await db.query("ROLLBACK"); // Rollback on any other error
    console.error("Error during purchase:", err);
    res.status(500).send("Error completing purchase.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});