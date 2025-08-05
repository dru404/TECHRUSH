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

app.get("/addtocart", async (req, res) => {
  const productName = req.query.productName;
  const price = req.query.price;
  const quantity = req.query.quantity;
  try {
    const result = await db.query( "SELECT * FROM products WHERE name = $1 AND stock = $2",[productName,quantity] );

    if (result.rows.length > 0) {
      const p = result.rows[0]; 
      res.render("cart.ejs", { p });
    } else {
      res.send("Product not found.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
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

app.post("/addtocart",(req,res)=>{
  const productName = req.body.productName;
  const price = req.body.price;
  const quantity = req.body.quantity;
  console.log(quantity);
  console.log(price);
  console.log(productName);
  db.query("INSERT INTO products(name,price,stock) VALUES($1,$2,$3)",[productName,price,quantity]);
  res.render("products.ejs");
})



/*
app.post("/addtocart", async (req, res) => {
  const { productName, price, quantity } = req.body;
  const user = req.session.user;

  if (!user) return res.redirect("/login");

  const product = await db.query("SELECT * FROM products WHERE name=$1", [productName]);

  if (product.rows.length > 0) {
    const productId = product.rows[0].id;

    const existing = await db.query(
      "SELECT * FROM cart WHERE user_email=$1 AND product_id=$2",
      [user, productId]
    );

    if (existing.rows.length > 0) {
      await db.query(
        "UPDATE cart SET quantity = quantity + $1 WHERE user_email=$2 AND product_id=$3",
        [quantity, user, productId]
      );
    } else {
      await db.query(
        "INSERT INTO cart (user_email, product_id, quantity) VALUES ($1, $2, $3)",
        [user, productId, quantity]
      );
    }
    res.redirect("/cart");
  }
});

// View cart
app.get("/cart", async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/login");

  const cart = await db.query(`
    SELECT p.name, p.price, c.quantity, (p.price * c.quantity) AS total
    FROM cart c JOIN products p ON c.product_id = p.id
    WHERE c.user_email = $1
  `, [user]);

  res.render("cart.ejs", { cart: cart.rows });
});

// Buy items
app.post("/buy", async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/login");

  const items = await db.query("SELECT * FROM cart WHERE user_email=$1", [user]);

  for (let item of items.rows) {
    await db.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.product_id]);
  }

  await db.query("DELETE FROM cart WHERE user_email=$1", [user]);
  res.send("Purchase successful. Cart cleared.");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
*/
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
