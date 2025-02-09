(() => {
  const notes = [];

  // Load existing notes
  chrome.runtime.sendMessage({ action: "loadNotes" }, (response) => {
    if (response.notes) {
      response.notes.forEach(createNote);
    }
  });

  function createNote(data) {
    const note = document.createElement("div");
    note.classList.add("sticky-note");
    note.style.left = `${data.x}px`;
    note.style.top = `${data.y}px`;
    note.contentEditable = "true";
    note.textContent = data.text;
    document.body.appendChild(note);

    // Dragging
    let offsetX,
      offsetY,
      isDragging = false;

    note.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - note.offsetLeft;
      offsetY = e.clientY - note.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      note.style.left = `${e.clientX - offsetX}px`;
      note.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) saveNotes();
      isDragging = false;
    });

    // Save content changes
    note.addEventListener("input", saveNotes);

    // Right-click to delete
    note.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      note.remove();
      saveNotes();
    });

    notes.push(note);
  }

  function saveNotes() {
    const noteData = notes.map((note) => ({
      text: note.textContent,
      x: parseInt(note.style.left),
      y: parseInt(note.style.top),
    }));
    chrome.runtime.sendMessage({ action: "saveNotes", notes: noteData });
  }

  // Add a new note when clicking a button
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "addNote") {
      createNote({ text: "New Note", x: 100, y: 100 });
      saveNotes();
    }
  });
})();
