let allArticles = []; // store loaded articles
let selectedItems = {}; // ✅ keep selections globally (key = article.id)

// Function to render products (with optional category filter)
function renderArticles(filterCategory = "all") {
  const container = document.getElementById("articles-container");
  container.innerHTML = ""; // clear current items

  const filtered =
    filterCategory === "all"
      ? allArticles
      : allArticles.filter((article) => article.category === filterCategory);

  filtered.forEach((article) => {
    const articleEl = document.createElement("article");
    articleEl.classList.add("col-6", "col-12-xsmall", "work-item");

    const imgSrc =
      article.image && article.image.trim() !== ""
        ? article.image
        : "images/thumbs/no-image.jpg";

    const saved = selectedItems[article.id];
    const isChecked = saved !== undefined;
    const quantity = saved ? saved.quantity : 1;

    articleEl.innerHTML = `
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        
        <input type="checkbox" class="product-checkbox"
          style="all:unset;appearance:auto;-webkit-appearance:checkbox;-moz-appearance:checkbox;
                 display:inline-block;width:16px;height:16px;cursor:pointer;margin:0;"
          ${isChecked ? "checked" : ""}
          data-id="${article.id}" 
          data-title="${article.title}"
          data-description="${article.description}">
        <div class="quantity-container" style="display:${isChecked ? "flex" : "none"};
             align-items:center;gap:5px;">
          <button class="dec">-</button>
          <input type="number" class="quantity-input" value="${quantity}" min="1"
                 style="width:45px;text-align:center;">
          <button class="inc">+</button>
        </div>
      </label>
      <a href="${imgSrc}" class="image fit thumb">
        <img src="${imgSrc}" alt="${article.title}" />
      </a>
      <h3>${article.title}</h3>
      <p>${article.description}</p>
    `;

    container.appendChild(articleEl);
  });

  attachEventHandlers(); // ✅ reattach after re-render
}

// ✅ Draw Arabic text on hidden canvas → return PNG data URL
function renderArabicToImage(text, fontSize = 24, fontFamily = "Rubik") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 1000;
  canvas.height = fontSize * 2;

  ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "black";
  ctx.fillText(text, canvas.width - 10, fontSize + 10);

  return canvas.toDataURL("image/png");
}

// ✅ Attach handlers for checkboxes and counters
function attachEventHandlers() {
  document.querySelectorAll(".product-checkbox").forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      const title = cb.dataset.title;
      const description = cb.dataset.description;
      const container = cb
        .closest("label")
        .querySelector(".quantity-container");

      if (cb.checked) {
        container.style.display = "flex";
        selectedItems[id] = { id, title, description, quantity: 1 };
      } else {
        container.style.display = "none";
        delete selectedItems[id];
      }
    });
  });

  document.querySelectorAll(".quantity-container").forEach((div) => {
    const input = div.querySelector(".quantity-input");
    const inc = div.querySelector(".inc");
    const dec = div.querySelector(".dec");
    const id = div
      .closest("label")
      .querySelector(".product-checkbox").dataset.id;

    inc.addEventListener("click", () => {
      input.value = parseInt(input.value) + 1;
      if (selectedItems[id]) selectedItems[id].quantity = parseInt(input.value);
    });
    dec.addEventListener("click", () => {
      if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        if (selectedItems[id])
          selectedItems[id].quantity = parseInt(input.value);
      }
    });
  });
}

// ✅ Load products and render
fetch("articles.json")
  .then((response) => response.json())
  .then((articles) => {
    allArticles = articles;
    renderArticles(); // initial render
  })
  .catch((error) => console.error("Fehler beim Laden der Artikel:", error));

// ✅ Handle category filter buttons
document.addEventListener("click", (e) => {
  if (e.target && e.target.dataset.filter) {
    renderArticles(e.target.dataset.filter);
  }
});

// ✅ PDF generation (with logo + centered Arabic title + bullets)
document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate-pdf");
  const nameInput = document.getElementById("customer-name");

  generateBtn.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const customerName = nameInput.value.trim();

    if (!customerName) {
      alert("Bitte geben Sie den Namen des Kunden ein, bevor Sie die Bestellung ausdrucken.");
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Generiere...";
    await document.fonts.ready;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 25;

    // 🖼️ Add logo
    const logo = new Image();
    logo.src = "images/avatar.png";
    logo.onload = () => {
      doc.addImage(logo, "PNG", 15, 10, 25, 25);

      // 🧍‍♂️ Customer name under logo
      doc.setFont("helvetica", "normal");
      doc.setFontSize(24);
      doc.text(`Kunde: ${customerName}`, 15, 42);

      // 🏷️ Center Arabic title
      const titleImg = renderArabicToImage("منتجات ريحاني للمواد الغذائية", 52, "Rubik");
      const titleWidth = 120;
      const xCentered = (pageWidth - titleWidth) / 2;
      doc.addImage(titleImg, "PNG", xCentered, 10, titleWidth, 15);
      y += 40;

      const items = Object.values(selectedItems);
      if (items.length === 0) {
        alert("Keine Produkte ausgewählt! Bitte wählen Sie mindestens ein Produkt aus.");
        generateBtn.disabled = false;
        generateBtn.textContent = "Bestellung ausdrucken";
        return;
      }

      // 🧾 Loop through items
      items.forEach((item) => {
        const lineText = `• ${item.title} - × ${item.quantity}`;
        const lineImg = renderArabicToImage(lineText, 32, "Rubik");
        const bulletX = pageWidth - 25;
        doc.addImage(lineImg, "PNG", bulletX - 140, y, 140, 10);
        y += 12;

        const descImg = renderArabicToImage(item.description, 32, "Rubik");
        doc.addImage(descImg, "PNG", bulletX - 140, y, 140, 10);
        y += 15;

        y += 5;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      // 🕒 Optional footer with date
      const today = new Date().toLocaleDateString("de-DE");
      doc.setFontSize(10);
      doc.text(`Erstellt am: ${today}`, 15, 285);

      doc.save(`bestellung_${customerName.replace(/\s+/g, "_")}.pdf`);

      generateBtn.disabled = false;
      generateBtn.textContent = "Bestellung ausdrucken";
    };
  });
});
