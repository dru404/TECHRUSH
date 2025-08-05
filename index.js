import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

/*const db = new pg.Client('postgresql://neondb_owner:npg_kwA5DtLVfZn6@ep-small-bush-a1ctfpi5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');*/
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "secrets",
  password: "May07tanDb#",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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

app.get("/products", (req, res) => {
  res.render("products.ejs");
});




app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

 try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, password]
      );
      console.log(result);
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
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,]);

      if(checkResult.rows.length>0){
        const user = checkResult.rows[0];
        const checkpassword = user.password;
        if(password===checkpassword){
          res.render("index.ejs");
        }else{
         res.render("login.ejs", { error: "Incorrect Password" });
        }
      }else{
        res.render("login.ejs", { error: "User Not Found" });
      }
    }catch{
      console.log(err);
      }
 
});

// Add product to cart (TEMP: still storing in 'products' table for now)
app.post("/addtocart", async (req, res) => {
  const productName = req.body.productName;
  const price = req.body.price;
  const quantity = req.body.quantity;

  try {
    await db.query(
      "INSERT INTO products(name, price, stock) VALUES($1, $2, $3)",
      [productName, price, quantity]
    );
    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding to cart.");
  }
});

app.get("/cart", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY id DESC LIMIT 1");

    if (result.rows.length > 0) {
      const p = result.rows[0];
      res.render("cart.ejs", { p });
    } else {
      res.send("Your cart is empty.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading cart.");
  }
});

app.post("/buy", async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = 1; // change this based on session/login

  try {
    // Get current stock
    const productResult = await db.query("SELECT stock FROM products WHERE id = $1", [productId]);
    const currentStock = productResult.rows[0].stock;

    if (currentStock < quantity) {
      return res.json({ success: false, message: "Not enough stock." });
    }

    // Insert into cart_items
    await db.query(
      "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)",
      [userId, productId, quantity]
    );

    // Reduce stock
    const newStock = currentStock - quantity;
    await db.query("UPDATE products SET stock = $1 WHERE id = $2", [newStock, productId]);

    res.json({ success: true, newStock }); // send updated stock
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

