const SearchInp = document.getElementById("book-search");
const SearchBtn = document.querySelector(".search-button");
const Cards_Grid = document.getElementById("Cards_Grid");

// ================================
// Gemini API Key
// ================================

const GEMINI_API_KEY = "AQ.Ab8RN6JC73wr5oK-nkBxT4nLE4Nb8m7kEaxJO5rqRrOxlXvFxw";

// ================================
// Get Book
// ================================

async function GetBook(value) {
  // Loading State
  Cards_Grid.innerHTML = `
    <div class="loading-wrapper">

      <div class="skeleton-card">
        <div class="skeleton-img"></div>

        <div class="skeleton-info">
          <div class="skeleton-small"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-author"></div>
        </div>
      </div>

      <div class="skeleton-card">
        <div class="skeleton-img"></div>

        <div class="skeleton-info">
          <div class="skeleton-small"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-author"></div>
        </div>
      </div>

      <div class="skeleton-card">
        <div class="skeleton-img"></div>

        <div class="skeleton-info">
          <div class="skeleton-small"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-author"></div>
        </div>
      </div>

      <div class="skeleton-card">
        <div class="skeleton-img"></div>

        <div class="skeleton-info">
          <div class="skeleton-small"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-author"></div>
        </div>
      </div>

    </div>
  `;

  try {
    const API = `https://openlibrary.org/search.json?q=${encodeURIComponent(value)}`;

    const res = await fetch(API);

    if (!res.ok) {
      throw new Error("Failed to fetch books");
    }

    const data = await res.json();

    GetBookDetails(data);
  } catch (error) {
    console.log(error);

    Cards_Grid.innerHTML = `
      <div class="error">
        Something went wrong. Please try again.
      </div>
    `;
  }
}

// ================================
// Get Book Details
// ================================

function GetBookDetails(data) {
  const BooksArr = data.docs.slice(0, 10);

  // No Books Found
  if (BooksArr.length === 0) {
    Cards_Grid.innerHTML = `
      <div class="no-results">

        <div class="no-results-icon">
          ?
        </div>

        <h2>
          Nothing found.
        </h2>

        <p>
          We couldn't find any books matching your search.
        </p>

        <button
          class="clear-search"
          onclick="ClearSearch()"
        >
          CLEAR SEARCH
        </button>

      </div>
    `;

    return;
  }

  Cards_Grid.innerHTML = "";

  BooksArr.forEach(function (ele) {
    const ImgSrc = ele.cover_i
      ? `https://covers.openlibrary.org/b/id/${ele.cover_i}-L.jpg`
      : "images/no-book.png";

    Cards_Grid.innerHTML += `
      <div class="card">

        <div 
          class="img book-image"
          style="background-image: url('${ImgSrc}')"
          onclick='OpenBookDetails(${JSON.stringify(ele).replace(/'/g, "&#39;")}, "${ImgSrc}")'>
        </div>

        <div class="info">

          <h2>
            ${ele.title}
          </h2>

          <h3>
            ${ele.author_name ? ele.author_name[0] : "Unknown Author"}
          </h3>

        </div>

      </div>
    `;
  });
}

// ================================
// Get AI Book Description
// ================================

async function GetBookDescription(title, author) {
  try {
    const API =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

    const prompt = `
You are a professional book assistant.

Write a short and engaging description for this book.

Book title: ${title}
Author: ${author}

Rules:
- Write in English.
- Maximum 45 words.
- Keep it short because it must fit inside a small UI popup.
- Explain what the book is about.
- Make it interesting but simple.
- Do not use bullet points.
- Do not use headings.
- Do not mention AI.
- Do not add quotation marks.
- Return ONLY the description.
`;

    const res = await fetch(API, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);

      console.error("Gemini Error:", errorData);

      throw new Error("Gemini API request failed");
    }

    const data = await res.json();

    const description = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!description) {
      throw new Error("No description returned");
    }

    return description.trim();
  } catch (error) {
    console.error("Description Error:", error);

    return "No description available for this book.";
  }
}

// ================================
// Open Book Details
// ================================

function OpenBookDetails(book, ImgSrc) {
  const Author = book.author_name ? book.author_name[0] : "Unknown Author";

  const Modal = document.createElement("div");

  Modal.className = "book-modal";

  Modal.innerHTML = `
    <div class="book-modal-overlay"></div>

    <div class="book-modal-content">

      <button class="close-modal" aria-label="Close">
        &times;
      </button>

      <div class="book-modal-body">

        <div class="book-modal-image">

          <img 
            src="${ImgSrc}" 
            alt="${book.title}"
          >

        </div>

        <div class="book-modal-info">

          <span class="book-label">
            BOOK DETAILS
          </span>

          <h2>
            ${book.title}
          </h2>

          <p class="book-author">
            By ${Author}
          </p>

          <div class="book-divider"></div>

          <div class="book-details">

            <div class="detail-item">
              <span>Author</span>
              <strong>${Author}</strong>
            </div>

            ${
              book.first_publish_year
                ? `
                  <div class="detail-item">
                    <span>First Published</span>
                    <strong>${book.first_publish_year}</strong>
                  </div>
                `
                : ""
            }

            ${
              book.publisher
                ? `
                  <div class="detail-item">
                    <span>Publisher</span>
                    <strong>${book.publisher[0]}</strong>
                  </div>
                `
                : ""
            }

            ${
              book.number_of_pages_median
                ? `
                  <div class="detail-item">
                    <span>Pages</span>
                    <strong>${book.number_of_pages_median}</strong>
                  </div>
                `
                : ""
            }

          </div>

          <div class="extra-details">

            <h3>
              About this book
            </h3>

            <p class="book-description">
              Generating description...
            </p>

          </div>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(Modal);

  // ================================
  // Generate AI Description
  // ================================

  const DescriptionElement = Modal.querySelector(".book-description");

  GetBookDescription(book.title, Author).then(function (description) {
    if (DescriptionElement) {
      DescriptionElement.textContent = description;
    }
  });

  // ================================
  // Close Button
  // ================================

  const CloseBtn = Modal.querySelector(".close-modal");

  CloseBtn.addEventListener("click", function () {
    CloseBookModal(Modal);
  });

  // ================================
  // Click Outside
  // ================================

  const Overlay = Modal.querySelector(".book-modal-overlay");

  Overlay.addEventListener("click", function () {
    CloseBookModal(Modal);
  });

  // ================================
  // Escape Key
  // ================================

  document.addEventListener("keydown", function EscapeHandler(e) {
    if (e.key === "Escape") {
      CloseBookModal(Modal);

      document.removeEventListener("keydown", EscapeHandler);
    }
  });
}

// ================================
// Close Book Modal
// ================================

function CloseBookModal(Modal) {
  Modal.classList.add("closing");

  setTimeout(function () {
    Modal.remove();
  }, 250);
}

// ================================
// Search Button
// ================================

SearchBtn.addEventListener("click", function () {
  const value = SearchInp.value.trim();

  if (value !== "") {
    GetBook(value);
  }
});

// ================================
// Search With Enter
// ================================

SearchInp.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const value = SearchInp.value.trim();

    if (value !== "") {
      GetBook(value);
    }
  }
});

// ================================
// Clear Search
// ================================

function ClearSearch() {
  SearchInp.value = "";

  Cards_Grid.innerHTML = "";

  SearchInp.focus();
}
