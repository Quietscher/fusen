document.getElementById("addNote").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "addNote" });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("matchPercentage", (result) => {
    const percentage = result.matchPercentage || 100;
    document.getElementById("percentage").value = percentage;
  });
});

document.getElementById("saveSettings").addEventListener("click", () => {
  const percentage = document.getElementById("percentage").value;
  chrome.storage.local.set(
    { matchPercentage: parseInt(percentage, 10) },
    () => {
      alert("Settings saved!");
    }
  );
});
