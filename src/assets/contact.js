// Contact form → Lambda Function URL → SES → owner's mailbox.
// No address on the page; the endpoint and strings come from data-* attributes
// so this file is identical for both languages.
(function () {
  var form = document.querySelector("form.form");
  if (!form) return;
  var status = form.querySelector(".form-status");
  var button = form.querySelector("button[type=submit]");
  var t = form.dataset;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    var payload = {
      name: form.name.value, email: form.email.value, message: form.message.value,
      website: form.website.value, lang: t.lang
    };
    button.disabled = true;
    var label = button.textContent;
    button.textContent = t.sending;
    status.className = "form-status";
    status.textContent = "";
    fetch(t.endpoint, {
      method: "POST", mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      form.reset();
      status.className = "form-status ok";
      status.textContent = t.done;
    }).catch(function () {
      status.className = "form-status err";
      status.textContent = t.fail;
    }).then(function () {
      button.disabled = false;
      button.textContent = label;
    });
  });
})();
