export function tokenizeText(text) {
  const replacements = {
    ".": " . ",
    "?": " ? ",
    "!": " ! ",
    "(": "",
    ")": "",
    "[": "",
    "]": "",
    '"': ``,
    "'": ``,
    "”": ``,
    "“": ``,
  };

  for (let key of Object.keys(replacements)) {
    text = text.replaceAll(key, replacements[key]);
  }
  text = text.replaceAll(/-\s/g, ""); // to get rid of line ending dashes

  return text.split(/\s+/).filter((e) => e); // filter for removing empty string
}

export function buildMarkovModel(tokens, order) {
  // tokens = ['what', 'we', 'know', 'is', 'that', 'we', 'cannot', 'know',  'what',   'others','know',   '.'];
  let model = {};
  let state = Array(order).fill(""); // order 2 example: state = ['we', 'know']
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    const tNext = tokens[i + 1];
    state.shift(); // remove first element from state
    state.push(t);
    if (i < order - 1) {
      continue;
    }

    let key = state.join("|");
    if (order == 0) {
      key = "";
    }
    // order0: ""
    // order1: "what"
    // order2: "what|we"
    // order3: "you|are|so"
    if (!model[key]) {
      model[key] = {};
    }
    if (model[key][tNext]) {
      model[key][tNext]++;
    } else {
      model[key][tNext] = 1;
    }
  }
  return model;
}

export function randomKey(dict) {
  // dict ={ "geologically": 1, "fashion": 3, "single": 1 }
  let total = Object.values(dict).reduce((a, c) => a + c, 0);
  let r = Math.random() * total;
  let acc = 0;
  for (let k of Object.keys(dict)) {
    let probAtK = dict[k];
    if (r < probAtK + acc) {
      return k;
    } else {
      acc = acc + probAtK;
    }
  }
}

export function arrayOfTokensToText(tokens) {
  let text = "";
  let spaceBeforeSpeechMarks = true;
  for (let w of tokens) {
    if ([",", ".", "!", "?"].find((e) => e == w)) {
      text += `${w} `;
    } else if (w == '"') {
      text += spaceBeforeSpeechMarks ? ` ${w}` : `${w} `;
      spaceBeforeSpeechMarks = !spaceBeforeSpeechMarks;
    } else {
      if (text[text.length - 1] == '"') {
        text += w;
      } else {
        text += ` ${w}`;
      }
    }
  }
  return text;
}

export function buildMarkovModels(text, upToOrder = 2) {
  let tokens = tokenizeText(text);
  return Array(upToOrder)
    .fill(0)
    .map((_, i) => buildMarkovModel(tokens, i));
}

export function generateMarkovTextFromText(text) {
  let tokens = tokenizeText(text);
  let model0 = buildMarkovModel(tokens, 0);
  let model1 = buildMarkovModel(tokens, 1);
  let model2 = buildMarkovModel(tokens, 2);
  let models = [model0, model1, model2];
  console.log(models);
  return generateTextFromMarkovModels(models, 100);
}

export function scaleMarkovModelToTextLength(model, textLength) {
  for (let key in model) {
    for (let key2 in model[key]) {
      model[key][key2] /= textLength;
    }
  }
  return model;
}

// modelsarray is a [k][order]model array
export function joinMultiOrderModels(modelsArray, order) {
  let totalModels = [];
  for (let i = 0; i < order; i++) {
    let totalModelOfOrderI = {};
    for (let models of modelsArray) {
      let orderIModel = models[i];
      for (let prevState in orderIModel) {
        if (!totalModelOfOrderI[prevState]) {
          totalModelOfOrderI[prevState] = {};
        }
        for (let nextState in orderIModel[prevState]) {
          let num = orderIModel[prevState][nextState];
          if (!totalModelOfOrderI[prevState][nextState]) {
            totalModelOfOrderI[prevState][nextState] = 0;
          }
          totalModelOfOrderI[prevState][nextState] += num;
        }
      }
    }
    totalModels.push(totalModelOfOrderI);
  }
  return totalModels;
}

export function nextToken(models, lastTokens = []) {
  let modelOrder = Math.min(lastTokens.length, models.length - 1);
  let key = lastTokens
    .slice(lastTokens.length - modelOrder, lastTokens.length)
    .join("|");
  let probabilites = models[modelOrder][key];
  if (probabilites) {
    return randomKey(probabilites);
  } else {
    return randomKey[models[0][""]];
  }
}

export function nextTokens(models, n = 100, lastTokens = []) {
  let lastTokensCopy = [...lastTokens];
  let tokens = [];
  for (let i = 0; i < n; i++) {
    let next = nextToken(models, lastTokensCopy);
    lastTokensCopy.push(next);
    tokens.push(next);
  }
  return tokens;
}
