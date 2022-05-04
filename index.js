const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { setTimeout } = require("timers/promises");

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
    const moyennes = JSON.parse(
      JSON.stringify(await pronote(req.body.username, req.body.password))
    );
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

app.listen(port, () => {
  console.log(
    "Server app listening on port " + port + "\nhttp://localhost:" + port
  );
});

// get moyenne from pronote
async function pronote(u, p) {
  const pronoteUrl = process.env.PRONOTE_URL;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(pronoteUrl, {
    waitUntil: "networkidle2",
  });

  // login
  await page.waitForSelector("#id_22.style-input", {
    visible: true,
  });
  await page.type("#id_22.style-input", u, {
    delay: 100,
  });
  await page.type("#id_23.style-input", p, {
    delay: 100,
  });
  await page.click("#id_11");

  // aller dans notes
  try {
    await page.waitForSelector(
      'div[id="GInterface.Instances[0].Instances[1]_Combo2"]',
      { timeout: 3500 }
    );
  } catch (e) {
    if (e instanceof puppeteer.errors.TimeoutError) {
      return { success: false };
    }
  }

  await page.evaluate(async () => {
    $("body")
      .find('div[id="GInterface.Instances[0].Instances[1]_Combo2"]')
      .click();
    $("body")
      .find(
        '[id="GInterface.Instances[0].Instances[1]_Liste_niveau2"] > ul > li[aria-label="Détail de mes notes"]'
      )
      .click();
  });

  const pause = await setTimeout(1500, "pause");

  const moyenneGg = async () => {
    const allMoyennes = await page.evaluate(() => {
      query = document.querySelectorAll(".Gras.Espace");
      querySources = [...imgQuery].map((e) => e.innerText);
      return imgQuerySources;
    });
    return allMoyennes;
  };

  const matieresNotes = await moyenneGg();
  const matières = [""];
  const notes = [""];
  const notes3 = [""];
  let indexOfN = 0;

  browser.close();

  for (let i = 1; i < matieresNotes.length; i++) {
    indexOfN = matieresNotes[i].indexOf(String("\n"));
    for (let j = 0; j < indexOfN - 1; j++) {
      if (notes[i - 1] !== undefined) {
        notes[i - 1] = notes[i - 1] + String(matieresNotes[i]).charAt(j);
      } else {
        notes[i - 1] = String(matieresNotes[i]).charAt(j);
      }
    }
    for (let k = indexOfN + 1; k < String(matieresNotes[i].length); k++) {
      if (matières[i - 1] !== undefined) {
        matières[i - 1] = matières[i - 1] + String(matieresNotes[i]).charAt(k);
      } else {
        matières[i - 1] = String(matieresNotes[i]).charAt(k);
      }
    }
  }

  for (let i = 0; i < notes.length; i++) {
    if (String(notes[i]).includes(",")) {
      notes3[i] = Number(notes[i].replace(",", "."));
    } else {
      notes3[i] = notes[i];
    }
  }

  for (let i = 0; i < notes3.length; i++) {
    if (isNaN(notes3[i])) {
      notes3[i] = null;
    }
  }

  const notes2 = notes;
  const matières2 = matières;

  // calculer la moyenne
  async function moyenne(dot, matières2) {
    const matières3 = matières2;
    let moyenneAdd = 0;
    let moyenneAddDiviseur = 0;

    // test
    for (let i = 0; i < dot.length; i++) {
      if (String(dot[i]).includes(",") == true) {
        dot[i] = Number(dot[i].replace(",", "."));
      }
    }
    // fin test
    // test
    for (let i = 0; i < dot.length; i++) {
      if (String(matières3[i]).includes("Ecrit")) {
        if (typeof dot[i] === "number") {
          if (typeof dot[i + 1] === "number") {
            if (String(matières3[i]).includes("Oral")) {
              dot[i] = (dot[i] + dot[i + 1]) / 2;
            }
            dot[i + 1] = null;
            i = i + 1;
          } else {
            dot[i + 1] = null;
            i = i + 1;
          }
        } else {
          dot[i] = null;
        }
      }
    }
    // fin test
    for (let i = 0; i < dot.length; i++) {
      if (dot[i] === null) {
        i = i + 1;
      }
      if ((typeof dot[i] === "number") == true && (dot[i] === null) == false) {
        moyenneAdd = moyenneAdd + dot[i];
        moyenneAddDiviseur = moyenneAddDiviseur + 1;
      } else {
        dot[i] = null;
      }
    }
    return Promise.resolve(moyenneAdd / moyenneAddDiviseur);
  }
  let moyenneG = Math.round((await moyenne(notes2, matières2)) * 100) / 100;

  // tableau des moyennes
  class Moyenne {
    constructor(matières, notes) {
      this.matières = matières;
      this.notes = notes;
    }
  }
  const arrayMoyennes = {};
  for (let i = 0; i < notes3.length; i++) {
    arrayMoyennes[i] = new Moyenne(matières[i], notes3[i]);
  }
  arrayMoyennes[notes3.length + 1] = new Moyenne("Générale", moyenneG);
  console.table(arrayMoyennes);

  // log la moyenne général

  const matièresResult = [];
  const notesResult = [];
  let Result = "";
  moyenneG = arrayMoyennes;

  for (const i in moyenneG) {
    matièresResult.push([String(moyenneG[i].matières)]);
  }
  for (const i in moyenneG) {
    notesResult.push([String(moyenneG[i].notes)]);
  }
  for (const i in notesResult) {
    Result =
      Result +
      String(matièresResult[i]) +
      " : " +
      String(notesResult[i]) +
      "<br/>";
  }
  return Promise.resolve({ moyennes: Result, success: true });
}
