import {
  scaleMarkovModelToTextLength,
  buildMarkovModels,
} from "./functions.js";

import fs from "fs";

async function main() {
  let textFiles = ["bible", "fiftyshades", "harrypotter", "quran"];
  let texts = textFiles.map((e) => fs.readFileSync(`./data/${e}.txt`, "utf-8"));

  let textModels = texts.map((e) => buildMarkovModels(e));

  textModels = textModels.map((e, i) =>
    e.map((ee) => scaleMarkovModelToTextLength(ee, texts[i].length))
  );

  for (let i in textFiles) {
    fs.writeFileSync(
      `./data/models/${textFiles[i]}.json`,
      JSON.stringify(textModels[i]),
      "utf-8"
    );
  }
}
