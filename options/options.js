// Save options to chrome.storage
function saveOptions() {
  var apiKey = document.getElementById("apiKey").value;
  const hideRecommendations = document.getElementById(
    "hideRecommendations"
  ).checked;

  chrome.storage.sync.set(
    {
      openAIKey: apiKey,
      hideRecommendations: hideRecommendations,
    },
    function () {
      // Update status to let user know options were saved.
      console.log("Options saved.");
    }
  );
}

function simpleMarkdownParser(markdownText) {
  // Replace bold markdown with strong HTML tags
  let htmlText = markdownText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Simple list parsing
  htmlText = htmlText
    .replace(/^\s*\n\*\s/gm, "<ul>\n<li>")
    .replace(/^(\s*\*\s)/gm, "</li>\n<li>")
    .concat("</li>\n</ul>");
  // Fix for the added <ul> at every new line starting with *
  htmlText = htmlText.replace(/<\/li>\n<\/ul>(\n<ul>)/g, "</li>\n");

  // Replace consecutive newline characters with a single paragraph break
  htmlText = htmlText.replace(/\n\n/g, "<p></p>");

  // Convert single newlines to <br> for better formatting
  htmlText = htmlText.replace(/\n/g, "<br>");

  return htmlText;
}

function populateDaySelect(data) {
  const executionPlan = JSON.parse(data); // Assuming the plan content is stored as a JSON string
  const selectElement = document.getElementById("daySelect");

  Object.keys(executionPlan).forEach((day) => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day.replace("_", " ").toUpperCase(); // Format the day, e.g., "Day 1"
    selectElement.appendChild(option);
  });
}

function setDayPlan() {
  const selectedDay = document.getElementById("daySelect").value;
  chrome.storage.sync.get("execution", function (data) {
    const plan = JSON.parse(data.execution);
    const dayPlan = plan[selectedDay];

    chrome.storage.sync.set({ currentDayPlan: dayPlan }, function () {
      document.getElementById("rule").innerHTML = dayPlan.allowed_catagory;
      document.getElementById("actionItem").innerHTML = dayPlan.personal_goal;
      document.getElementById("limit").innerHTML = dayPlan.daily_limit;
      console.log("Day plan saved:", dayPlan);
    });
  });
}

function clearPlan() {
  chrome.storage.sync.set(
    {
      plan: "",
      execution: "",
    },
    function () {
      // Update status to let user know options were saved.
      console.log("Plan cleared.");
    }
  );
}

function getPlan() {
  var button = document.getElementById("getPlan");
  // Disable the button and change the text to indicate loading
  button.disabled = true;
  button.textContent = "Developing you customized Plan...";

  // Capture user input
  var personalGoal = document.getElementById("personal").value;
  var addictionGoal = document.getElementById("addiction").value;

  chrome.storage.sync.set(
    {
      personalGoal: personalGoal,
      addictionGoal: addictionGoal,
    },
    function () {
      // Update status to let user know options were saved.
      console.log("Input saved.");
    }
  );

  // Prepare the data to send
  var data = {
    personal_goal: personalGoal,
    addiction_goal: addictionGoal,
  };

  console.warn(JSON.stringify(data));

  // Set up the request options, including headers and body
  var requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  // The URL of the endpoint
  var endpointUrl = "http://localhost:8000/data/";

  // Send the request to the endpoint
  fetch(endpointUrl, requestOptions)
    .then((response) => response.json()) // Assuming the response is in JSON format
    .then((result) => {
      // Assuming the response JSON structure matches the provided example,
      // and you want to display the content of both "result" and "plan"

      // Display the "content" from "result"
      const resultContent = result.result.content;
      // If you have a specific element where you want to display this content
      const htmlContent = simpleMarkdownParser(resultContent);
      document.getElementById("resultDisplayArea").innerHTML = htmlContent;

      // Optionally, display the "content" from "plan" if needed
      // const planContent = JSON.parse(result.plan.content);
      // document.getElementById('planDisplayArea').innerHTML = planContent;
      populateDaySelect(result.plan.content);
      button.disabled = false;
      button.textContent = "Get Plan";
      chrome.storage.sync.set(
        {
          plan: resultContent,
          execution: result.plan.content,
        },
        function () {
          // Update status to let user know options were saved.
          console.log("Plan saved.");
        }
      );
    })
    .catch((error) => {
      console.error("Error:", error);
      // Optionally handle the error, such as displaying a message to the user
    });
}

// Restores options state using the preferences stored in chrome.storage
function restoreOptions() {
  chrome.storage.sync.get(
    {
      openAIKey: "",
      personalGoal: "",
      addictionGoal: "",
      hideRecommendations: false,
      plan: "",
      execution: "",
    },
    function (items) {
      document.getElementById("apiKey").value = items.openAIKey;
      document.getElementById("personal").value = items.personalGoal;
      document.getElementById("addiction").value = items.addictionGoal;
      document.getElementById("hideRecommendations").checked =
        items.hideRecommendations;
      const htmlContent = simpleMarkdownParser(items.plan);
      document.getElementById("resultDisplayArea").innerHTML = htmlContent;
      populateDaySelect(items.execution);
    }
  );
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("getPlan").addEventListener("click", getPlan);
document.getElementById("clearPlan").addEventListener("click", clearPlan);
document.getElementById("setDayPlan").addEventListener("click", setDayPlan);
