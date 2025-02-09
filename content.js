(async () => {
  let notes = [];
  const { marked } = await import(chrome.runtime.getURL("libs/marked.esm.js"));

  // Load existing notes
  chrome.runtime.sendMessage({ action: "loadNotes" }, (response) => {
    if (response.notes) {
      console.log(response.notes);
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
    note.dataset.id = data.id || crypto.randomUUID();
    note.dataset.rawText = data.text;
    note.innerHTML = getHTML(data.text);
    document.body.appendChild(note);

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

    // Show raw Markdown when clicking inside
    note.addEventListener("focus", () => {
      note.innerHTML = convertTextToHtml(note.dataset.rawText);
    });

    // Show formatted Markdown when clicking outside
    note.addEventListener("blur", () => {
      note.dataset.rawText = getTextWithLineBreaks(note);
      note.innerHTML = getHTML(note.dataset.rawText);
      saveNotes();
    });

    // Right-click to delete
    note.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      notes = notes.filter((note) => note.dataset.id !== e.target.dataset.id);
      note.remove();
      saveNotes();
    });

    notes.push(note);
  }

  function getTextWithLineBreaks(e) {
    return e.innerHTML
      .replace(/<div>/g, "") 
      .replace(/<\/div>(?=\s*<div>)/g, "\n")
      .replace(/<br\s*\/?>/g, "\n");
  }

  function convertTextToHtml(text) {
    return text.replace(/\n/g, "<br>").replace(/^(.*)$/gm, "<div>$1</div>");
  }

  function getHTML(text) {
    return marked.parse(text || "", {
      gfm: true,
      breaks: true,
    });
  }

  function saveNotes() {
    const noteData = notes.map((note) => ({
      ref: note,
      text: note.dataset.rawText,
      id: note.dataset.id,
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
