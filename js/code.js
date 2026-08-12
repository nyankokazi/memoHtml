
const STORAGE_KEY_MEMOS = "memo_app_memos";
const STORAGE_KEY_GENRES = "memo_app_genres";
const STORAGE_KEY_THEME = "memo_app_theme";

let genres = ["人物", "物品", "現象", "その他"];
let memos = [];
let currentFilter = "ALL";

const sectionList = document.getElementById("sectionList");
const genreFilter = document.getElementById("genreFilter");

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY_MEMOS, JSON.stringify(memos));
    localStorage.setItem(STORAGE_KEY_GENRES, JSON.stringify(genres));
}

function loadFromLocalStorage() {
    const savedGenres = localStorage.getItem(STORAGE_KEY_GENRES);
    if (savedGenres) {
        try {
            genres = JSON.parse(savedGenres);
        } catch (e) {
            console.error("Failed to parse genres from localStorage", e);
        }
    }

    const savedMemos = localStorage.getItem(STORAGE_KEY_MEMOS);
    if (savedMemos) {
        try {
            memos = JSON.parse(savedMemos);
        } catch (e) {
            console.error("Failed to parse memos from localStorage", e);
        }
    }
}

function getFormattedTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function updateGenreFilterOptions() {
    const prevValue = genreFilter.value;
    genreFilter.innerHTML = '<option value="ALL">すべて表示</option>';
    genres.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        genreFilter.appendChild(opt);
    });
    if (genres.includes(prevValue) || prevValue === "ALL") {
        genreFilter.value = prevValue;
    } else {
        genreFilter.value = "ALL";
        currentFilter = "ALL";
    }
}

function render() {
    sectionList.innerHTML = "";

    const filteredMemos = memos.filter((m) => {
        if (currentFilter === "ALL") return true;
        return m.genre === currentFilter;
    });

    if (filteredMemos.length === 0) {
        sectionList.innerHTML =
            '<div class="empty-message">該当するメモがありません。</div>';
        return;
    }

    filteredMemos.forEach((memo) => {
        const realIndex = memos.findIndex((m) => m.id === memo.id);
        const li = createMemoElement(memo, realIndex);
        sectionList.appendChild(li);
    });
}

