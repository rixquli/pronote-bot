module.exports = async function pronote(u, p, u2, p2) {
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
  const moyenneGg1 = async () => {
    const allMoyennes = await page.evaluate(() => {
      query = document.querySelectorAll(".Gras.Espace");
      querySources = [...query].map((e) => e.innerText);
      return querySources;
    });
    return allMoyennes;
  };
  console.timeEnd("dbsave3");

  const matieresNotes1 = await moyenneGg1();
  const matieresFor1 = [""];
  const notesFor1 = [""];
  const notes3For1 = [""];

  // go to pronote again to get the second moyenne
  await page.goto(pronoteUrl, {
    waitUntil: "networkidle2",
  });

  // login again to get the second moyenne
  await page.waitForSelector("#id_22.style-input", {
    visible: true,
  });
  await page.type("#id_22.style-input", u2, {
    delay: 50,
  });
  await page.type("#id_23.style-input", p2, {
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

  await new Promise((resolve) => setTimeout(resolve, 900));

  const moyenneGg2 = async () => {
    const allMoyennes = await page.evaluate(() => {
      query = document.querySelectorAll(".Gras.Espace");
      querySources = [...query].map((e) => e.innerText);
      return querySources;
    });
    return allMoyennes;
  };

  const matieresNotes2 = await moyenneGg2();
  const matieresFor2 = [""];
  const notesFor2 = [""];
  const notes3For2 = [""];

  browser.close();

  for (let i = 1; i < matieresNotes1.length; i++) {
    indexOfN = matieresNotes1[i].indexOf(String("\n"));
    for (let j = 0; j < indexOfN + 1; j++) {
      if (notesFor1[i - 1] !== undefined) {
        notesFor1[i - 1] =
          notesFor1[i - 1] + String(matieresNotes1[i]).charAt(j);
      } else {
        notesFor1[i - 1] = String(matieresNotes1[i]).charAt(j);
      }
    }
    for (let k = indexOfN + 1; k < String(matieresNotes1[i].length); k++) {
      if (matieresFor1[i - 1] !== undefined) {
        matieresFor1[i - 1] =
          matieresFor1[i - 1] + String(matieresNotes1[i]).charAt(k);
      } else {
        matieresFor1[i - 1] = String(matieresNotes1[i]).charAt(k);
      }
    }
  }

  for (let i = 0; i < notesFor1.length; i++) {
    if (String(notesFor1[i]).includes(",")) {
      notes3For1[i] = Number(notesFor1[i].replace(",", "."));
    } else {
      notes3For1[i] = notesFor1[i];
    }
  }

  for (let i = 0; i < notes3For1.length; i++) {
    if (isNaN(notes3For1[i])) {
      notes3For1[i] = null;
    }
  }

  const notes2For1 = notesFor1;
  const matieres2For1 = matieresFor1;

  // calculer la moyenne
  async function moyenne1(dot, matieres2For1) {
    const matieres3 = matieres2For1;
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
  let moyenneG1 =
    Math.round((await moyenne1(notes2For1, matieres2For1)) * 100) / 100;

  // tableau des moyennes
  class Moyenne {
    constructor(matieres, notes) {
      this.matieres = matieres;
      this.notes = notes;
    }
  }
  const arrayMoyennes1 = {};
  for (let i = 0; i < notes3For1.length; i++) {
    arrayMoyennes1[i] = new Moyenne(matieresFor1[i], notes3For1[i]);
  }
  arrayMoyennes1[notes3For1.length + 1] = new Moyenne("Générale", moyenneG1);
  console.table(arrayMoyennes1);

  // second moyenne calcul
  for (let i = 1; i < matieresNotes2.length; i++) {
    indexOfN = matieresNotes2[i].indexOf(String("\n"));
    for (let j = 0; j < indexOfN + 1; j++) {
      if (notesFor2[i - 1] !== undefined) {
        notesFor2[i - 1] =
          notesFor2[i - 1] + String(matieresNotes2[i]).charAt(j);
      } else {
        notesFor2[i - 1] = String(matieresNotes2[i]).charAt(j);
      }
    }
    for (let k = indexOfN + 1; k < String(matieresNotes2[i].length); k++) {
      if (matieresFor2[i - 1] !== undefined) {
        matieresFor2[i - 1] =
          matieresFor2[i - 1] + String(matieresNotes2[i]).charAt(k);
      } else {
        matieresFor2[i - 1] = String(matieresNotes2[i]).charAt(k);
      }
    }
  }

  for (let i = 0; i < notesFor2.length; i++) {
    if (String(notesFor2[i]).includes(",")) {
      notes3For2[i] = Number(notesFor2[i].replace(",", "."));
    } else {
      notes3For2[i] = notesFor2[i];
    }
  }

  for (let i = 0; i < notes3For2.length; i++) {
    if (isNaN(notes3For2[i])) {
      notes3For2[i] = null;
    }
  }

  const notes2For2 = notesFor2;
  const matieres2For2 = matieresFor2;

  // calculer la moyenne
  async function moyenne2(dot, matieres2For2) {
    const matieres3 = matieres2For2;
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
  let moyenneG2 =
    Math.round((await moyenne2(notes2For2, matieres2For2)) * 100) / 100;

  // tableau des moyennes
  const arrayMoyennes2 = {};
  for (let i = 0; i < notes3For2.length; i++) {
    arrayMoyennes2[i] = new Moyenne(matieresFor2[i], notes3For2[i]);
  }
  arrayMoyennes2[notes3For2.length + 1] = new Moyenne("Générale", moyenneG2);
  console.table(arrayMoyennes2);

  // log la moyenne général

  const matieresResult1 = [];
  const notesResult1 = [];
  const matieresResult2 = [];
  const notesResult2 = [];
  let Result1 = "";
  let Result2 = "";
  let Result = "";
  moyenneG1 = arrayMoyennes1;
  moyenneG2 = arrayMoyennes2;

  // premier tableau
  for (const i in moyenneG1) {
    matieresResult1.push([String(moyenneG1[i].matieres)]);
  }
  for (const i in moyenneG1) {
    notesResult1.push([String(moyenneG1[i].notes)]);
  }
  for (const i in moyenneG2) {
    matieresResult2.push([String(moyenneG2[i].matieres)]);
  }
  for (const i in moyenneG2) {
    notesResult2.push([String(moyenneG2[i].notes)]);
  }
  for (const i in notesResult1) {
    // if (notesResult1[i] === null || notesResult1[i] < notesResult2[i]) {
    //   Result1 =
    //     Result1 +
    //     String(matieresResult1[i]) +
    //     " : " +
    //     "<div class='red'>" +
    //     String(notesResult1[i]) +
    //     "</div>" +
    //     "<br/>";
    // } else if (notesResult1[i] > notesResult2[i]) {
    //   Result1 =
    //     Result1 +
    //     String(matieresResult1[i]) +
    //     " : " +
    //     "<div class='green'>" +
    //     String(notesResult1[i]) +
    //     "</div>" +
    //     "<br/>";
    // } else if (notesResult1[i] == notesResult2[i]) {
    //   Result1 =
    //     Result1 +
    //     String(matieresResult1[i]) +
    //     " : " +
    //     "<div class='blue'>" +
    //     String(notesResult1[i]) +
    //     "</div>" +
    //     "<br/>";
    // }
    Result1 =
        Result1 +
        String(matieresResult1[i]) +
        " : " +
        String(notesResult1[i]) +
        "<br/>";
  }

  // deuxième tableau

  for (const i in notesResult2) {
    // if (notesResult2[i] === null || notesResult2[i] < notesResult1[i]) {
    //   Result2 =
    //     Result2 +
    //     String(matieresResult2[i]) +
    //     " : " +
    //     "<div class='red'>" +
    //     String(notesResult2[i]) +
    //     "</div>" +
    //     "<br/>";
    // } else if (notesResult2[i] > notesResult1[i]) {
    //   Result2 =
    //     Result2 +
    //     String(matieresResult2[i]) +
    //     " : " +
    //     "<div class='green'>" +
    //     String(notesResult2[i]) +
    //     "</div>" +
    //     "<br/>";
    // } else if (notesResult2[i] == notesResult1[i]) {
    //   Result2 =
    //     Result2 +
    //     String(matieresResult2[i]) +
    //     " : " +
    //     "<div class='blue'>" +
    //     String(notesResult2[i]) +
    //     "</div>" +
    //     "<br/>";
    // }
    Result2 =
        Result2 +
        String(matieresResult2[i]) +
        " : " +
        String(notesResult2[i]) +
        "<br/>";
  }
  Result =
    "<div class='Result1'>" +
    Result1 +
    "</div>" +
    "<div class='Result2'>" +
    Result2 +
    "</div>";
  console.timeEnd("dbsave2");
  return Promise.resolve({ moyennes: Result, success: true });
};
