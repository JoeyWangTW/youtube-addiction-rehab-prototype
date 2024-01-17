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

// Function to call OpenAI's GPT API
function evaluateVideoRelevance(userGoal, videoTitle, apiKey, callback) {
  // Construct the prompt for the GPT model
  const systemPrompt = `You are a youtube addiction rehab expert, user will provide their goal and a video title they are watching.
    return a json response including two items. 
    1. evaluation_rating ( three possible options: "relevant", "not_sure", "irrelevant", "avoid")
    2. evaluation_context ( one sentence about the relavency for user’s goal and the video)
    In the evaluation_context, it should only show one sentence, the sentence should be user facing. And follow the instruction for the tone. 
    If rating is "relavent", make the tone positive.
    If rating is "not_sure", make the tone neutral.
    If rating is "irrelavent", try use an encouraging tone to let them go back on track.
    If the user is "avoid", try to use a teasing but asserting tone to let them know they are watching something they should avoid. 
    Assume user understand the language of the video. Also return the evaluation_context in the same lanugage as the user's goal.`;
  const prompt = `Given the user's goal: "${userGoal}", evaluate if the following video title is relevant, should be avoided, or not sure: "${videoTitle}".`;

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
      // Process the response to extract the evaluation
      // Assuming the AI's response follows a known structure in its text.
      const textResponse = response.choices[0].message.content.trim();
      const responseObject = JSON.parse(textResponse);

      let rating = responseObject.evaluation_rating;
      let context = responseObject.evaluation_context;
      callback({ rating, context });
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
    getStorageData(["userGoal", "openAIKey"], (items) => {
      const userGoal = items.userGoal;
      const openAIKey = items.openAIKey;
      const videoTitle = response.title;

      evaluateVideoRelevance(userGoal, videoTitle, openAIKey, (evaluation) => {
        chrome.tabs.sendMessage(tabId, {
          message: "displayEvaluation",
          evaluation: evaluation,
        });
      });
    });
  });
}

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
