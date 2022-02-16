const puppeteer = require("puppeteer");
const http = require("http");
const url = require("url");
const fs = require("fs");
const EventEmitter = require("events");
const myEmitter = new EventEmitter();
const port = process.env.PORT || 5000;

//partie serveur
let server = http.createServer();
server.on("request", (request, response) => {
  // if (err) {
  //   response.writeHead(404);
  //   response.end("Error 404");
  // } else {
  response.writeHead(200, { "Content-type": "text/html; charset=utf-8" });
  let query = url.parse(request.url, true).query;
  if (query.user == undefined) {
  } else {
    response.write("Requête envoyé en attente de réponse <br>");
    console.log(String(query.user));
    pronote(String(query.user));
    // pronote(String(query.user));
  }
  myEmitter.once("event", (moyenneG) => {
    var matièresResult = [];
    let notesResult = [];
    let Result = "";

    for (var i in moyenneG) {
      matièresResult.push([String(moyenneG[i].matières)]);
    }
    for (var i in moyenneG) {
      notesResult.push([String(moyenneG[i].notes)]);
    }
    for (var i in notesResult) {
      Result =
        Result +
        String(matièresResult[i]) +
        " : " +
        String(notesResult[i]) +
        "<br>";
    }
    // response.writeHead(200, { "Content-type": "text/html; charset=utf-8" });
    response.write(Result);
    response.end();
  });

  // }

  // if (query.user === undefined) {
  //   response.write("marche pas");
  // } else {
  //   response.write(query.user);
  // }
});
server.listen(port);

const pronoteUrl = "http://pronote.cours-maintenon66.eu/pronote/eleve.html";
async function pronote(up) {
  console.log("test");
  let user = "";
  let password = "";
  let IndexOfFirstSpace = up.indexOf(" ");
  for (let i = 0; i < IndexOfFirstSpace; i++) {
    if (user === undefined) {
      user = up.charAt(i);
    } else {
      user = user + up.charAt(i);
    }
  }
  for (let i = IndexOfFirstSpace + 1; i < up.length; i++) {
    if (password === undefined) {
      password = up.charAt(i);
    } else {
      password = password + up.charAt(i);
    }
  }
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();
  await page.goto(pronoteUrl, {
    waitUntil: "networkidle2",
  });

  // login
  await page.waitForSelector("#id_22.style-input", {
    visible: true,
  });
  await page.type("#id_22.style-input", user, {
    delay: 2,
  });
  await page.type("#id_23.style-input", password, {
    delay: 2,
  });
  await page.click("#id_11");

  //aller dans notes
  await page.waitForSelector(
    'div[id="GInterface.Instances[0].Instances[1]_Combo2"]',
    {
      visible: true,
    }
  );
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

  setTimeout(() => {
    const moyenneG = (() => {
      var imageSource = page.evaluate(() => {
        imgQuery = document.querySelectorAll(".Gras.Espace");
        imgQuerySources = [...imgQuery].map((e) => e.innerText);
        return imgQuerySources;
      });
      imageSource.then((e) => {
        const matieresNotes = e;
        let matières = [""];
        let notes = [""];
        let notes3 = [""];
        let indexOfN = 0;

        for (let i = 1; i < matieresNotes.length; i++) {
          indexOfN = matieresNotes[i].indexOf(String("\n"));
          for (let j = 0; j < indexOfN - 1; j++) {
            if (notes[i - 1] == undefined) {
              notes[i - 1] = String(matieresNotes[i]).charAt(j);
            } else {
              notes[i - 1] = notes[i - 1] + String(matieresNotes[i]).charAt(j);
            }
          }
          for (let k = indexOfN + 1; k < String(matieresNotes[i].length); k++) {
            if (matières[i - 1] == undefined) {
              matières[i - 1] = String(matieresNotes[i]).charAt(k);
            } else {
              matières[i - 1] =
                matières[i - 1] + String(matieresNotes[i]).charAt(k);
            }
          }
        }

        for (let i = 0; i < notes.length; i++) {
          if (String(notes[i]).includes(",") == true) {
            notes3[i] = Number(notes[i].replace(",", "."));
          } else {
            notes3[i] = notes[i];
          }
        }

        let notes2 = notes;
        let matières2 = matières;

        //calculer la moyenne
        function moyenne(dot, matières2) {
          let matières3 = matières2;
          let moyenneAdd = 0;
          let moyenneAddDiviseur = 0;

          //test
          for (let i = 0; i < dot.length; i++) {
            if (String(dot[i]).includes(",") == true) {
              dot[i] = Number(dot[i].replace(",", "."));
            }
          }
          //fin test
          //test
          for (let i = 0; i < dot.length; i++) {
            if (String(matières3[i]).includes("Ecrit")) {
              if (typeof dot[i] === "number") {
                if (typeof dot[i + 1] === "number") {
                  dot[i] = (dot[i] + dot[i + 1]) / 2;
                  dot[i + 1] = 0;
                  i = i + 1;
                } else {
                  dot[i + 1] = 0;
                  i = i + 1;
                }
              } else {
                dot[i] = 0;
              }
            } else {
            }
          }
          //fin test
          for (let i = 0; i < dot.length; i++) {
            if (dot[i] === 0) {
              i = i + 1;
            }
            if (
              (typeof dot[i] === "number") == true &&
              (dot[i] === 0) == false
            ) {
              moyenneAdd = moyenneAdd + dot[i];
              moyenneAddDiviseur = moyenneAddDiviseur + 1;
            } else {
              dot[i] = 0;
            }
          }
          return moyenneAdd / moyenneAddDiviseur;
        }
        let moyenneG = Math.round(moyenne(notes2, matières2) * 100) / 100;

        //Pour le fun
        class Person {
          constructor(matières, notes3) {
            this.matières = matières;
            this.notes = notes3;
          }
        }
        var family = {};
        for (let i = 0; i < notes3.length; i++) {
          family[i] = new Person(matières[i], notes3[i]);
        }
        family[notes3.length + 1] = new Person("Générale", moyenneG);
        console.table(family);

        //log la moyenne général
        myEmitter.emit("event", family);
        browser.close();
      });
    })();
  }, 3000);
}