function createMemoElement(memo, index) {
    const li = document.createElement("li");
    li.className = `section-item ${memo.isOpen ? "open" : ""}`;

    // 開いている場合はドラッグ無効化
    li.draggable = !memo.isOpen;
    li.dataset.index = index;

    const displayTitle =
        memo.title.trim() !== "" ? memo.title : `${memo.genre} メモ`;
    const previewText = memo.isOpen
        ? ""
        : memo.content.replace(/[\r\n]+/g, " ");

    let genreOptions = genres
        .map(
            (g) =>
                `<option value="${escapeHtml(g)}" ${memo.genre === g ? "selected" : ""}>${escapeHtml(g)}</option>`,
        )
        .join("");

    if (!genres.includes(memo.genre)) {
        genreOptions =
            `<option value="${escapeHtml(memo.genre)}" selected>${escapeHtml(memo.genre)}</option>` +
            genreOptions;
    }

    li.innerHTML = `
      <div class="section-header">
        <span class="drag-handle ${memo.isOpen ? "disabled" : ""}"><span class="material-symbols-outlined">drag_indicator</span></span>
        <span class="genre-badge">${escapeHtml(memo.genre)}</span>
        <span class="title-display">${escapeHtml(displayTitle)}</span>
        ${!memo.isOpen ? `<span class="preview-text">${escapeHtml(previewText)}</span>` : ""}
        <div class="header-actions">
          <button class="icon-btn export-item-btn" title="単体エクスポート">
            <span class="material-symbols-outlined">upload</span>
          </button>
          <button class="icon-btn import-item-btn" title="単体インポート(置換)">
            <span class="material-symbols-outlined">download</span>
          </button>
          <button class="icon-btn header-delete-btn" title="削除">
            <span class="material-symbols-outlined">delete</span>
          </button>
          <input type="file" class="import-item-input" accept=".json" style="display: none;" />
          <span class="material-symbols-outlined toggle-icon">expand_more</span>
        </div>
      </div>

      <div class="section-content">
        <div class="form-group">
          <label>ジャンル</label>
          <select class="select-field genre-select" style="width: 100%;">
            ${genreOptions}
          </select>
          <div class="genre-custom-container custom-genre-wrapper" style="display: none;">
            <input type="text" class="input-field custom-genre-input" placeholder="新しいジャンル名を入力" />
            <button class="btn add-custom-genre-btn">追加</button>
          </div>
        </div>

        <div class="form-group">
          <label>タイトル</label>
          <input type="text" class="input-field title-input" placeholder="新しいメモ" value="${escapeHtml(memo.title)}">
        </div>

        <div class="toolbar">
          <label>本文</label>
          <div class="toggle-container">
            <input type="checkbox" id="mdToggle-${memo.id}" class="md-toggle" ${memo.isMd ? "checked" : ""}>
            <label for="mdToggle-${memo.id}">Markdown表示</label>
          </div>
        </div>

        ${!memo.isMd
            ? `
          <div class="md-guide-bar">
            <button class="md-guide-btn" data-prefix="# " data-block="true">H1</button>
            <button class="md-guide-btn" data-prefix="## " data-block="true">H2</button>
            <button class="md-guide-btn" data-prefix="### " data-block="true">H3</button>
            <button class="md-guide-btn" data-wrapper="**"><span class="material-symbols-outlined icon-small">format_bold</span></button>
            <button class="md-guide-btn" data-wrapper="*"><span class="material-symbols-outlined icon-small">format_italic</span></button>
            <button class="md-guide-btn" data-prefix="- " data-block="true"><span class="material-symbols-outlined icon-small">format_list_bulleted</span></button>
            <button class="md-guide-btn" data-prefix="> " data-block="true"><span class="material-symbols-outlined icon-small">format_quote</span></button>
            <button class="md-guide-btn" data-wrapper="\`"><span class="material-symbols-outlined icon-small">code</span></button>
            <button class="md-guide-btn" data-link="true"><span class="material-symbols-outlined icon-small">link</span></button>
          </div>
        `
            : ""
        }

        <div class="form-group">
          ${memo.isMd
            ? `<div class="md-preview">${parseMarkdown(memo.content)}</div>`
            : `<textarea class="textarea-field content-input">${escapeHtml(memo.content)}</textarea>`
        }
        </div>
      </div>
    `;

    if (!memo.isOpen) {
        addDragAndDropEvents(li);
    }

    const header = li.querySelector(".section-header");
    header.addEventListener("click", (e) => {
        if (
            e.target.closest(".drag-handle") ||
            e.target.closest(".header-actions button") ||
            e.target.closest(".import-item-input")
        ) {
            return;
        }
        memo.isOpen = !memo.isOpen;
        saveToLocalStorage();
        render();
    });

    const genreSelect = li.querySelector(".genre-select");
    const customWrapper = li.querySelector(".custom-genre-wrapper");
    const customInput = li.querySelector(".custom-genre-input");
    const addCustomBtn = li.querySelector(".add-custom-genre-btn");

    const checkCustomGenreVisiblity = () => {
        if (genreSelect.value === "その他") {
            customWrapper.style.display = "flex";
        } else {
            customWrapper.style.display = "none";
        }
    };

    genreSelect.addEventListener("change", (e) => {
        if (e.target.value === "その他") {
            checkCustomGenreVisiblity();
        } else {
            memo.genre = e.target.value;
            checkCustomGenreVisiblity();
            li.querySelector(".genre-badge").textContent = memo.genre;
            saveToLocalStorage();
        }
    });

    addCustomBtn.addEventListener("click", () => {
        const val = customInput.value.trim();
        if (!val) return;

        if (genres.some((g) => g.toLowerCase() === val.toLowerCase())) {
            alert("同名のジャンルが既に存在します。");
            return;
        }

        const otherIdx = genres.indexOf("その他");
        if (otherIdx !== -1) {
            genres.splice(otherIdx, 0, val);
        } else {
            genres.push(val);
        }

        memo.genre = val;
        saveToLocalStorage();
        updateGenreFilterOptions();
        render();
    });

    const exportItemBtn = li.querySelector(".export-item-btn");
    exportItemBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadJson(memo, `${getFormattedTimestamp()}.json`);
    });

    const importItemBtn = li.querySelector(".import-item-btn");
    const importItemInput = li.querySelector(".import-item-input");
    importItemBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        importItemInput.click();
    });

    importItemInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (importedData && typeof importedData === "object") {
                    memos[index] = { ...importedData, id: memo.id };
                    if (
                        importedData.genre &&
                        !genres.includes(importedData.genre)
                    ) {
                        genres.unshift(importedData.genre);
                    }
                    saveToLocalStorage();
                    updateGenreFilterOptions();
                    render();
                }
            } catch (err) {
                alert("JSONファイルの形式が不正です。");
            }
        };
        reader.readAsText(file);
    });

    const headerDeleteBtn = li.querySelector(".header-delete-btn");
    headerDeleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteMemo(memo.id);
    });

    const titleInput = li.querySelector(".title-input");
    titleInput.addEventListener("input", (e) => {
        memo.title = e.target.value;
        const updatedTitle =
            memo.title.trim() !== "" ? memo.title : `${memo.genre} メモ`;
        li.querySelector(".title-display").textContent = updatedTitle;
        saveToLocalStorage();
    });

    if (!memo.isMd) {
        const contentInput = li.querySelector(".content-input");
        contentInput.addEventListener("input", (e) => {
            memo.content = e.target.value;
            saveToLocalStorage();
        });

        const guideBtns = li.querySelectorAll(".md-guide-btn");
        guideBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const start = contentInput.selectionStart;
                const end = contentInput.selectionEnd;
                const text = contentInput.value;
                const selected = text.substring(start, end);

                let inserted = "";
                const isBlock = btn.dataset.block === "true";

                const hasTextBefore =
                    start > 0 && text.charAt(start - 1) !== "\n";
                const prefixStr = btn.dataset.prefix || "";

                const prefix = (isBlock && hasTextBefore ? "\n" : "") + prefixStr;

                if (btn.dataset.prefix) {
                    inserted = `${prefix}${selected}`;
                } else if (btn.dataset.wrapper) {
                    const w = btn.dataset.wrapper;
                    inserted = `${w}${selected}${w}`;
                } else if (btn.dataset.link) {
                    inserted = `[${selected}](url)`;
                }

                contentInput.value =
                    text.substring(0, start) + inserted + text.substring(end);
                memo.content = contentInput.value;
                saveToLocalStorage();
                contentInput.focus();
            });
        });
    }

    const mdToggle = li.querySelector(".md-toggle");
    mdToggle.addEventListener("change", (e) => {
        memo.isMd = e.target.checked;
        saveToLocalStorage();
        render();
    });

    return li;
}

