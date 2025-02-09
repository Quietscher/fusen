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
    note.style.width = `${data.width || 200}px`;
    note.style.height = `${data.height || 150}px`;
    note.innerHTML = getHTML(data.text);
    document.body.appendChild(note);

    let offsetX,
      offsetY,
      isDragging = false;

    note.addEventListener("mousedown", (e) => {
      if (isNearResizeHandle(e)) return;
      if (e.target !== note) return;
      console.log("dragging");
      isDragging = true;
      offsetX = e.clientX - note.offsetLeft;
      offsetY = e.clientY - note.offsetTop;
    });

    let isResizing = false;
    let initialWidth, initialHeight, initialX, initialY;

    note.addEventListener("mousedown", (e) => {
      if (!isNearResizeHandle(e)) return;
      console.log("resizing");

      isResizing = true;
      initialWidth = note.offsetWidth;
      initialHeight = note.offsetHeight;
      initialX = e.clientX;
      initialY = e.clientY;
      document.addEventListener("mousemove", handleResize);
    });

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        saveNotes();
        isResizing = false;
        document.removeEventListener("mousemove", handleResize);
      }
    });

    function isNearResizeHandle(e) {
      const note = e.target;
      const resizeAreaSize = 12; // Size of the resize handle
      const resizeAreaBuffer = 8; // Buffer area for detecting mouse near the corner

      const noteRect = note.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Check if the mouse is within the bottom-right resize area
      return (
        mouseX >= noteRect.right - resizeAreaSize - resizeAreaBuffer &&
        mouseY >= noteRect.bottom - resizeAreaSize - resizeAreaBuffer
      );
    }

    function handleResize(e) {
      const dx = e.clientX - initialX;
      const dy = e.clientY - initialY;
      note.style.width = `${initialWidth + dx}px`;
      note.style.height = `${initialHeight + dy}px`;
    }

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
      .replace(/<\/div>/g, "\n")
      .replace(/<br\s*\/?>/g, "\n");
  }

  function convertTextToHtml(text) {
    return text
      .replace(/\n$/, "")
      .replace(/\n/g, "<br>")
      .replace(/^(.*)$/gm, "<div>$1</div>");
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
      width: note.offsetWidth,
      height: note.offsetHeight,
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
