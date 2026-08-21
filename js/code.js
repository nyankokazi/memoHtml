const STORAGE_KEY_MEMOS = "memo_app_memos";
const STORAGE_KEY_GENRES = "memo_app_genres";
const STORAGE_KEY_PEOPLE = "memo_app_people";
const STORAGE_KEY_THEME = "memo_app_theme";
const STORAGE_KEY_VIEW_MODE = "memo_app_view_mode";

const AUTO_CLOSE_EXCLUDE_TAGS = [
    "input",
    "img",
    "br",
    "hr",
    "meta",
    "link",
    "area",
    "base",
    "col",
    "embed",
    "param",
    "source",
    "track",
    "wbr",
];
const COMMON_HTML_TAGS = [
    "div",
    "span",
    "p",
    "a",
    "b",
    "i",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "h1",
    "h2",
    "h3",
    "button",
    "input",
    "img",
    "br",
    "hr",
];

let genres = ["人物", "物品", "現象", "その他"];
let people = []; // { id, name, avatar }
let memos = [];
let currentFilter = "ALL";
let viewMode = "list";

const sectionList = document.getElementById("sectionList");
const genreFilter = document.getElementById("genreFilter");
const viewModeToggleBtn = document.getElementById("viewModeToggleBtn");
const viewModeIcon = document.getElementById("viewModeIcon");

// DOMContentLoadedは削除または空にして構いません
document.addEventListener("DOMContentLoaded", () => {
    // 既存の処理があれば残しますが、コピーボタン処理は削除します
});

// コピーボタン付与処理を独立した関数として定義
function attachCopyButtons() {
    const codeBlocks = document.querySelectorAll("pre");

    codeBlocks.forEach((block) => {
        // 既にボタンが追加されている場合はスキップ
        if (block.querySelector(".copy-button")) return;

        const button = document.createElement("button");
        button.innerText = "Copy";
        button.className = "copy-button";

        button.addEventListener("click", async () => {
            const code = block.querySelector("code");
            const textToCopy = code ? code.innerText : block.innerText;

            try {
                await navigator.clipboard.writeText(textToCopy);
                button.innerText = "Copied!";
                setTimeout(() => {
                    button.innerText = "Copy";
                }, 2000);
            } catch (err) {
                console.error("コピーに失敗しました", err);
            }
        });

        block.appendChild(button);
    });
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY_MEMOS, JSON.stringify(memos));
    localStorage.setItem(STORAGE_KEY_GENRES, JSON.stringify(genres));
    localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode);
}

function loadFromLocalStorage() {
    const savedGenres = localStorage.getItem(STORAGE_KEY_GENRES);
    if (savedGenres) {
        try {
            genres = JSON.parse(savedGenres);
        } catch (e) { }
    }

    const savedPeople = localStorage.getItem(STORAGE_KEY_PEOPLE);
    if (savedPeople) {
        try {
            people = JSON.parse(savedPeople);
        } catch (e) { }
    }

    const savedMemos = localStorage.getItem(STORAGE_KEY_MEMOS);
    if (savedMemos) {
        try {
            memos = JSON.parse(savedMemos);
            memos.forEach((m) => {
                if (!m.memoType) m.memoType = "markdown";
                if (m.memoType === "timeline" && !Array.isArray(m.timelineData)) {
                    m.timelineData = [];
                }
            });
        } catch (e) { }
    }

    const savedViewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
    if (savedViewMode) {
        viewMode = savedViewMode;
    }
}

function getFormattedTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function getCurrentDateTimeLocal() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplayTime(dateStr) {
    if (!dateStr) return "日時不明確";
    const parts = dateStr.split("T");
    if (parts.length === 2) {
        return `${parts[0]}<br>${parts[1]}`;
    }
    return dateStr.replace("T", "<br>");
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

function updateViewModeUI() {
    if (viewMode === "gallery") {
        sectionList.classList.add("gallery-view");
        viewModeIcon.textContent = "view_list";
        viewModeToggleBtn.title = "リスト表示に切り替え";
    } else {
        sectionList.classList.remove("gallery-view");
        viewModeIcon.textContent = "grid_view";
        viewModeToggleBtn.title = "ギャラリー表示に切り替え";
    }
}

function render() {
    updateViewModeUI();
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

    if (typeof hljs !== "undefined") {
        hljs.highlightAll();
        if (typeof hljs !== "undefined") {
            hljs.highlightAll();
        }

        // ここに追加: 描画後にコピーボタンを付与する
        attachCopyButtons();
    }
}

function getMemoTypeLabel(type) {
    switch (type) {
        case "html":
            return "HTML";
        case "timeline":
            return "時系列";
        default:
            return "MD";
    }
}

function renderPreviewContent(targetEl, memo) {
    if (!targetEl) return;
    if (memo.memoType === "html") {
        updateHtmlPreview(targetEl, memo.content);
    } else if (memo.memoType === "timeline") {
        if (!memo.timelineData || memo.timelineData.length === 0) {
            targetEl.innerHTML = "<em>(出来事データがありません)</em>";
            return;
        }
        let html = '<div class="timeline-container">';
        memo.timelineData.forEach((item) => {
            const person = people.find((p) => p.id === item.personId);
            const personName = person ? escapeHtml(person.name) : "人物名なし";
            const subtitleText =
                item.subtitle && item.subtitle.trim() !== ""
                    ? escapeHtml(item.subtitle)
                    : "サブタイトルなし";
            const detailText =
                item.detail && item.detail.trim() !== ""
                    ? escapeHtml(item.detail)
                    : "";
            const timeDisplay =
                item.timeMode === "uncertain"
                    ? "日時不明確"
                    : formatDisplayTime(item.time);

            html += `
              <div class="timeline-item">
                <div class="timeline-header-row">
                  ${person ? `<img src="${person.avatar}" class="timeline-avatar">` : ""}
                  <span class="timeline-person-name">${personName}</span>
                  <span class="timeline-subtitle">[${subtitleText}]</span>
                  <span class="timeline-time">${timeDisplay}</span>
                </div>
                ${detailText ? `<div class="timeline-content">${detailText.replace(/\n/g, "<br>")}</div>` : ""}
              </div>
            `;
        });
        html += "</div>";
        targetEl.innerHTML = html;
    } else {
        targetEl.innerHTML = parseMarkdown(memo.content);
    }
}

function updateHtmlPreview(containerEl, htmlContent) {
    if (!containerEl) return;
    let shadow = containerEl.shadowRoot;
    if (!shadow) {
        shadow = containerEl.attachShadow({ mode: "open" });
    }
    const cleanHtml = sanitizeHtml(htmlContent);

    // すべての要素のCSSをブラウザデフォルトにリセットし、親からのスタイル継承を遮断
    const resetStyle = `
    <style>
      :host {
        display: block;
        overflow-x: auto;
        background-color: #ffffff !important;
        color: #000000 !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        padding: 12px;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        all: revert;
        box-sizing: border-box;
      }
    </style>
  `;
    shadow.innerHTML = resetStyle + cleanHtml;
}

function setupHtmlEditorSuggest(textarea, previewEl, memo) {
    const wrapper = textarea.parentElement;
    wrapper.classList.add("html-editor-wrapper");

    let suggestBox = wrapper.querySelector(".html-suggest-box");
    if (!suggestBox) {
        suggestBox = document.createElement("div");
        suggestBox.className = "html-suggest-box";
        wrapper.appendChild(suggestBox);
    }

    textarea.addEventListener("input", () => {
        memo.content = textarea.value;
        updateHtmlPreview(previewEl, memo.content);
        saveToLocalStorage();

        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const lastLt = textBefore.lastIndexOf("<");

        if (lastLt !== -1 && lastLt >= textBefore.lastIndexOf(">")) {
            const query = textBefore.substring(lastLt + 1).toLowerCase();
            const matches = COMMON_HTML_TAGS.filter((t) => t.startsWith(query));

            if (matches.length > 0 && query.length > 0) {
                suggestBox.innerHTML = matches
                    .map(
                        (m) =>
                            `<div class="html-suggest-item" data-tag="${m}">&lt;${m}&gt;</div>`,
                    )
                    .join("");
                suggestBox.style.display = "block";

                suggestBox
                    .querySelectorAll(".html-suggest-item")
                    .forEach((item) => {
                        item.addEventListener("click", () => {
                            const tag = item.dataset.tag;
                            const beforeTag = textBefore.substring(0, lastLt);
                            const afterTag = textarea.value.substring(cursorPos);

                            const isVoid = AUTO_CLOSE_EXCLUDE_TAGS.includes(tag);
                            const insertText = isVoid
                                ? `<${tag}>`
                                : `<${tag}></${tag}>`;

                            textarea.value = beforeTag + insertText + afterTag;
                            memo.content = textarea.value;
                            updateHtmlPreview(previewEl, memo.content);
                            saveToLocalStorage();

                            suggestBox.style.display = "none";
                            textarea.focus();
                            const newCursorPos = isVoid
                                ? beforeTag.length + insertText.length
                                : beforeTag.length + tag.length + 2;
                            textarea.setSelectionRange(newCursorPos, newCursorPos);
                        });
                    });
                return;
            }
        }
        suggestBox.style.display = "none";
    });
}

function createMemoElement(memo, index) {
    const li = document.createElement("li");
    li.className = `section-item ${memo.isOpen ? "open" : ""}`;
    li.draggable = !memo.isOpen;
    li.dataset.index = index;

    const displayTitle =
        memo.title.trim() !== "" ? memo.title : `${memo.genre} メモ`;

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

    const memoTypeOptions = `
          <option value="markdown" ${memo.memoType === "markdown" ? "selected" : ""}>マークダウン</option>
          <option value="html" ${memo.memoType === "html" ? "selected" : ""}>HTML</option>
          <option value="timeline" ${memo.memoType === "timeline" ? "selected" : ""}>時系列</option>
        `;

    li.innerHTML = `
      <div class="section-header">
        <div class="header-info-group">
          <span class="drag-handle ${memo.isOpen ? "disabled" : ""}"><span class="material-symbols-outlined">drag_indicator</span></span>
          <span class="genre-badge">${escapeHtml(memo.genre)}</span>
          <span class="type-badge">${getMemoTypeLabel(memo.memoType)}</span>
          <span class="title-display">${escapeHtml(displayTitle)}</span>
        </div>
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

      <div class="gallery-summary-preview"></div>

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

        <div class="form-group">
          <label>メモの種類</label>
          <select class="select-field memo-type-select" style="width: 100%;">
            ${memoTypeOptions}
          </select>
        </div>

        <div class="memo-editor-container"></div>
      </div>
    `;

    const summaryPreviewEl = li.querySelector(".gallery-summary-preview");
    renderPreviewContent(summaryPreviewEl, memo);

    const editorContainer = li.querySelector(".memo-editor-container");

    if (memo.memoType === "html") {
        editorContainer.innerHTML = `
            <div class="form-group">
              <label>HTML ソースコード</label>
              <textarea class="textarea-field html-content-input">${escapeHtml(memo.content)}</textarea>
            </div>
            <div class="form-group">
              <label>プレビュー</label>
              <div class="html-preview-area"></div>
            </div>
          `;

        const htmlInput = editorContainer.querySelector(
            ".html-content-input",
        );
        const htmlPreview =
            editorContainer.querySelector(".html-preview-area");
        updateHtmlPreview(htmlPreview, memo.content);
        setupHtmlEditorSuggest(htmlInput, htmlPreview, memo);
    } else if (memo.memoType === "timeline") {
        let personOptions =
            '<option value="">(人物名なし)</option>' +
            people
                .map(
                    (p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`,
                )
                .join("");

        editorContainer.innerHTML = `
            <div class="form-group">
              <label>出来事登録 (人物名 : サブタイトル : 日時) ＋ 出来事(詳細情報)</label>
              <div class="timeline-editor">
                <div class="timeline-input-row">
                  <select class="select-field tl-person-select" style="max-width:140px;" title="人物名">
                    ${personOptions}
                  </select>
                  <input type="text" class="input-field tl-subtitle-input" placeholder="サブタイトル" style="flex: 1; min-width:120px;">
                  <select class="select-field tl-timemode-select">
                    <option value="exact">日時指定</option>
                    <option value="uncertain">日時不明確</option>
                  </select>
                  <input type="datetime-local" class="input-field tl-time-input" style="max-width:200px;">
                </div>
                <textarea class="textarea-field tl-detail-input" placeholder="出来事（詳細情報）を入力" style="height: 60px;"></textarea>
                <div style="display:flex; justify-content:flex-end;">
                  <button class="btn add-tl-item-btn"><span class="material-symbols-outlined">add</span>出来事を追加</button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>時系列（ドラッグ＆ドロップで並び替え可能）</label>
              <div class="timeline-preview-area"></div>
            </div>
          `;

        const renderTimelineItems = () => {
            const previewArea = editorContainer.querySelector(
                ".timeline-preview-area",
            );
            if (!memo.timelineData || memo.timelineData.length === 0) {
                previewArea.innerHTML = "<em>出来事が登録されていません。</em>";
                return;
            }

            let html = '<div class="timeline-container">';
            memo.timelineData.forEach((item, idx) => {
                const person = people.find((p) => p.id === item.personId);
                const personName = person
                    ? escapeHtml(person.name)
                    : "人物名なし";
                const subtitleText =
                    item.subtitle && item.subtitle.trim() !== ""
                        ? escapeHtml(item.subtitle)
                        : "サブタイトルなし";
                const detailText =
                    item.detail && item.detail.trim() !== ""
                        ? escapeHtml(item.detail)
                        : "";
                const timeDisplay =
                    item.timeMode === "uncertain"
                        ? "日時不明確"
                        : formatDisplayTime(item.time);

                html += `
                <div class="timeline-item" draggable="true" data-tl-idx="${idx}">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="timeline-header-row">
                      <span class="drag-handle"><span class="material-symbols-outlined icon-small">drag_indicator</span></span>
                      ${person ? `<img src="${person.avatar}" class="timeline-avatar">` : ""}
                      <span class="timeline-person-name">${personName}</span>
                      <span class="timeline-subtitle">[${subtitleText}]</span>
                      <span class="timeline-time">${timeDisplay}</span>
                    </div>
                    <button class="icon-btn delete-tl-item-btn" data-tl-idx="${idx}" title="削除">
                      <span class="material-symbols-outlined icon-small">delete</span>
                    </button>
                  </div>
                  ${detailText ? `<div class="timeline-content">${escapeHtml(detailText).replace(/\n/g, "<br>")}</div>` : ""}
                </div>
              `;
            });
            html += "</div>";
            previewArea.innerHTML = html;

            previewArea
                .querySelectorAll(".delete-tl-item-btn")
                .forEach((btn) => {
                    btn.addEventListener("click", (e) => {
                        const targetIdx = parseInt(e.currentTarget.dataset.tlIdx);
                        memo.timelineData.splice(targetIdx, 1);
                        saveToLocalStorage();
                        renderTimelineItems();
                    });
                });

            let tlDraggedIdx = null;
            let tlDropInsertPos = null;

            const clearTlIndicators = () => {
                previewArea.querySelectorAll(".timeline-item").forEach((el) => {
                    el.classList.remove("drag-over-top", "drag-over-bottom");
                });
            };

            previewArea.querySelectorAll(".timeline-item").forEach((tlItem) => {
                tlItem.addEventListener("dragstart", (e) => {
                    tlDraggedIdx = parseInt(tlItem.dataset.tlIdx);
                    tlItem.classList.add("dragging");
                    e.dataTransfer.effectAllowed = "move";
                });

                tlItem.addEventListener("dragend", () => {
                    tlItem.classList.remove("dragging");
                    clearTlIndicators();
                    tlDraggedIdx = null;
                    tlDropInsertPos = null;
                });

                tlItem.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    const targetIdx = parseInt(tlItem.dataset.tlIdx);
                    if (tlDraggedIdx === null || tlDraggedIdx === targetIdx) {
                        clearTlIndicators();
                        return;
                    }

                    const rect = tlItem.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;

                    clearTlIndicators();
                    if (e.clientY < midY) {
                        tlItem.classList.add("drag-over-top");
                        tlDropInsertPos = "top";
                    } else {
                        tlItem.classList.add("drag-over-bottom");
                        tlDropInsertPos = "bottom";
                    }
                });

                tlItem.addEventListener("dragleave", () => {
                    tlItem.classList.remove("drag-over-top", "drag-over-bottom");
                });

                tlItem.addEventListener("drop", (e) => {
                    e.preventDefault();
                    clearTlIndicators();
                    const targetIdx = parseInt(tlItem.dataset.tlIdx);
                    if (tlDraggedIdx === null || tlDraggedIdx === targetIdx) return;

                    let insertIdx = targetIdx;
                    if (tlDropInsertPos === "bottom") {
                        insertIdx = targetIdx + 1;
                    }
                    if (tlDraggedIdx < insertIdx) {
                        insertIdx--;
                    }

                    const movedItem = memo.timelineData.splice(tlDraggedIdx, 1)[0];
                    memo.timelineData.splice(insertIdx, 0, movedItem);
                    saveToLocalStorage();
                    renderTimelineItems();
                });
            });
        };

        renderTimelineItems();

        const addTlBtn = editorContainer.querySelector(".add-tl-item-btn");
        const personSelect =
            editorContainer.querySelector(".tl-person-select");
        const subtitleInput =
            editorContainer.querySelector(".tl-subtitle-input");
        const timeModeSelect = editorContainer.querySelector(
            ".tl-timemode-select",
        );
        const timeInput = editorContainer.querySelector(".tl-time-input");
        const detailInput = editorContainer.querySelector(".tl-detail-input");

        timeInput.value = getCurrentDateTimeLocal();

        timeModeSelect.addEventListener("change", () => {
            if (timeModeSelect.value === "uncertain") {
                timeInput.style.display = "none";
            } else {
                timeInput.style.display = "inline-block";
            }
        });

        addTlBtn.addEventListener("click", () => {
            const timeMode = timeModeSelect.value;
            const timeVal = timeMode === "uncertain" ? "" : timeInput.value;
            const subtitleVal = subtitleInput.value.trim();
            const detailVal = detailInput.value.trim();
            const personId = personSelect.value;

            if (!Array.isArray(memo.timelineData)) memo.timelineData = [];
            memo.timelineData.push({
                personId: personId,
                subtitle: subtitleVal,
                timeMode: timeMode,
                time: timeVal,
                detail: detailVal,
            });

            saveToLocalStorage();

            subtitleInput.value = "";
            detailInput.value = "";
            timeInput.value = getCurrentDateTimeLocal();
            renderTimelineItems();
        });
    } else {
        editorContainer.innerHTML = `
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
                <button class="md-guide-btn" data-table="true"><span class="material-symbols-outlined icon-small">table_chart</span></button>
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
          `;

        if (!memo.isMd) {
            const contentInput =
                editorContainer.querySelector(".content-input");
            contentInput.addEventListener("input", (e) => {
                memo.content = e.target.value;
                saveToLocalStorage();
            });

            const guideBtns = editorContainer.querySelectorAll(".md-guide-btn");
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
                    const prefix =
                        (isBlock && hasTextBefore ? "\n" : "") + prefixStr;

                    if (btn.dataset.prefix) {
                        inserted = `${prefix}${selected}`;
                    } else if (btn.dataset.wrapper) {
                        const w = btn.dataset.wrapper;
                        inserted = `${w}${selected}${w}`;
                    } else if (btn.dataset.link) {
                        inserted = `[${selected}](url)`;
                    } else if (btn.dataset.table) {
                        inserted =
                            (hasTextBefore ? "\n" : "") +
                            "| ヘッダー1 | ヘッダー2 |\n| --- | --- |\n| 内容1 | 内容2 |";
                    }

                    contentInput.value =
                        text.substring(0, start) + inserted + text.substring(end);
                    memo.content = contentInput.value;
                    saveToLocalStorage();
                    contentInput.focus();
                });
            });
        }

        const mdToggle = editorContainer.querySelector(".md-toggle");
        mdToggle.addEventListener("change", (e) => {
            memo.isMd = e.target.checked;
            saveToLocalStorage();
            render();
        });
    }

    if (!memo.isOpen) {
        addDragAndDropEvents(li);
    }

    const handleToggleOpen = () => {
        const nextState = !memo.isOpen;

        if (viewMode === "gallery" && nextState) {
            memos.forEach((m) => {
                m.isOpen = false;
            });
        }

        memo.isOpen = nextState;
        saveToLocalStorage();
        render();

        if (nextState) {
            const targetEl = document.querySelector(`[data-index="${index}"]`);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    };

    const header = li.querySelector(".section-header");
    header.addEventListener("click", (e) => {
        if (
            e.target.closest(".drag-handle") ||
            e.target.closest(".header-actions button") ||
            e.target.closest(".import-item-input")
        ) {
            return;
        }
        handleToggleOpen();
    });

    const summaryPreview = li.querySelector(".gallery-summary-preview");
    summaryPreview.addEventListener("click", handleToggleOpen);

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

    const memoTypeSelect = li.querySelector(".memo-type-select");
    memoTypeSelect.addEventListener("change", (e) => {
        memo.memoType = e.target.value;
        memo.isMd = false;
        if (
            memo.memoType === "timeline" &&
            !Array.isArray(memo.timelineData)
        ) {
            memo.timelineData = [];
        }
        saveToLocalStorage();
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

viewModeToggleBtn.addEventListener("click", () => {
    viewMode = viewMode === "list" ? "gallery" : "list";

    if (viewMode === "gallery") {
        let openedIdx = memos.findIndex((m) => m.isOpen);
        memos.forEach((m, idx) => {
            m.isOpen = idx === openedIdx;
        });
    }

    saveToLocalStorage();
    render();
});

document.getElementById("addMemoBtn").addEventListener("click", () => {
    const defaultGenre = genres.length > 0 ? genres[0] : "一般";

    if (viewMode === "gallery") {
        memos.forEach((m) => {
            m.isOpen = false;
        });
    }

    memos.unshift({
        id: Date.now().toString(),
        title: "",
        genre: defaultGenre,
        memoType: "markdown",
        content: "",
        timelineData: [],
        isMd: false,
        isOpen: true,
    });
    saveToLocalStorage();
    render();
});

document.getElementById("exportAllBtn").addEventListener("click", () => {
    downloadJson(
        { memos, genres, people },
        `${getFormattedTimestamp()}.json`,
    );
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
            } else if (
                importedData &&
                typeof importedData === "object" &&
                Array.isArray(importedData.memos)
            ) {
                memos = importedData.memos;
                if (Array.isArray(importedData.genres))
                    genres = importedData.genres;
                if (Array.isArray(importedData.people))
                    people = importedData.people;
            }
            saveToLocalStorage();
            updateGenreFilterOptions();
            render();
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

// ジャンル管理モーダル制御
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

// 人物管理モーダル制御
const personModal = document.getElementById("personModal");
const managePeopleBtn = document.getElementById("managePeopleBtn");
const closePersonModalBtn = document.getElementById(
    "closePersonModalBtn",
);
const personManageList = document.getElementById("personManageList");
const newPersonNameInput = document.getElementById("newPersonNameInput");
const newPersonImgInput = document.getElementById("newPersonImgInput");
const personImgPreview = document.getElementById("personImgPreview");
const addPersonModalBtn = document.getElementById("addPersonModalBtn");

function clearPersonImgSelection() {
    newPersonImgInput.value = "";
    personImgPreview.style.display = "none";
    personImgPreview.src = "";
}

personImgPreview.addEventListener("click", clearPersonImgSelection);

function renderPersonManageList() {
    personManageList.innerHTML = "";
    people.forEach((p, idx) => {
        const li = document.createElement("li");
        li.className = "person-manage-item";
        li.innerHTML = `
            <div class="person-item-left">
              <img src="${p.avatar}" class="timeline-avatar" />
              <span>${escapeHtml(p.name)}</span>
            </div>
            <button class="icon-btn delete-person-btn">
              <span class="material-symbols-outlined">delete</span>
            </button>
          `;

        li.querySelector(".delete-person-btn").addEventListener(
            "click",
            () => {
                people.splice(idx, 1);
                saveToLocalStorage();
                renderPersonManageList();
                render();
            },
        );

        personManageList.appendChild(li);
    });
}

newPersonImgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            personImgPreview.src = evt.target.result;
            personImgPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        clearPersonImgSelection();
    }
});

const handleAddPerson = () => {
    const name = newPersonNameInput.value.trim();
    const file = newPersonImgInput.files[0];

    if (!name) {
        alert("人物名を入力してください。");
        return;
    }

    const processAddPerson = (avatarData) => {
        people.push({
            id: Date.now().toString(),
            name,
            avatar:
                avatarData ||
                "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23777'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
        });
        saveToLocalStorage();
        newPersonNameInput.value = "";
        clearPersonImgSelection();
        renderPersonManageList();
        render();
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => processAddPerson(e.target.result);
        reader.readAsDataURL(file);
    } else {
        processAddPerson(null);
    }
};

addPersonModalBtn.addEventListener("click", handleAddPerson);

newPersonNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        handleAddPerson();
    }
});

managePeopleBtn.addEventListener("click", () => {
    renderPersonManageList();
    personModal.classList.add("open");
});

closePersonModalBtn.addEventListener("click", () => {
    personModal.classList.remove("open");
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

    let html = escapeHtml(text);

    const codeBlocks = [];
    html = html.replace(
        /```(\w*)\n([\s\S]*?)```/gim,
        (match, lang, code) => {
            const langClass = lang ? `class="language-${lang.trim()}"` : "";
            codeBlocks.push(
                `<pre><code ${langClass}>${code.trim()}</code></pre>`,
            );
            return `__CODEBLOCK_${codeBlocks.length - 1}__`;
        },
    );

    // テーブル変換ロジックの拡張
    html = html.replace(/(?:(?:^|\n)\|[^\n]+\|\r?)+/g, (match) => {
        const lines = match.trim().split("\n");
        if (lines.length < 2) return match;

        // 1. 各行をセルデータに分割
        const matrix = lines.map((line) =>
            line
                .trim()
                .replace(/^\||\|$/g, "")
                .split("|")
                .map((cell) => cell.trim())
        );

        // 2. 2行目が区切り行（:---:, :---, ---: 等）かどうか判定し、アラインメントを取得
        let aligns = [];
        let hasSeparator = false;
        if (matrix.length > 1) {
            hasSeparator = matrix[1].every((cell) => /^:?-+:?$/.test(cell));
            if (hasSeparator) {
                aligns = matrix[1].map((cell) => {
                    const left = cell.startsWith(":");
                    const right = cell.endsWith(":");
                    if (left && right) return ' style="text-align: center;"';
                    if (right) return ' style="text-align: right;"';
                    if (left) return ' style="text-align: left;"';
                    return "";
                });
                // 区切り行を除去
                matrix.splice(1, 1);
            }
        }

        // 3. セルデータ構造の生成
        const grid = matrix.map((row) =>
            row.map((cell) => ({
                text: cell,
                rowspan: 1,
                colspan: 1,
                skip: false,
            }))
        );

        const rowCount = grid.length;

        // 4-1. 上方向への結合 (^) の解析処理
        for (let r = 0; r < rowCount; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c].text === "^" && r > 0) {
                    let targetR = r - 1;
                    while (targetR >= 0 && grid[targetR][c].skip) {
                        targetR--;
                    }
                    if (targetR >= 0) {
                        grid[targetR][c].rowspan += grid[r][c].rowspan;
                        grid[r][c].skip = true;
                    }
                }
            }
        }

        // 4-2. 左方向への結合 (<) の解析処理 (エスケープ文字を考慮)
        for (let r = 0; r < rowCount; r++) {
            for (let c = 1; c < grid[r].length; c++) {
                if (grid[r][c].text === "<" || grid[r][c].text === "&lt;") {
                    let targetC = c - 1;
                    while (targetC >= 0 && grid[r][targetC].skip) {
                        targetC--;
                    }
                    if (targetC >= 0) {
                        grid[r][targetC].colspan += grid[r][c].colspan;
                        grid[r][c].skip = true;
                    }
                }
            }
        }

        // 4-3. 右方向への結合 (>) の解析処理 (エスケープ文字を考慮)
        for (let r = 0; r < rowCount; r++) {
            for (let c = grid[r].length - 2; c >= 0; c--) {
                if (grid[r][c].text === ">" || grid[r][c].text === "&gt;") {
                    let targetC = c + 1;
                    while (targetC < grid[r].length && grid[r][targetC].skip) {
                        targetC++;
                    }
                    if (targetC < grid[r].length) {
                        grid[r][targetC].colspan += grid[r][c].colspan;
                        grid[r][c].skip = true;
                    }
                }
            }
        }

        // 5. HTML文字列の組み立て
        let tableHtml = "<table>";
        grid.forEach((row, rIdx) => {
            const tag = rIdx === 0 ? "th" : "td";
            tableHtml += "<tr>";
            row.forEach((cell, cIdx) => {
                if (cell.skip) return;

                const alignAttr = aligns[cIdx] || "";
                const rowspanAttr = cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : "";
                const colspanAttr = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : "";

                tableHtml += `<${tag}${alignAttr}${rowspanAttr}${colspanAttr}>${cell.text}</${tag}>`;
            });
            tableHtml += "</tr>";
        });
        tableHtml += "</table>";
        return tableHtml;
    });

    html = html
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
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

    codeBlocks.forEach((block, idx) => {
        html = html.replace(`__CODEBLOCK_${idx}__`, block);
    });

    return html.replace(/<\/ul><br><ul>/g, "");
}

function sanitizeHtml(str) {
    if (!str) return "<em>(内容がありません)</em>";
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/on\w+='[^']*'/gi, "");
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