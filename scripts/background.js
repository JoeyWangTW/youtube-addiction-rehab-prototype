function getStorageData(keys, callback) {
  chrome.storage.sync.get(keys, (result) => {
    if (chrome.runtime.lastError) {
      console.error(
        `Error retrieving from storage: ${chrome.runtime.lastError}`
      );
    } else {
      callback(result);
    }
  });
}

function handleEvaluation(response, callback) {
  const textResponse = response.choices[0].message.content.trim();
  const responseObject = JSON.parse(textResponse);
  let rating = responseObject.evaluation_rating;
  let context = responseObject.evaluation_context;
  let streakType = rating === "relevant" ? "positiveStreak" : "negativeStreak";
  let oppositeStreakType =
    rating === "relevant" ? "negativeStreak" : "positiveStreak";

  chrome.storage.sync.get([streakType], function (result) {
    let currentStreak = result[streakType] || 0;
    currentStreak++;

    let updates = {};
    updates[streakType] = currentStreak;
    updates[oppositeStreakType] = 0;

    chrome.storage.sync.set(updates, function () {
      if (callback) {
        callback({ rating, context });
      }
    });
  });
}

// Function to call OpenAI's GPT API
function evaluateVideoRelevance(currentDayPlan, videoTitle, apiKey, callback) {
  console.warn(currentDayPlan);
  // Construct the prompt for the GPT model
  const systemPrompt = `You are a youtube addiction rehab expert, user will provide their goal and a video title they are watching.
    return a json response including two items. 
    1. evaluation_rating ( three possible options: "relevant", "not_sure", "irrelevant", "avoid")
    2. evaluation_context ( one sentence about what's the video about and the relavency for user’s goal and the video)
    Make sure you go thorugh all the user's goal, and rate relevancy based on all of them. 
    In the evaluation_context, it should only show one sentence, the sentence should be user facing. And follow the instruction for the tone. 
    If rating is "relavent", make the tone positive.
    If rating is "not_sure", make the tone neutral.
    If rating is "irrelavent", try use an encouraging tone to let them go back on track.
    If the user is "avoid", try to use a teasing but asserting tone to let them know they are watching something they should avoid. 
    Assume user understand the language of the video. Also return the evaluation_context in the same lanugage as the user's goal.`;
  const prompt = `Given the user's white list watch catagory: "${currentDayPlan.allowed_catagory}", evaluate if the following video title is relevant, should be avoided, or not sure: "${videoTitle}".`;

  // Configure the request payload
  const data = {
    model: "gpt-3.5-turbo-1106", // or another model of your choice
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  };

  console.log("Call OpenAI API");
  // Make the API call
  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((response) => {
      handleEvaluation(response, callback);
    })
    .catch((error) => {
      console.error("Error calling OpenAI API:", error);
      callback({
        evaluation_rating: "not_sure",
        evaluation_context: "Error occurred while evaluating.",
      });
    });
}

// Object to keep track of content script readiness by tab ID
let contentScriptReady = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tab.url.includes("youtube.com/watch") &&
    changeInfo.status === "complete"
  ) {
    // Check if the content script is ready for this tab
    if (contentScriptReady[tabId]) {
      // Content script is ready, proceed to send message
      sendGetVideoDetailsMessage(tabId);
    } else {
      // Content script not ready, wait for it
      contentScriptReady[tabId] = false;
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message === "contentScriptReady") {
    // Mark the content script as ready for the sender's tab
    const tabId = sender.tab.id;
    contentScriptReady[tabId] = true;
  }
});

function sendGetVideoDetailsMessage(tabId) {
  chrome.tabs.sendMessage(tabId, { message: "getVideoDetails" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log("Title:", response.title);
    // Here, you would add code to call the OpenAI GPT API and process the response
    getStorageData(["currentDayPlan", "openAIKey"], (items) => {
      const currentDayPlan = items.currentDayPlan;
      const openAIKey = items.openAIKey;
      const videoTitle = response.title;

      evaluateVideoRelevance(
        currentDayPlan,
        videoTitle,
        openAIKey,
        (evaluation) => {
          getStorageData(["negativeStreak", "positiveStreak"], (items) => {
            chrome.tabs.sendMessage(tabId, {
              message: "displayEvaluation",
              evaluation: evaluation,
              streaks: items,
            });
          });
        }
      );
    });
  });
}

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
