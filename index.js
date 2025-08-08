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

//admin
const checkAdmin = (req, res, next) => {
  if (req.session.userEmail === 'admin123@gmail.com') {
    return next();
  }
  res.redirect('/products');
};

// route handlers for users
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

// route handlers for admin
app.get("/admin", checkAdmin, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY id ASC");
    res.render("admin.ejs", { products: result.rows });
  } catch (err) {
    console.error("Error fetching products for admin:", err);
    res.status(500).send("Could not load admin panel.");
  }
});

app.post("/admin-update", checkAdmin, async (req, res) => {
  const { productId, action } = req.body;
  try {
    if (action === "increment") {
      await db.query("UPDATE products SET stock = stock + 1 WHERE id = $1", [productId]);
    } else if (action === "decrement") {
      await db.query("UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0", [productId]);
    }
    res.redirect("/admin");
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).send("Error updating stock.");
  }
});

app.post("/admin/delete", checkAdmin, async (req, res) => {
  const { productId } = req.body;
  await db.query("BEGIN");
  try {
    await db.query("DELETE FROM cart WHERE product_id = $1", [productId]);
    await db.query("DELETE FROM products WHERE id = $1", [productId]);
    await db.query("COMMIT");
    res.redirect("/admin");
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Error deleting product:", err);
    res.status(500).send("Error deleting product.");
  }
});

app.get("/orders", checkAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.id,o.order_date,u.email AS customer_email,SUM(oi.quantity * p.price) AS total_amount 
      FROM orders o 
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, u.email
      ORDER BY o.order_date DESC;`);
    res.render("orders.ejs", { orders: result.rows });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Could not load orders.");
  }
});

app.get("/customers", checkAdmin, async (req, res) => {
  try {
    const result = await db.query("SELECT id, email FROM users WHERE email != 'admin123@gmail.com'");
    res.render("customers.ejs", { customers: result.rows });
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).send("Could not load customer data.");
  }
});

app.get("/analytics", checkAdmin, async (req, res) => {
  try {
    const totalProductsResult = await db.query("SELECT COUNT(*) FROM products");
    const totalUsersResult = await db.query("SELECT COUNT(*) FROM users");
    const totalOrdersResult = await db.query("SELECT COUNT(*) FROM orders");

    res.render("analytics.ejs", { 
      totalProducts: totalProductsResult.rows[0].count,
      totalUsers: totalUsersResult.rows[0].count,
      totalOrders: totalOrdersResult.rows[0].count,
    });
  } catch (err) {
    console.error("Error fetching analytics data:", err);
    res.status(500).send("Could not load analytics.");
  }
});

// for products page
app.get("/products", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY id ASC");
    res.render("products.ejs", { products: result.rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Could not load products.");
  }
});

// auth routes
app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      res.render("signup.ejs", { message: "Email already exists. Please try LOGIN" });
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
      if (password === user.password) {
        req.session.userId = user.id;
        req.session.userEmail = user.email; // store email for admin check

        if (user.email === 'admin123@gmail.com') {
          res.redirect("/admin");
        } else {
          res.redirect("/index");
        }
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

// addtocart
app.post("/addtocart", async (req, res) => {
  const { productId, quantity } = req.body;
  const user_id = req.session.userId;
  if (!user_id) return res.redirect("/login");

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

// cart
app.get("/cart", async (req, res) => {
  const user_id = req.session.userId;
  if (!user_id) return res.redirect("/login");

  try {
    const result = await db.query(`
      SELECT p.id AS product_id, p.name, p.price, c.quantity 
      FROM cart c
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = $1
    `, [user_id]);
    res.render("cart.ejs", { p: result.rows, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading cart.");
  }
});

// remove from cart
app.post("/remove-from-cart", async (req, res) => {
  const { productId } = req.body;
  const user_id = req.session.userId;
  if (!user_id) return res.redirect("/login");

  try {
    await db.query("DELETE FROM cart WHERE user_id = $1 AND product_id = $2", [user_id, productId]);
    res.redirect("/cart");
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).send("Could not remove item from cart.");
  }
});

// buy all items in cart
app.post("/buy-all", async (req, res) => {
  const user_id = req.session.userId;
  if (!user_id) return res.redirect("/login");

  await db.query("BEGIN");
  try {
    const cartItemsResult = await db.query(`
      SELECT p.id, p.name, p.stock, c.quantity 
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [user_id]);

    const cartItems = cartItemsResult.rows;

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await db.query("ROLLBACK");
        const currentCartData = await db.query(`
          SELECT p.id AS product_id, p.name, p.price, c.quantity 
          FROM cart c
          JOIN products p ON c.product_id = p.id 
          WHERE c.user_id = $1
        `, [user_id]);
        return res.render("cart.ejs", { 
          p: currentCartData.rows, 
          error: `Not enough stock for ${item.name}. Only ${item.stock} available.` 
        });
      }
    }

    for (const item of cartItems) {
      await db.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.id]);
    }

    await db.query("DELETE FROM cart WHERE user_id = $1", [user_id]);
    await db.query("COMMIT");
    res.send("Purchase successful! Thank you for shopping with us.");
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Error during purchase:", err);
    res.status(500).send("Error completing purchase.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
