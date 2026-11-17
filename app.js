class Contact {
    constructor(id, name, phone, email = "", category = "Родина", notes = "", createdAt = new Date().toISOString()) {
        this.id = id || String(Date.now());
        this.name = name.trim();
        this.phone = phone.trim();
        this.email = email.trim();
        this.category = category;
        this.notes = notes.trim();
        this.createdAt = createdAt;
    }
}

class ContactManager {
    constructor(key = "contacts_list") {
        this.key = key;
        this.contacts = this.load();
    }

    add(data) {
        const item = new Contact(null, data.name, data.phone, data.email, data.category, data.notes);
        this.contacts.unshift(item);
        this.save();
        return item;
    }

    update(id, data) {
        const item = this.contacts.find(c => c.id === id);
        if (!item) return;
        item.name = data.name.trim();
        item.phone = data.phone.trim();
        item.email = data.email.trim();
        item.category = data.category;
        item.notes = data.notes.trim();
        this.save();
    }

    remove(id) {
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.save();
    }

    getById(id) {
        return this.contacts.find(c => c.id === id);
    }

    search(query, list = this.contacts) {
        if (!query) return list;
        const q = query.trim().toLowerCase();
        return list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }

    filter(category, list = this.contacts) {
        if (!category || category === "all") return list;
        return list.filter(c => c.category === category);
    }

    sort(by, list = this.contacts) {
        const res = [...list];
        if (by === "category") {
            const order = { "Родина": 1, "Робота": 2, "Друзі": 3 };
            return res.sort((a, b) => (order[a.category] || 99) - (order[b.category] || 99) || a.name.localeCompare(b.name, "uk"));
        }
        if (by === "name-asc") return res.sort((a, b) => a.name.localeCompare(b.name, "uk"));
        if (by === "name-desc") return res.sort((a, b) => b.name.localeCompare(a.name, "uk"));
        return res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    groupBy(list = this.contacts) {
        const groups = { "Родина": [], "Робота": [], "Друзі": [] };
        list.forEach(c => {
            if (!groups[c.category]) groups[c.category] = [];
            groups[c.category].push(c);
        });
        return groups;
    }

    save() {
        localStorage.setItem(this.key, JSON.stringify(this.contacts));
    }

    load() {
        const raw = localStorage.getItem(this.key);
        if (!raw) {
            const defaults = [
                new Contact(null, "Тарас", "+380501234567", "taras@mail.com", "Родина", "Брат"),
                new Contact(null, "Оксана Коваль", "0671112233", "", "Робота", "Колега"),
                new Contact(null, "Дмитро", "+380937778899", "dmytro@gmail.com", "Друзі", "Університет")
            ];
            localStorage.setItem(this.key, JSON.stringify(defaults));
            return defaults;
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(c => new Contact(c.id, c.name, c.phone, c.email, c.category, c.notes, c.createdAt)) : [];
        } catch {
            return [];
        }
    }
}

const manager = new ContactManager();

const nameRegex = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9\s'-]{2,50}$/;
const phoneRegex = /^(\+?380|0)\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(value) {
    const val = value.trim();
    if (!val) return "Введіть ім'я";
    if (!nameRegex.test(val)) return "Ім'я має містити від 2 символів (літери, цифри, дефіс)";
    return "";
}

function validatePhone(value) {
    const val = value.trim().replace(/[\s\-()]/g, "");
    if (!val) return "Введіть номер телефону";
    if (!phoneRegex.test(val)) return "Формат: +380XXXXXXXXX або 0XXXXXXXXX";
    return "";
}

function validateEmail(value) {
    const val = value.trim();
    if (!val) return "";
    if (!emailRegex.test(val)) return "Некоректний формат email";
    return "";
}

const contactForm = document.getElementById("contactForm");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const emailInput = document.getElementById("emailInput");
const categoryInput = document.getElementById("categoryInput");
const notesInput = document.getElementById("notesInput");

const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const emailError = document.getElementById("emailError");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

const contactsContainer = document.getElementById("contactsContainer");
const emptyMsg = document.getElementById("emptyMsg");
const totalBadge = document.getElementById("totalBadge");

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");
const editEmail = document.getElementById("editEmail");
const editCategory = document.getElementById("editCategory");
const editNotes = document.getElementById("editNotes");
const editNameError = document.getElementById("editNameError");
const editPhoneError = document.getElementById("editPhoneError");
const editEmailError = document.getElementById("editEmailError");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalOverlay = document.getElementById("modalOverlay");

const themeBtn = document.getElementById("themeBtn");

function applyFieldValidation(input, errorEl, errorText) {
    if (errorText) {
        input.classList.add("invalid");
        errorEl.textContent = errorText;
        return false;
    }
    input.classList.remove("invalid");
    errorEl.textContent = "";
    return true;
}

function createCard(c) {
    const card = document.createElement("article");
    card.className = "contact-card";
    card.dataset.id = c.id;

    const safeName = escapeHtml(c.name);
    const safePhone = escapeHtml(c.phone);
    const safeEmail = escapeHtml(c.email);
    const safeNotes = escapeHtml(c.notes);
    const catClass = `cat-${c.category.toLowerCase()}`;

    card.innerHTML = `
        <div class="card-header">
            <h4>${safeName}</h4>
            <span class="cat-badge ${catClass}">${c.category}</span>
        </div>
        <div class="card-info">
            <span>📞 <a href="tel:${safePhone}">${safePhone}</a></span>
            ${safeEmail ? `<span>✉️ <a href="mailto:${safeEmail}">${safeEmail}</a></span>` : ""}
            ${safeNotes ? `<span class="card-notes">📝 ${safeNotes}</span>` : ""}
        </div>
        <div class="card-btns">
            <button type="button" class="btn btn-outline btn-sm btn-edit">Редагувати</button>
            <button type="button" class="btn btn-danger btn-sm btn-del">Видалити</button>
        </div>
    `;
    return card;
}

function render() {
    let list = manager.search(searchInput.value);
    list = manager.filter(categoryFilter.value, list);
    list = manager.sort(sortSelect.value, list);

    totalBadge.textContent = `Всього: ${manager.contacts.length}`;
    contactsContainer.innerHTML = "";

    if (list.length === 0) {
        emptyMsg.hidden = false;
        return;
    }
    emptyMsg.hidden = true;

    if (sortSelect.value === "category") {
        const grouped = manager.groupBy(list);
        Object.keys(grouped).forEach(cat => {
            const items = grouped[cat];
            if (items.length === 0) return;

            const block = document.createElement("div");
            block.className = "category-block";

            const title = document.createElement("h3");
            title.className = "category-title";
            title.textContent = `${cat} (${items.length})`;
            block.appendChild(title);

            const grid = document.createElement("div");
            grid.className = "contacts-grid";
            items.forEach(c => grid.appendChild(createCard(c)));

            block.appendChild(grid);
            contactsContainer.appendChild(block);
        });
    } else {
        const grid = document.createElement("div");
        grid.className = "contacts-grid";
        list.forEach(c => grid.appendChild(createCard(c)));
        contactsContainer.appendChild(grid);
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const errName = validateName(nameInput.value);
    const errPhone = validatePhone(phoneInput.value);
    const errEmail = validateEmail(emailInput.value);

    const isNameOk = applyFieldValidation(nameInput, nameError, errName);
    const isPhoneOk = applyFieldValidation(phoneInput, phoneError, errPhone);
    const isEmailOk = applyFieldValidation(emailInput, emailError, errEmail);

    if (!isNameOk || !isPhoneOk || !isEmailOk) return;

    manager.add({
        name: nameInput.value,
        phone: phoneInput.value.trim().replace(/[\s\-()]/g, ""),
        email: emailInput.value,
        category: categoryInput.value,
        notes: notesInput.value
    });

    contactForm.reset();
    render();
});

nameInput.addEventListener("input", () => applyFieldValidation(nameInput, nameError, validateName(nameInput.value)));
phoneInput.addEventListener("input", () => applyFieldValidation(phoneInput, phoneError, validatePhone(phoneInput.value)));
emailInput.addEventListener("input", () => applyFieldValidation(emailInput, emailError, validateEmail(emailInput.value)));

contactForm.addEventListener("reset", () => {
    [nameInput, phoneInput, emailInput].forEach(i => i.classList.remove("invalid"));
    [nameError, phoneError, emailError].forEach(e => e.textContent = "");
});

searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);

