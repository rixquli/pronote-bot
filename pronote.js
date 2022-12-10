const puppeteer = require("puppeteer");
module.exports = async function pronote(u, p) {
  console.log("test");
  console.log(u, p);
  const user = u;
  const password = p;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  await page.goto(
    process.env.PRONOTE_URL ||
      "http://pronote.bonsecours66.com:8080/pronote/eleve.html",
    {
      waitUntil: "networkidle2",
    }
  );

  // login
  await page.waitForSelector("#id_23", {
    visible: true,
  });
  await page.type("#id_23", user, {
    delay: 15,
  });
  await page.type("#id_24", password, {
    delay: 10,
  });
  await page.click("#id_12");

  // aller dans notes
  try {
    await page.waitForSelector(
      'div[id="GInterface.Instances[0].Instances[1]_Combo4"]',
      { timeout: 3000 }
    );
  } catch (e) {
    if (e instanceof puppeteer.errors.TimeoutError) {
      console.log(
        "Votre identifiant ou votre mot de passe est incorrect\nVeuillez retaper !login VotreIdentifiant VotreMotDePasse"
      );
      return;
    }
  }

  await page.evaluate(async () => {
    $("body")
      .find('div[id="GInterface.Instances[0].Instances[1]_Combo4"]')
      .click();
    $("body")
      .find(
        '[id="GInterface.Instances[0].Instances[1]_Liste_niveau4"] > ul > li[aria-label="Suivi pluriannuel"]'
      )
      .click();
  });

  // setTimeout(() => {
  //   page.click(
  //     'div[id="GInterface.Instances[2].Instances[0].bouton"] > div[class="input-wrapper"] > div[class="ocb_cont as-input as-select "]'
  //   );
  // }, 1000);

  // await page.waitForSelector(
  //   "div[id='GInterface.Instances[2].Instances[0]_1']",
  //   {
  //     visible: true,
  //   }
  // );

  // setTimeout(() => {
  //   page.click(
  //     `div[id='GInterface.Instances[2].Instances[0]_${bulletinSelector}']`
  //   );
  // }, 1000);
  try {
    await page.waitForSelector('[class="InlineBlock AlignementMilieu Gras"]', {
      timeout: 3000,
    });
  } catch (e) {
    if (e instanceof puppeteer.errors.TimeoutError) {
      console.log(
        "Votre identifiant ou votre mot de passe est incorrect\nVeuillez retaper !login VotreIdentifiant VotreMotDePasse"
      );
      return;
    }
  }
  const notes = await page.evaluate(() => {
    imgQuery = document.querySelectorAll(
      '[class="InlineBlock AlignementMilieu Gras"]'
    );
    imgQuerySources = [...imgQuery].map((e) => e.innerText);
    return imgQuerySources;
  });
  const matieres = await page.evaluate(() => {
    imgQuery = document.querySelectorAll(
      'div[style=" width:200px; overflow:hidden;"]'
    );
    imgQuerySources = [...imgQuery].map((e) => e.innerText);
    return imgQuerySources;
  });
  const general = await page.evaluate(() => {
    imgQuery = document.querySelectorAll(
      'div[class="AlignementMilieu Gras PetitEspaceBas"]'
    );
    imgQuerySources = [...imgQuery].map((e) => e.innerText);
    return imgQuerySources;
  });

  // Pour le console.table
  class Notes {
    constructor(matiere, note) {
      this.matieres = matiere;
      this.notes = note;
    }
  }

  const family = {};
  for (let i = 0; i < notes.length; i++) {
    family[i] = new Notes(matieres[i], notes[i]);
  }
  family[notes.length] = new Notes("Générale", general);

  const matieresResult = [];
  const notesResult = [];
  let Result = "";

  for (var i in family) {
    matieresResult.push([String(family[i].matieres)]);
  }
  for (var i in family) {
    notesResult.push([String(family[i].notes)]);
  }
  for (var i in notesResult) {
    Result =
      Result +
      String(matieresResult[i]) +
      " : " +
      String(notesResult[i]) +
      "<br>";
  }
  browser.close();
  return Promise.resolve({ moyennes: Result, success: true });
};
