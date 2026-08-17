// Zeigt an, ob der Assistent auf der aktuellen Seite arbeiten kann.
const UNTERSTUETZT = [
  { host: "www.ebay.de", name: "eBay" },
  { host: "www.kleinanzeigen.de", name: "Kleinanzeigen" },
  { host: "www.vinted.de", name: "Vinted" },
];

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const feld = document.getElementById("status");
  const url = tabs[0]?.url ?? "";
  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    host = "";
  }
  const plattform = UNTERSTUETZT.find((p) => p.host === host);
  feld.textContent = plattform
    ? `Aktive Seite: ${plattform.name}. Der Assistent ist bereit.`
    : "Diese Seite wird nicht unterstützt. Öffne das Verkaufsformular über den Knopf in der App.";
});
