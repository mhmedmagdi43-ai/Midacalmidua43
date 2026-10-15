/* شفاء ميد | JavaScript خاص بصفحة معاينة النظام */
(function () {
  "use strict";

  const SESSION_KEY = "shifaMedPreviewSession";
  const USER_EMAIL_KEY = "shifaMedPreviewUserEmail";
  const OWNER_EMAIL = "mhmedmagdi43@gmail.com";
  const PRODUCTS_KEY = "shifaMedPreviewProducts";

  const defaultProducts = [
    { id: "MD-001", name: "جهاز قياس ضغط الدم", price: "250 ريال", status: "available", image: "images/blood-pressure-monitor.png" },
    { id: "MD-002", name: "مقياس التأكسج", price: "95 ريال", status: "available", image: "images/pulse-oximeter.png" },
    { id: "MD-003", name: "كرسي متحرك", price: "850 ريال", status: "on-demand", image: "images/wheelchair.png" },
    { id: "MD-004", name: "جهاز شفط طبي", price: "1,200 ريال", status: "available", image: "images/medical-suction-device.png" },
    { id: "MD-005", name: "سرير طبي كهربائي", price: "3,500 ريال", status: "on-demand", image: "images/electric-medical-bed.png" }
  ];

  const loginPanel = document.querySelector("#preview-login-panel");
  const dashboard = document.querySelector("#preview-dashboard");
  const loginForm = document.querySelector("#preview-login-form");
  const loginMessage = document.querySelector("#preview-login-message");
  const productList = document.querySelector("#preview-product-list");
  const emptyState = document.querySelector("#preview-empty-state");
  const searchInput = document.querySelector("#preview-search");
  const filterSelect = document.querySelector("#preview-filter");
  const addForm = document.querySelector("#add-product-form");
  const addMessage = document.querySelector("#add-product-message");

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "active";
  }

  function getUserEmail() {
    return (sessionStorage.getItem(USER_EMAIL_KEY) || "").toLowerCase();
  }

  function isOwner() {
    return getUserEmail() === OWNER_EMAIL;
  }

  function setMessage(element, text, type) {
    element.textContent = text;
    element.className = "js-message " + (type || "info");
  }

  function getProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
      return Array.isArray(saved) ? saved : defaultProducts.slice();
    } catch (error) {
      return defaultProducts.slice();
    }
  }

  function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  function statusLabel(status) {
    return status === "available" ? "متوفر" : "حسب الطلب";
  }

  function statusClass(status) {
    return status === "available" ? "available" : "on-demand";
  }

  function updateStats(products) {
    document.querySelector("#stat-total").textContent = products.length;
    document.querySelector("#stat-available").textContent = products.filter(function (p) { return p.status === "available"; }).length;
    document.querySelector("#stat-demand").textContent = products.filter(function (p) { return p.status === "on-demand"; }).length;
  }

  function renderProducts() {
    const products = getProducts();
    const query = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;
    const filtered = products.filter(function (product) {
      const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.id.toLowerCase().includes(query);
      const matchesFilter = filter === "all" || product.status === filter;
      return matchesQuery && matchesFilter;
    });

    productList.innerHTML = "";
    emptyState.hidden = filtered.length !== 0;

    filtered.forEach(function (product) {
      const card = document.createElement("article");
      card.className = "managed-product-card";
      const managementActions = isOwner()
        ? `<div class="managed-product-actions">
             <button class="small-button toggle-status" type="button" data-id="${product.id}">تغيير الحالة</button>
             <button class="small-button danger-button delete-product" type="button" data-id="${product.id}">حذف</button>
           </div>`
        : `<span class="viewer-only-label">عرض فقط</span>`;

      card.innerHTML = `
        <img src="${product.image || "images/blood-pressure-monitor.png"}" alt="${product.name}" loading="lazy">
        <div class="managed-product-content">
          <div class="managed-product-meta"><span>${product.id}</span><span class="availability ${statusClass(product.status)}">${statusLabel(product.status)}</span></div>
          <h4>${product.name}</h4>
          <strong class="managed-product-price">${product.price}</strong>
          ${managementActions}
        </div>`;
      productList.appendChild(card);
    });

    updateStats(products);
  }

  function openDashboard() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    const roleLabel = document.querySelector("#preview-role-label");
    const ownerControls = document.querySelector("#owner-product-controls");
    if (isOwner()) {
      roleLabel.textContent = "صاحب الشركة";
      roleLabel.className = "role-badge owner-badge";
      ownerControls.hidden = false;
    } else {
      roleLabel.textContent = "مستخدم للعرض";
      roleLabel.className = "role-badge viewer-badge";
      ownerControls.hidden = true;
    }
    renderProducts();
  }

  function closeDashboard() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_EMAIL_KEY);
    dashboard.hidden = true;
    loginPanel.hidden = false;
    loginForm.reset();
    setMessage(loginMessage, "تم تسجيل الخروج من المعاينة.", "info");
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.querySelector("#preview-email").value.trim();
    const password = document.querySelector("#preview-password").value;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage(loginMessage, "أدخل بريداً إلكترونياً صحيحاً للمتابعة.", "error");
      return;
    }
    if (password.length < 6) {
      setMessage(loginMessage, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.", "error");
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "active");
    sessionStorage.setItem(USER_EMAIL_KEY, email.toLowerCase());
    document.querySelector("#preview-user-label").textContent = "مسجل الدخول: " + email;
    setMessage(loginMessage, "تم الدخول بنجاح.", "success");
    window.setTimeout(openDashboard, 350);
  });

  document.querySelector("#preview-logout").addEventListener("click", closeDashboard);
  searchInput.addEventListener("input", renderProducts);
  filterSelect.addEventListener("change", renderProducts);

  productList.addEventListener("click", function (event) {
    if (!isOwner()) return;
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    const id = button.dataset.id;
    const products = getProducts();
    const productIndex = products.findIndex(function (product) { return product.id === id; });
    if (productIndex === -1) return;

    if (button.classList.contains("delete-product")) {
      if (window.confirm("هل تريد حذف هذا المنتج من المعاينة؟")) {
        products.splice(productIndex, 1);
        saveProducts(products);
        renderProducts();
      }
      return;
    }

    products[productIndex].status = products[productIndex].status === "available" ? "on-demand" : "available";
    saveProducts(products);
    renderProducts();
  });

  addForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const nameInput = document.querySelector("#new-product-name");
    const priceInput = document.querySelector("#new-product-price");
    const statusInput = document.querySelector("#new-product-status");
    const name = nameInput.value.trim();
    const price = priceInput.value.trim();

    if (name.length < 3 || price.length < 1) {
      setMessage(addMessage, "أكمل اسم المنتج والسعر قبل الإضافة.", "error");
      return;
    }

    const products = getProducts();
    const nextNumber = products.length + 1;
    const id = "MD-" + String(nextNumber).padStart(3, "0");
    products.push({
      id: id,
      name: name,
      price: price,
      status: statusInput.value,
      image: "images/blood-pressure-monitor.png"
    });
    saveProducts(products);
    addForm.reset();
    setMessage(addMessage, "تمت إضافة المنتج " + id + " بنجاح.", "success");
    renderProducts();
  });

  if (isLoggedIn()) {
    document.querySelector("#preview-user-label").textContent = "جلسة معاينة نشطة";
    openDashboard();
  }
})();
