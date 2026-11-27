// Copy-email button (home Contact section) and the Google Form embed (contact page).

const copy = document.getElementById("cp") as HTMLButtonElement | null;
if (copy) {
  const email = copy.dataset.email ?? "";
  const label = copy.querySelector("span")!;
  let timer = 0;
  copy.addEventListener("click", () => {
    const fallback = () => (location.href = "mailto:" + email);
    try {
      navigator.clipboard.writeText(email).catch(fallback);
    } catch {
      fallback();
    }
    label.textContent = "Copied ✓";
    clearTimeout(timer);
    timer = window.setTimeout(() => (label.textContent = "Copy"), 1800);
  });
}

const form = document.getElementById("gf") as HTMLIFrameElement | null;
const formMsg = document.getElementById("gf-ld");
if (form && formMsg) {
  const ok = () => {
    form.classList.add("ok");
    formMsg.style.display = "none";
  };
  form.addEventListener("load", ok);
  setTimeout(() => {
    if (!form.classList.contains("ok")) formMsg.textContent = "Still loading… use the link below if it does not appear.";
  }, 6000);
}
