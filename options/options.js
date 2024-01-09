// Save options to chrome.storage
function saveOptions() {
  var goal = document.getElementById('goal').value;
  var apiKey = document.getElementById('apiKey').value;
  chrome.storage.sync.set({
      userGoal: goal,
      openAIKey: apiKey
  }, function() {
      // Update status to let user know options were saved.
      console.log('Options saved.');
  });
}

// Restores options state using the preferences stored in chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
      userGoal: '',
      openAIKey: ''
  }, function(items) {
      document.getElementById('goal').value = items.userGoal;
      document.getElementById('apiKey').value = items.openAIKey;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
