let currentTitle = "";

function waitForElement(selector, callback) {
  const observer = new MutationObserver((mutations) => {
    const element = document.querySelector(selector);
    if (element && currentTitle != element.textContent) {
      callback(element);
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getVideoDetails") {
    waitForElement(
      "h1.style-scope.ytd-watch-metadata yt-formatted-string",
      (element) => {
        const title = element.textContent;
        currentTitle = title;
        // handle descirption later
        let description = "";
        sendResponse({ title, description });
      }
    );
    return true;
  }
});

function insertEvaluationContainer(rating, context) {
  // Find the 'above-the-fold' container
  const aboveTheFoldDiv = document.getElementById("above-the-fold");
  if (aboveTheFoldDiv) {
    // Find the 'title' element
    const titleDiv = aboveTheFoldDiv.querySelector("#title");
    if (titleDiv) {
      // Create a new div element for your evaluation message
      const evaluationDiv = document.createElement("div");
      evaluationDiv.id = "evaluation-container";
      evaluationDiv.textContent = `${context}`;
      // Style your evaluation div as needed
      evaluationDiv.style.padding = "10px";
      evaluationDiv.style.marginBottom = "10px"; // Add space below the container
      evaluationDiv.style.backgroundColor = "#FFEBEE"; // Example styling with a light red background color
      evaluationDiv.style.borderRadius = "4px"; // Rounded corners
      evaluationDiv.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)"; // Optional shadow for better visibility
      evaluationDiv.style.color = "black";

      switch (rating) {
        case "relevant":
          evaluationDiv.style.backgroundColor = "#B9F6CA"; // Light green
          break;
        case "not_sure":
          evaluationDiv.style.backgroundColor = "#FFF9C4"; // Light yellow
          break;
        case "irrelevant":
          evaluationDiv.style.backgroundColor = "#FFD7B5"; // Light orange
          break;
        case "avoid":
          evaluationDiv.style.backgroundColor = "#FFCDD2"; // Light red
          break;
        default:
          evaluationDiv.style.backgroundColor = "#FFFFFF"; // Default to white or another neutral color
      }
      // Insert the new div before the title div
      aboveTheFoldDiv.insertBefore(evaluationDiv, titleDiv);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "displayEvaluation") {
    const { rating, context } = request.evaluation;
    insertEvaluationContainer(rating, context);
  }
  // ... other message handling ...
});

function removeEvaluationContainer() {
  const evaluationContainer = document.getElementById("evaluation-container");
  if (evaluationContainer) {
    evaluationContainer.remove();
  }
}

// This function sets up an observer to watch for URL changes within the page
function setupNavigationObserver() {
  const targetNode = document.body; // The body tag is always present, so it's a reliable target

  // Observer configuration
  const config = { childList: true, subtree: true };

  // Callback to execute when mutations are observed
  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        // If the URL has changed, remove the evaluation container
        if (window.location.href !== lastKnownLocation) {
          removeEvaluationContainer();
          lastKnownLocation = window.location.href; // Update the last known location
        }
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for the configured mutations
  observer.observe(targetNode, config);
}

// Variable to keep track of the last known URL
let lastKnownLocation = window.location.href;

// Call the observer setup function when the content script is first injected
setupNavigationObserver();

chrome.runtime.sendMessage({ message: "contentScriptReady" });