function deleteMemo(id) {
    memos = memos.filter((m) => m.id !== id);
    saveToLocalStorage();
    render();
}

genreFilter.addEventListener("change", (e) => {
    currentFilter = e.target.value;
    render();
});

document.getElementById("addMemoBtn").addEventListener("click", () => {
    const defaultGenre = genres.length > 0 ? genres[0] : "一般";
    memos.unshift({
        id: Date.now().toString(),
        title: "",
        genre: defaultGenre,
        content: "",
        isMd: false,
        isOpen: true,
    });
    saveToLocalStorage();
    render();
});

document.getElementById("exportAllBtn").addEventListener("click", () => {
    downloadJson(memos, `${getFormattedTimestamp()}.json`);
});

const importAllBtn = document.getElementById("importAllBtn");
const importAllInput = document.getElementById("importAllInput");

importAllBtn.addEventListener("click", () => {
    importAllInput.click();
});

importAllInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                memos = importedData;
                importedData.forEach((m) => {
                    if (m.genre && !genres.includes(m.genre)) {
                        genres.unshift(m.genre);
                    }
                });
                saveToLocalStorage();
                updateGenreFilterOptions();
                render();
            } else {
                alert("配列形式のJSONファイルを指定してください。");
            }
        } catch (err) {
            alert("JSONファイルの解析に失敗しました。");
        }
    };
    reader.readAsText(file);
});

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
    themeText.textContent =
        theme === "dark" ? "ライトモード" : "ダークモード";
    localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || "light";
    setTheme(savedTheme);
}

themeToggleBtn.addEventListener("click", () => {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
});

const genreModal = document.getElementById("genreModal");
const manageGenresBtn = document.getElementById("manageGenresBtn");
const closeGenreModalBtn = document.getElementById("closeGenreModalBtn");
const genreManageList = document.getElementById("genreManageList");
const newGenreModalInput = document.getElementById("newGenreModalInput");
const addGenreModalBtn = document.getElementById("addGenreModalBtn");

