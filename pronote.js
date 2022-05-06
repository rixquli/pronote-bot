module.exports = async function pronote(u, p) {
  const puppeteer = require("puppeteer");
  console.time("dbsave2");
  console.time("dbsave5");
  console.time("dbsave6");
  const pronoteUrl =
    process.env.PRONOTE_URL ||
    "http://pronote.cours-maintenon66.eu/pronote/eleve.html";
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(pronoteUrl, {
    waitUntil: "networkidle2",
  });
  console.timeEnd("dbsave5");

  // login
  await page.waitForSelector("#id_22.style-input", {
    visible: true,
  });
  await page.type("#id_22.style-input", u, {
    delay: 50,
  });
  await page.type("#id_23.style-input", p, {
    delay: 50,
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
  console.timeEnd("dbsave6");

  await new Promise((resolve) => setTimeout(resolve, 900));

  console.time("dbsave3");
  const moyenneGg = async () => {
    const allMoyennes = await page.evaluate(() => {
      query = document.querySelectorAll(".Gras.Espace");
      querySources = [...query].map((e) => e.innerText);
      return querySources;
    });
    return allMoyennes;
  };
  console.timeEnd("dbsave3");

  const matieresNotes = await moyenneGg();
  const matieres = [""];
  const notes = [""];
  const notes3 = [""];

  browser.close();

  for (let i = 1; i < matieresNotes.length; i++) {
    indexOfN = matieresNotes[i].indexOf(String("\n"));
    for (let j = 0; j < indexOfN + 1; j++) {
      if (notes[i - 1] !== undefined) {
        notes[i - 1] = notes[i - 1] + String(matieresNotes[i]).charAt(j);
      } else {
        notes[i - 1] = String(matieresNotes[i]).charAt(j);
      }
    }
    for (let k = indexOfN + 1; k < String(matieresNotes[i].length); k++) {
      if (matieres[i - 1] !== undefined) {
        matieres[i - 1] = matieres[i - 1] + String(matieresNotes[i]).charAt(k);
      } else {
        matieres[i - 1] = String(matieresNotes[i]).charAt(k);
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
  const matieres2 = matieres;

  // calculer la moyenne
  async function moyenne(dot, matieres2) {
    const matieres3 = matieres2;
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
      if (String(matieres3[i]).includes("Ecrit")) {
        if (typeof dot[i] === "number") {
          if (typeof dot[i + 1] === "number") {
            if (String(matieres3[i + 1]).includes("Oral")) {
              dot[i] = (dot[i] + dot[i + 1]) / 2;
              dot[i + 1] = null;
              i = i + 1;
            }
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
  let moyenneG = Math.round((await moyenne(notes2, matieres2)) * 100) / 100;

  // tableau des moyennes
  class Moyenne {
    constructor(matieres, notes) {
      this.matieres = matieres;
      this.notes = notes;
    }
  }
  const arrayMoyennes = {};
  for (let i = 0; i < notes3.length; i++) {
    arrayMoyennes[i] = new Moyenne(matieres[i], notes3[i]);
  }
  arrayMoyennes[notes3.length + 1] = new Moyenne("Générale", moyenneG);
  console.table(arrayMoyennes);

  // log la moyenne général

  const matieresResult = [];
  const notesResult = [];
  let Result = "";
  moyenneG = arrayMoyennes;

  for (const i in moyenneG) {
    matieresResult.push([String(moyenneG[i].matieres)]);
  }
  for (const i in moyenneG) {
    notesResult.push([String(moyenneG[i].notes)]);
  }
  for (const i in notesResult) {
    Result =
      Result +
      String(matieresResult[i]) +
      " : " +
      String(notesResult[i]) +
      "<br/>";
  }
  console.timeEnd("dbsave2");
  return Promise.resolve({ moyennes: Result, success: true });
};
