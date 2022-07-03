import {
  arrayOfTokensToText,
  joinMultiOrderModels,
  nextTokens,
} from "./functions.js";

///////////////////////////////////////////////////////////////
/// CACHE HTML ELEMENTS:
///////////////////////////////////////////////////////////////

const picknextcontainer = document.getElementById("picknextcontainer");
const buttonscontainer = document.getElementById("buttonscontainer");
const storycontainer = document.getElementById("storycontainer");
const resetbutton = document.getElementById("reset");

const MARKOV_ORDER = 2;
///////////////////////////////////////////////////////////////
/// DEFINE STATE:
///////////////////////////////////////////////////////////////
const state = {
  texts: [
    {
      slugname: "bible",
      active: false,
      title: "The Holy Bible",
      models: null,
      cardElement: null,
    },
    {
      slugname: "fiftyshades",
      active: true,
      title: "50 Shades of Grey",
      models: null,
      cardElement: null,
    },
    {
      slugname: "harrypotter",
      active: true,
      title: "Harry Potter",
      models: null,
      cardElement: null,
    },
    {
      slugname: "quran",
      active: false,
      title: "The Noble Quran",
      models: null,
      cardElement: null,
    },
  ],
  currentTokens: ["."],
  totalMarkovModels: null,
};

///////////////////////////////////////////////////////////////
/// DEFINE FUNCTIONS
///////////////////////////////////////////////////////////////

/// takes e.g. "bible" and returns the json object with the 3 models
async function loadMarkovModels(stateElement) {
  let res = await fetch(`./data/models/${stateElement.slugname}.json`);
  let json = await res.json();
  stateElement.models = json;
  console.log(`markov model for ${stateElement.slugname} successfully loaded`);
}

function generateHTMLForButtonCard(stateElement) {
  let html = `<div id="${stateElement.slugname}" class="buttoncard ${
    stateElement.active ? "active" : ""
  }">
    <img src="./res/img/${stateElement.slugname}.png" class="buttoncard-img" />
    <div class="buttoncard-title">${stateElement.title}</div>
  </div>`;
  buttonscontainer.innerHTML += html;
}

function registerTapHandlersForButtonCard(stateElement) {
  let htmlCard = document.getElementById(stateElement.slugname);
  stateElement.cardElement = htmlCard;
  htmlCard.addEventListener("click", function (e) {
    // return if the state change would result
    // in having zero tabs selected
    if (
      stateElement.active &&
      state.texts.filter((e) => e.active).length <= 1
    ) {
      return;
    }

    stateElement.active = !stateElement.active;
    if (stateElement.active) {
      htmlCard.classList.add("active");
    } else {
      htmlCard.classList.remove("active");
    }
    console.log(stateElement.slugname);
    recalculateTotalMarkovModel();
    showNewSuggestions();
  });
}

function getMarkovModelSuggestions(n = 4, length = 8) {
  return Array(n)
    .fill(0)
    .map((_) => {
      let tokens = nextTokens(
        state.totalMarkovModels,
        length,
        state.currentTokens
      );
      let text = arrayOfTokensToText(tokens);
      return { tokens: tokens, text: text };
    });
}

function pickNextElementTapped(suggestion) {
  console.log(suggestion, "TAPPED");

  let { tokens } = suggestion;
  state.currentTokens = [...state.currentTokens, ...tokens];
  let newTotalText = arrayOfTokensToText(state.currentTokens).substring(2);
  storycontainer.innerHTML = newTotalText;
  showNewSuggestions();
}

async function showNewSuggestions() {
  function createPickNextElement(suggestion) {
    // generates something like this as elements:
    /*
        <div class="picknext">
          <button class="picknext-inner">
            Me too. My heartbeat has picked up his face. I feel his arm raised
            in stands around the kitchen.
          </button>
        </div>
        */
    let outer = document.createElement("div");
    outer.className = "picknext";
    let inner = document.createElement("button");
    inner.className = "picknext-inner";
    inner.innerHTML = suggestion.text;
    inner.addEventListener("click", () => pickNextElementTapped(suggestion));
    outer.appendChild(inner);
    return outer;
  }

  let suggestions = getMarkovModelSuggestions();

  picknextcontainer.innerHTML = "";
  for (let s of suggestions) {
    let child = createPickNextElement(s);
    picknextcontainer.appendChild(child);
  }
}

function recalculateTotalMarkovModel() {
  // as a sum of the markov models of all active tabs

  // array of array of model
  let activeModels = state.texts.filter((t) => t.active).map((t) => t.models);

  // of order 0, 1 and 2

  state.totalMarkovModels = joinMultiOrderModels(activeModels, MARKOV_ORDER);
}

///////////////////////////////////////////////////////////////
/// MAIN
///////////////////////////////////////////////////////////////

async function main() {
  state.texts.forEach((t) => {
    generateHTMLForButtonCard(t);
  });

  state.texts.forEach((t) => {
    registerTapHandlersForButtonCard(t);
  });

  Promise.all(state.texts.map((t) => loadMarkovModels(t))).then((res) => {
    recalculateTotalMarkovModel();
    showNewSuggestions();
  });

  resetbutton.addEventListener("click", function () {
    state.currentTokens = ["."];
    storycontainer.innerHTML = "Select a text to start the story...";
    showNewSuggestions();
  });
}

main();
