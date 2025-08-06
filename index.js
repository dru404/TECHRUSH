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
// const db = new pg.Client({
//   user: "postgres",
//   host: "localhost",
//   database: "secrets",
//   password: "May07tanDb#",
//   port: 5432,
// });
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
          req.session.userId = user.id;
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


app.post("/addtocart", async (req, res) => {
  const productName = req.body.productName;
  const price = Number(req.body.price);
  const quantity = Number(req.body.quantity);

  const user_id = req.session.userId;
  const productResult = await db.query("SELECT id FROM products WHERE name = $1", [productName]);
  console.log(productResult);
  const product_id = productResult.rows[0].id;
  try {
    const checkItemEntry = await db.query("SELECT * FROM cart WHERE user_id = $1 AND product_id = $2" , [user_id,product_id])
    if(checkItemEntry.rows.length>0) {
      await db.query("UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3" , [quantity , user_id , product_id]);
      
    }
    else {
      await db.query("INSERT INTO cart (user_id , product_id , quantity) VALUES ($1 , $2 , $3)" , [user_id , product_id , quantity]); //add price later
    }

    res.redirect("/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding to cart.");
  }
});

app.get("/cart", async (req, res) => {
  try {
    //const result = await db.query("SELECT * FROM products ORDER BY id DESC LIMIT 10");
    const user_id = req.session.userId;
    const result = await db.query(`
  SELECT products.id AS product_id, products.name, products.price, cart.quantity 
  FROM cart 
  INNER JOIN products ON cart.product_id = products.id 
  WHERE cart.user_id = $1
`, [user_id]);


    if (result.rows.length > 0) {
      const p = result.rows;
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
  const user_id = req.session.userId;
  //const productName = req.body.productName;
  const quantity = Number(req.body.quantity);
  const productId = req.body.productId;

  await db.query("BEGIN");

  try {
    await db.query("DELETE FROM cart WHERE user_id = $1 AND product_id = $2" , [user_id , productId]);
    await db.query("UPDATE products SET stock = stock - $1 WHERE id = $2" , [quantity , productId]);
    //res.send("Purchase successful! Thank you for using our Website.<br>--Team CodeCanvas");
    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error completing purchase.");
  }

  await db.query("COMMIT");
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