contactsContainer.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".btn-del");
    const editBtn = e.target.closest(".btn-edit");

    if (delBtn) {
        const card = delBtn.closest(".contact-card");
        const id = card.dataset.id;
        const contact = manager.getById(id);
        if (contact && confirm(`Видалити контакт "${contact.name}"?`)) {
            manager.remove(id);
            render();
        }
        return;
    }

    if (editBtn) {
        const card = editBtn.closest(".contact-card");
        const id = card.dataset.id;
        const contact = manager.getById(id);
        if (!contact) return;

        editId.value = contact.id;
        editName.value = contact.name;
        editPhone.value = contact.phone;
        editEmail.value = contact.email;
        editCategory.value = contact.category;
        editNotes.value = contact.notes;

        [editName, editPhone, editEmail].forEach(i => i.classList.remove("invalid"));
        [editNameError, editPhoneError, editEmailError].forEach(el => el.textContent = "");

        editModal.hidden = false;
        editName.focus();
    }
});

function closeModal() {
    editModal.hidden = true;
}

closeModalBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !editModal.hidden) closeModal();
});

editForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const errName = validateName(editName.value);
    const errPhone = validatePhone(editPhone.value);
    const errEmail = validateEmail(editEmail.value);

    const isNameOk = applyFieldValidation(editName, editNameError, errName);
    const isPhoneOk = applyFieldValidation(editPhone, editPhoneError, errPhone);
    const isEmailOk = applyFieldValidation(editEmail, editEmailError, errEmail);

    if (!isNameOk || !isPhoneOk || !isEmailOk) return;

    manager.update(editId.value, {
        name: editName.value,
        phone: editPhone.value.trim().replace(/[\s\-()]/g, ""),
        email: editEmail.value,
        category: editCategory.value,
        notes: editNotes.value
    });

    closeModal();
    render();
});

editName.addEventListener("input", () => applyFieldValidation(editName, editNameError, validateName(editName.value)));
editPhone.addEventListener("input", () => applyFieldValidation(editPhone, editPhoneError, validatePhone(editPhone.value)));
editEmail.addEventListener("input", () => applyFieldValidation(editEmail, editEmailError, validateEmail(editEmail.value)));

function initTheme() {
    const saved = localStorage.getItem("app_theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
}

themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("app_theme", next);
});

initTheme();
render();
