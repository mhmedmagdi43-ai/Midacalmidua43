/* =========================================================
   شفاء ميد | المرحلة الثالثة: JavaScript
   التحقق من النماذج وإدارة حالة تسجيل الدخول في المتصفح
   ========================================================= */

(function () {
  "use strict";

  const SESSION_KEY = "shifaMedSession";
  const USER_KEY = "shifaMedUser";

  const productNames = {
    "MD-001": "جهاز قياس ضغط الدم",
    "MD-002": "مقياس التأكسج",
    "MD-003": "كرسي متحرك",
    "MD-004": "جهاز شفط طبي",
    "MD-005": "سرير طبي كهربائي"
  };

  function isLoggedIn() {
    return localStorage.getItem(SESSION_KEY) === "active";
  }

  function getUserEmail() {
    return localStorage.getItem(USER_KEY) || "";
  }

  function setMessage(container, text, type) {
    if (!container) return;
    container.textContent = text;
    container.className = "js-message " + (type || "info");
    container.setAttribute("role", "status");
  }

  function clearMessage(container) {
    if (container) {
      container.textContent = "";
      container.className = "js-message";
      container.removeAttribute("role");
    }
  }

  function getOrCreateMessage(form) {
    let message = form.querySelector(".js-message");
    if (!message) {
      message = document.createElement("p");
      message.className = "js-message";
      message.setAttribute("aria-live", "polite");
      form.insertBefore(message, form.firstChild);
    }
    return message;
  }

  function addLogoutLink() {
    if (!isLoggedIn()) return;

    const nav = document.querySelector("header nav");
    if (!nav || nav.querySelector("[data-logout]") || document.querySelector("[data-logout]")) return;

    const separator = document.createTextNode(" | ");
    const logout = document.createElement("a");
    logout.href = "#";
    logout.textContent = "تسجيل الخروج";
    logout.setAttribute("data-logout", "true");
    logout.addEventListener("click", function (event) {
      event.preventDefault();
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "index.html";
    });
    nav.appendChild(separator);
    nav.appendChild(logout);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setupLoginForm() {
    const form = document.querySelector("form");
    if (!form || !document.querySelector("#password") || !document.querySelector("#email")) return;

    const message = getOrCreateMessage(form);
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");
    const selectedProduct = new URLSearchParams(window.location.search).get("product");

    if (selectedProduct && productNames[selectedProduct]) {
      const notice = document.createElement("p");
      notice.className = "login-product-notice";
      notice.textContent = "سجّل الدخول للمتابعة مع المنتج: " + productNames[selectedProduct];
      form.insertBefore(notice, form.firstChild);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMessage(message);

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!validateEmail(email)) {
        setMessage(message, "يرجى إدخال بريد إلكتروني صحيح.", "error");
        emailInput.focus();
        return;
      }

      if (password.length < 6) {
        setMessage(message, "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.", "error");
        passwordInput.focus();
        return;
      }

      localStorage.setItem(SESSION_KEY, "active");
      localStorage.setItem(USER_KEY, email);
      setMessage(message, "تم تسجيل الدخول بنجاح. جارٍ تجهيز صفحة المنتجات...", "success");

      const destination = selectedProduct
        ? "products.html?selected=" + encodeURIComponent(selectedProduct)
        : "products.html";
      window.setTimeout(function () {
        window.location.href = destination;
      }, 700);
    });
  }

  function setupProductButtons() {
    const buttons = document.querySelectorAll(".product-button");
    if (!buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        const productCode = button.closest("tr")?.querySelector("td:nth-child(2)")?.textContent.trim() || "";
        if (!isLoggedIn()) {
          event.preventDefault();
          window.location.href = "login.html?product=" + encodeURIComponent(productCode);
          return;
        }

        event.preventDefault();
        window.location.href = "contact.html?product=" + encodeURIComponent(productCode);
      });
    });

    const selected = new URLSearchParams(window.location.search).get("selected");
    if (selected && productNames[selected]) {
      const notice = document.createElement("p");
      notice.className = "js-message success selected-product-message";
      notice.textContent = "تم تسجيل الدخول. يمكنك الآن الاستفسار عن: " + productNames[selected];
      const heading = document.querySelector("main > h2");
      if (heading) heading.insertAdjacentElement("afterend", notice);
    }
  }

  function setupContactForm() {
    const form = document.querySelector("form");
    if (!form || !document.querySelector("#comment") || !document.querySelector("#contact-email")) return;

    const message = getOrCreateMessage(form);
    const productCode = new URLSearchParams(window.location.search).get("product");
    const emailInput = document.querySelector("#contact-email");
    const commentInput = document.querySelector("#comment");

    if (productCode && productNames[productCode]) {
      commentInput.value = "أرغب في الاستفسار عن المنتج: " + productNames[productCode] + " (" + productCode + ")\n\n";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMessage(message);

      if (!isLoggedIn()) {
        setMessage(message, "يجب تسجيل الدخول أولاً لإرسال الاستفسار.", "error");
        window.setTimeout(function () {
          window.location.href = "login.html?returnTo=contact.html";
        }, 700);
        return;
      }

      const nameInput = document.querySelector("#name");
      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput.value.trim();
      const comment = commentInput.value.trim();

      if (name.length < 3) {
        setMessage(message, "يرجى إدخال الاسم كاملاً.", "error");
        if (nameInput) nameInput.focus();
        return;
      }

      if (!validateEmail(email)) {
        setMessage(message, "يرجى إدخال بريد إلكتروني صحيح.", "error");
        emailInput.focus();
        return;
      }

      if (comment.length < 10) {
        setMessage(message, "يرجى كتابة رسالة لا تقل عن 10 أحرف.", "error");
        commentInput.focus();
        return;
      }

      setMessage(message, "تم استلام استفسارك بنجاح. شكراً لتواصلك معنا.", "success");
      form.reset();
    });
  }

  function setupLoggedInState() {
    const loginHeading = document.querySelector("main > h2");
    if (!loginHeading || !isLoggedIn() || !document.querySelector("#password")) return;

    const notice = document.createElement("p");
    notice.className = "js-message success";
    notice.textContent = "أنت مسجل الدخول حالياً بالحساب: " + getUserEmail();
    loginHeading.insertAdjacentElement("afterend", notice);
  }

  document.addEventListener("DOMContentLoaded", function () {
    addLogoutLink();
    setupLoginForm();
    setupProductButtons();
    setupContactForm();
    setupLoggedInState();
  });
})();
