import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "countries",
  password: "A@123456a",
  port: 5432,
});

db.connect();
let visitedCountries = [];

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  visitedCountries = [];
  result.rows.forEach((country) => {
    visitedCountries.push(country.country_code);
  });
  return visitedCountries;
}

// GET home page
app.get("/", async (req, resp) => {
  const result = await checkVisited();
  resp.render("index.ejs", { visitedCountries: result, total: result.length });
});

// POST add country
app.post("/add", async (req, resp) => {
  const country = req.body['country'];
  try {
  const result = await db.query("SELECT code FROM countries WHERE LOWER(name) LIKE '%' || $1 || '%'", [country.toLowerCase()]); 
  const data= result.rows[0];
  const countryCode = data.code;
  try {
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
    resp.redirect("/");
  } catch (err) {
    console.log(err);
    const result = await checkVisited();
    resp.render("index.ejs", { visitedCountries: result, total: result.length, error: "Country has already been added, try again." });
  }
}
  catch (err) {
    console.log(err);
    const countries = await checkVisited();
    resp.render("index.ejs", { visitedCountries: countries, total: countries.length, error: "Country not found, try again." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
