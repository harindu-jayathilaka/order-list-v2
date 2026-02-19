let sections = JSON.parse(localStorage.getItem("sections")) || {
  "Alcohol and Spirits": ["Whiskey", "Vodka", "Gin"],
  "Beer and Cider": ["Lager", "Ale", "Cider"],
  "Drinks - Can": ["Coke Can", "Pepsi Can"],
  "Drinks - Bottles": ["Coke Bottle", "Pepsi Bottle"],
  "Drinks - 2L": ["Coke 2L", "Pepsi 2L"],
  "Drinks - Juices": ["Orange Juice", "Apple Juice"],
  "Mineral Water": ["Still Water", "Sparkling Water"],
  "Grocery": ["Rice", "Sugar", "Flour"],
  "Household": ["Detergent", "Toilet Paper"],
  "Pet Foods": ["Dog Food", "Cat Food"],
  "Chilled Items": ["Milk", "Cheese", "Yogurt"],
  "Crisps": ["Potato Chips", "Corn Chips"],
  "Sweets": ["Chocolate", "Candy"]
};

let selectedItems = JSON.parse(localStorage.getItem("selectedItems")) || {};

function saveSections() {
  localStorage.setItem("sections", JSON.stringify(sections));
}

function saveSelectedItems() {
  localStorage.setItem("selectedItems", JSON.stringify(selectedItems));
}

function renderList() {
  const listDiv = document.getElementById("list");
  listDiv.innerHTML = "";

  for (const section in sections) {
    sections[section].sort((a, b) => a.localeCompare(b));

    const h2 = document.createElement("h2");
    h2.id = "section-" + section.replace(/\s+/g, "-");

    const sectionName = document.createElement("span");
    sectionName.className = "section-name";
    sectionName.textContent = section;
    h2.appendChild(sectionName);

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add Item";
    addBtn.onclick = () => addItem(section);
    h2.appendChild(addBtn);

    listDiv.appendChild(h2);

    sections[section].forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = section + "_" + index;
      checkbox.checked = selectedItems[section]?.includes(item) || false;
      checkbox.onchange = () => {
        if (!selectedItems[section]) selectedItems[section] = [];
        if (checkbox.checked) {
          if (!selectedItems[section].includes(item)) selectedItems[section].push(item);
        } else {
          selectedItems[section] = selectedItems[section].filter(i => i !== item);
          if (selectedItems[section].length === 0) delete selectedItems[section];
        }
        saveSelectedItems();
      };

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = item;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑";
      deleteBtn.style.marginLeft = "8px";
      deleteBtn.onclick = () => deleteItem(section, index);

      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.style.marginLeft = "6px";
      editBtn.onclick = () => editItem(section, index);

      div.appendChild(checkbox);
      div.appendChild(label);
      div.appendChild(editBtn);
      div.appendChild(deleteBtn);
      listDiv.appendChild(div);
    });
  }

  renderGoToButtons();
}

function editItem(section, index) {
  const oldName = sections[section][index];
  const newName = prompt("Edit item name:", oldName);
  if (newName && newName.trim()) {
    const trimmedName = newName.trim();
    sections[section][index] = trimmedName;
    if (selectedItems[section]) {
      selectedItems[section] = selectedItems[section].map(item =>
        item === oldName ? trimmedName : item
      );
    }
    saveSections();
    saveSelectedItems();
    renderList();
  }
}

function deleteItem(section, index) {
  const itemName = sections[section][index];
  if (confirm(`Delete "${itemName}" from ${section}?`)) {
    sections[section].splice(index, 1);
    if (selectedItems[section]) {
      selectedItems[section] = selectedItems[section].filter(i => i !== itemName);
      if (selectedItems[section].length === 0) delete selectedItems[section];
    }
    saveSections();
    saveSelectedItems();
    renderList();
  }
}

function addItem(section) {
  const newItem = prompt(`Enter new item name for ${section}:`);
  if (newItem && newItem.trim()) {
    const trimmed = newItem.trim();
    if (!sections[section].includes(trimmed)) {
      sections[section].push(trimmed);
      saveSections();
      renderList();
    } else {
      alert("Item already exists in this section.");
    }
  }
}

function showSelected() {
  let output = "";
  for (const section in selectedItems) {
    if (selectedItems[section].length > 0) {
      output += section + ":\n" + selectedItems[section].join("\n") + "\n\n";
    }
  }
  document.getElementById("output").textContent = output || "No items selected.";
}

function unselectAll() {
  if (confirm("Unselect all items?")) {
    selectedItems = {};
    saveSelectedItems();
    renderList();
  }
}

function backupData() {
  const data = { sections, selectedItems };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shop_order_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function restoreData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const data = JSON.parse(event.target.result);
      if (data.sections) sections = data.sections;
      if (data.selectedItems) selectedItems = data.selectedItems;
      saveSections();
      saveSelectedItems();
      renderList();
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  // Iterate sections in app order, not selectedItems insertion order
  for (const section in sections) {
    if (selectedItems[section] && selectedItems[section].length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(section, 10, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      [...selectedItems[section]].sort((a, b) => a.localeCompare(b)).forEach(item => {
        if (y > 280) { doc.addPage(); y = 10; }
        doc.text("- " + item, 14, y);
        y += 5;
      });
      y += 5;
    }
  }
  doc.save("Selected_Items.pdf");
}

/**
 * Finds the section whose heading is currently at or just above the
 * centre of the viewport — works correctly for both scroll directions.
 */
function getCurrentVisibleSection() {
  const headings = document.querySelectorAll("h2");
  const midpoint = window.innerHeight / 2;
  let bestSection = null;
  let bestDistance = Infinity;

  headings.forEach(heading => {
    const rect = heading.getBoundingClientRect();
    // We want the heading closest to (but not below) the centre of the screen.
    // If the heading top is above the midpoint, distance = midpoint - rect.top (positive, smaller = closer).
    // If the heading top is below the midpoint we skip it — user hasn't reached it yet.
    if (rect.top <= midpoint) {
      const distance = midpoint - rect.top;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSection = heading.querySelector(".section-name").textContent;
      }
    }
  });

  // Fallback to first section if nothing qualifies (page at very top)
  if (!bestSection) {
    const first = document.querySelector("h2 .section-name");
    if (first) bestSection = first.textContent;
  }

  return bestSection;
}

function addItemToVisibleSection() {
  const section = getCurrentVisibleSection();
  if (section) {
    addItem(section);
  }
}

function renderGoToButtons() {
  const container = document.getElementById("goto-buttons");
  container.innerHTML = "";
  Object.keys(sections).forEach(section => {
    const button = document.createElement("button");
    button.textContent = section;
    button.onclick = () => {
      const id = "section-" + section.replace(/\s+/g, "-");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    container.appendChild(button);
  });
}

// Initial render
renderList();