function renderGenreManageList() {
    genreManageList.innerHTML = "";
    genres.forEach((g, idx) => {
        const li = document.createElement("li");
        li.className = "genre-manage-item";

        const isUsed = memos.some((m) => m.genre === g);
        const isOther = g === "その他";
        const isDisabled = isOther || isUsed;

        let noteText = "";
        if (isOther) noteText = " (固定)";
        else if (isUsed) noteText = " (使用中)";

        li.innerHTML = `
            <span>${escapeHtml(g)} <small class="genre-in-use">${noteText}</small></span>
            <button class="icon-btn delete-genre-btn" ${isDisabled ? "disabled style='opacity:0.3;cursor:not-allowed;'" : ""}>
              <span class="material-symbols-outlined">delete</span>
            </button>
          `;

        const delBtn = li.querySelector(".delete-genre-btn");
        if (!isDisabled) {
            delBtn.addEventListener("click", () => {
                genres.splice(idx, 1);
                saveToLocalStorage();
                updateGenreFilterOptions();
                renderGenreManageList();
                render();
            });
        }
        genreManageList.appendChild(li);
    });
}

manageGenresBtn.addEventListener("click", () => {
    renderGenreManageList();
    genreModal.classList.add("open");
});

closeGenreModalBtn.addEventListener("click", () => {
    genreModal.classList.remove("open");
});

addGenreModalBtn.addEventListener("click", () => {
    const val = newGenreModalInput.value.trim();
    if (!val) return;

    if (genres.some((g) => g.toLowerCase() === val.toLowerCase())) {
        alert("同名のジャンルが既に存在します。");
        return;
    }

    const otherIdx = genres.indexOf("その他");
    if (otherIdx !== -1) {
        genres.splice(otherIdx, 0, val);
    } else {
        genres.push(val);
    }

    newGenreModalInput.value = "";
    saveToLocalStorage();
    updateGenreFilterOptions();
    renderGenreManageList();
    render();
});

let draggedIndex = null;
let dropInsertPosition = null;

function clearDragIndicators() {
    document.querySelectorAll(".section-item").forEach((el) => {
        el.classList.remove("drag-over-top", "drag-over-bottom");
    });
}

function addDragAndDropEvents(el) {
    el.addEventListener("dragstart", (e) => {
        draggedIndex = parseInt(el.dataset.index);
        el.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
    });

    el.addEventListener("dragend", () => {
        el.classList.remove("dragging");
        clearDragIndicators();
        draggedIndex = null;
        dropInsertPosition = null;
    });

    el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        const targetIndex = parseInt(el.dataset.index);
        if (draggedIndex === null || draggedIndex === targetIndex) {
            clearDragIndicators();
            return;
        }

        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        clearDragIndicators();
        if (e.clientY < midY) {
            el.classList.add("drag-over-top");
            dropInsertPosition = "top";
        } else {
            el.classList.add("drag-over-bottom");
            dropInsertPosition = "bottom";
        }
    });

    el.addEventListener("dragleave", () => {
        el.classList.remove("drag-over-top", "drag-over-bottom");
    });

    el.addEventListener("drop", (e) => {
        e.preventDefault();
        clearDragIndicators();

        const targetIndex = parseInt(el.dataset.index);
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        let insertIndex = targetIndex;
        if (dropInsertPosition === "bottom") {
            insertIndex = targetIndex + 1;
        }

        if (draggedIndex < insertIndex) {
            insertIndex--;
        }

        const movedItem = memos.splice(draggedIndex, 1)[0];
        memos.splice(insertIndex, 0, movedItem);
        saveToLocalStorage();
        render();
    });
}

function parseMarkdown(text) {
    if (!text) return "<em>(内容がありません)</em>";
    let html = escapeHtml(text)
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$2</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*)\*\*/gim, "<b>$1</b>")
        .replace(/\*(.*)\*/gim, "<i>$1</i>")
        .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
        .replace(/^\- (.*$)/gim, "<ul><li>$1</li></ul>")
        .replace(/`([^`]+)`/gim, "<code>$1</code>")
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/gim,
            '<a href="$2" target="_blank">$1</a>',
        )
        .replace(/\n/g, "<br>");

    return html.replace(/<\/ul><br><ul>/g, "");
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

initTheme();
loadFromLocalStorage();
updateGenreFilterOptions();
render();

