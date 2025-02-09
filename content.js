(async () => {
  let notes = [];
  let activeNote = null;
  const { marked } = await import(chrome.runtime.getURL("libs/marked.esm.js"));

  let mouseX = 100,
    mouseY = 100;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  let currentDomain = window.location.hostname;
  let currentPathname = window.location.pathname;

  chrome.runtime.sendMessage({ action: "loadNotes" }, (r) =>
    handleLoadNotes(r)
  );

  const handleLoadNotes = (response) => {
    notes.forEach((note) => note.remove());
    notes = [];
    if (response.notes) {
      console.log(response.notes);
      chrome.storage.local.get("matchPercentage", (result) => {
        const matchPercentage =
          result.matchPercentage !== undefined ? result.matchPercentage : 100;

        const notesN = response.notes || [];

        let filteredNotes = notesN.filter((note) => {
          const domainMatch = note.domain === currentDomain;
          const pathnameMatch = getMatchPercentage(
            note.pathname,
            currentPathname
          );
          console.log(domainMatch, pathnameMatch);
          if (matchPercentage === 0) {
            return domainMatch;
          } else {
            return domainMatch && pathnameMatch >= matchPercentage;
          }
        });

        const existingNoteIds = new Set(
          Array.from(notes).map((note) => note.dataset.id)
        );

        filteredNotes.forEach((note) => {
          if (!existingNoteIds.has(note.id)) {
            createNote(note);
          }
        });
      });
    }
  };

  function getMatchPercentage(storedPathname, currentPathname) {
    const minLength = Math.min(storedPathname.length, currentPathname.length);
    let matchCount = 0;

    for (let i = 0; i < minLength; i++) {
      if (storedPathname[i] === currentPathname[i]) {
        matchCount++;
      }
    }

    return (matchCount / storedPathname.length) * 100;
  }

  function createNote(data) {
    const note = document.createElement("div");
    note.classList.add("sticky-note");
    note.style.left = `${data.x}px`;
    note.style.top = `${data.y}px`;
    note.contentEditable = "true";
    note.textContent = data.text || "";
    note.dataset.id = data.id || crypto.randomUUID();
    note.dataset.rawText = data.text || "";
    note.style.width = `${data.width || 200}px`;
    note.style.height = `${data.height || 150}px`;
    note.innerHTML = getHTML(data.text || "");
    note.dataset.domain = data.domain || currentDomain;
    note.dataset.pathname = data.pathname || currentPathname;
    document.body.appendChild(note);

    let offsetX,
      offsetY,
      isDragging = false;

    note.addEventListener("mousedown", (e) => {
      if (isNearResizeHandle(e)) return;
      if (e.target !== note) return;
      isDragging = true;
      offsetX = e.clientX - note.offsetLeft;
      offsetY = e.clientY - note.offsetTop;
    });

    let isResizing = false;
    let initialWidth, initialHeight, initialX, initialY;

    note.addEventListener("mousedown", (e) => {
      if (!isNearResizeHandle(e)) return;

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
      const resizeAreaSize = 12;
      const resizeAreaBuffer = 8;

      const noteRect = note.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

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

    note.addEventListener("focus", () => {
      activeNote = note;
      note.innerHTML = convertTextToHtml(note.dataset.rawText);
    });

    note.addEventListener("blur", () => {
      activeNote = null;
      note.dataset.rawText = getTextWithLineBreaks(note);
      note.innerHTML = getHTML(note.dataset.rawText);
      saveNotes();
    });

    note.addEventListener("contextmenu", (e) => {
      e.preventDefault();
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
      domain: note.dataset.domain,
      pathname: note.dataset.pathname,
    }));
    chrome.runtime.sendMessage({ action: "saveNotes", notes: noteData });
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "y") {
        e.preventDefault();
        createNote({ x: mouseX - 100, y: mouseY - 10 });
        saveNotes();
      }
    }

    if (e.key === "Escape" && activeNote) {
      activeNote.blur();
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "x" && activeNote) {
        notes = notes.filter(
          (note) => note.dataset.id !== activeNote.dataset.id
        );
        activeNote.remove();
        saveNotes();
      }
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "addNote") {
        console.log("addNote");
        
      createNote({ text: "New Note", x: 100, y: 100 });
      saveNotes();
    }
  });

  const handlePageChange = (event) => {
    currentPathname = window.location.pathname;
    chrome.runtime.sendMessage({ action: "loadNotes" }, (r) =>
      handleLoadNotes(r)
    );
  };

  navigation.addEventListener("navigate", () => {
    setTimeout(() => {
      handlePageChange();
    }, 500);
  });
})();
