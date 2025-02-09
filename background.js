chrome.runtime.onInstalled.addListener(() => {
  console.log("Sticky Notes Extension Installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveNotes") {
    
    chrome.storage.local.set({ notes: message.notes }, () => {
      sendResponse({ status: "saved" });
    });
    return true;
  } else if (message.action === "loadNotes") {
    chrome.storage.local.get("notes", (data) => {
      sendResponse({ notes: data.notes || [] });
    });
    return true;
  }
});
