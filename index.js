const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { setTimeout } = require("timers/promises");
const pronote = require("./pronote");
const pronoteVersus = require("./pronoteVersus");

// Set template engine
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Needed to parse html data for POST requests
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

// GET route
app.get("/", (req, res) => {
  res.render("index");
});

// si GET /moyenne renvoie /
app.get("/moyenne", (req, res) => {
  res.redirect("/");
});

// si GET /versus send versus.ejs
app.get("/versus", (req, res) => {
  res.render("versus");
});

// POST route
app.post("/moyenne", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (
    username === undefined ||
    username === "" ||
    username === null ||
    password === undefined ||
    password === "" ||
    password === null
  ) {
    return res.render("index", {
      success: false,
      errors:
        "Erreur veuillez vérifier votre identifiant ou votre mot de passe et reesayez.",
    });
  } else {
    console.time("dbsave");
    const moyennes = JSON.parse(
      JSON.stringify(await pronote(req.body.username, req.body.password))
    );
    console.timeEnd("dbsave");
    if (moyennes.success) {
      return res.render("index", {
        success: true,
        moyennes: moyennes.moyennes,
      });
    } else if (moyennes.success === false) {
      return res.render("index", {
        success: false,
        errors:
          "<p class='error'>Erreur de connexion<br/>Veuillez vérifier vos identifiants et reessayer</p>",
      });
    }
  }
});

app.post("/moyenneVersus", async (req, res) => {
  const username1 = req.body.username1;
  const password1 = req.body.password1;
  const username2 = req.body.username2;
  const password2 = req.body.password2;

  if (
    username1 === undefined ||
    username1 === "" ||
    username1 === null ||
    password1 === undefined ||
    password1 === "" ||
    password1 === null ||
    username2 === undefined ||
    username2 === "" ||
    username2 === null ||
    password2 === undefined ||
    password2 === "" ||
    password2 === null
  ) {
    return res.render("index", {
      success: false,
      errors:
        "Erreur veuillez vérifier votre identifiant ou votre mot de passe et reesayez.",
    });
  } else {
    console.time("dbsave");
    const moyennes = JSON.parse(
      JSON.stringify(
        await pronoteVersus(
          req.body.username1,
          req.body.password1,
          req.body.username2,
          req.body.password2
        )
      )
    );
    console.timeEnd("dbsave");
    if (moyennes.success) {
      return res.render("versus", {
        success: true,
        moyennes: moyennes.moyennes,
      });
    } else if (moyennes.success === false) {
      return res.render("versus", {
        success: false,
        errors:
          "<p class='error'>Erreur de connexion<br/>Veuillez vérifier vos identifiants et reessayer</p>",
      });
    }
  }
});

app.listen(port, () => {
  console.log(
    "Server app listening on port " + port + "\nhttp://localhost:" + port
  );
});
