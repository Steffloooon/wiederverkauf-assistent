/**
 * Geteilter Ausfüll-Assistent.
 *
 * Diese Datei ist die EINZIGE Quelle der Ausfüll-Logik und wird von beiden
 * Wegen genutzt:
 *   1. Chrome-Erweiterung (als Content-Script gebündelt)
 *   2. Android-App (serverseitig ausgeliefert und ins Verkaufsfenster injiziert)
 *
 * Sie liest die Übergabe-Kennung aus der Adresse (#la-token=...&la-api=...),
 * holt das Anzeigen-Paket und füllt das Verkaufsformular aus.
 * Sie drückt niemals selbst auf "Angebot einstellen".
 */
(function () {
  if (window.__laAssistentAktiv) return;
  window.__laAssistentAktiv = true;
  // Merkmal, an dem die App erkennt, dass der Assistent auf dieser Seite läuft.
  document.documentElement.setAttribute("data-listing-assistent", "1");


  var TEXT = {
    laden: "Anzeigendaten werden geholt …",
    fuellen: "Formular wird ausgefüllt …",
    bilder: "Fotos werden übertragen …",
    fertig: "Fertig. Bitte prüfen und selbst auf „Angebot einstellen“ klicken.",
    nichts: "Kein Formular gefunden. Öffne zuerst das Verkaufsformular der Plattform.",
    fehler: "Die Anzeigendaten konnten nicht geholt werden.",
    abgelaufen: "Die Übergabe ist abgelaufen. Bitte in der App erneut auf „Veröffentlichen“ tippen.",
  };

  function parameter() {
    // Die Android-App setzt die Angaben direkt, weil sie das Skript selbst einspielt.
    var direkt = window.__laUebergabe;
    if (direkt && direkt.token && direkt.api) {
      return { token: direkt.token, api: String(direkt.api).replace(/\/$/, "") };
    }
    var quelle = window.location.hash.slice(1) || window.location.search.slice(1);
    var p = new URLSearchParams(quelle);
    var token = p.get("la-token");
    var api = p.get("la-api");
    if (!token || !api) return null;
    return { token: token, api: api.replace(/\/$/, "") };
  }


  var box = null;
  function melden(text, art) {
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("data-la-assistent", "");
      box.style.cssText =
        "position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;max-width:520px;margin:0 auto;" +
        "background:#101828;color:#fff;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
        "padding:12px 14px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;gap:10px;align-items:flex-start";
      var punkt = document.createElement("span");
      punkt.setAttribute("data-la-punkt", "");
      punkt.style.cssText =
        "flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:#f59e0b;margin-top:5px";
      var inhalt = document.createElement("span");
      inhalt.setAttribute("data-la-text", "");
      inhalt.style.cssText = "flex:1 1 auto";
      var zu = document.createElement("button");
      zu.textContent = "✕";
      zu.setAttribute("aria-label", "Hinweis schließen");
      zu.style.cssText =
        "flex:0 0 auto;background:transparent;border:0;color:#98a2b3;font-size:14px;cursor:pointer;padding:0 2px";
      zu.onclick = function () {
        box.remove();
        box = null;
      };
      box.appendChild(punkt);
      box.appendChild(inhalt);
      box.appendChild(zu);
      document.documentElement.appendChild(box);
    }
    box.querySelector("[data-la-text]").textContent = text;
    var farbe = art === "fehler" ? "#f04438" : art === "fertig" ? "#12b76a" : "#f59e0b";
    box.querySelector("[data-la-punkt]").style.background = farbe;
  }

  function sichtbar(el) {
    if (!el || el.disabled || el.readOnly) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0 || el.type === "file";
  }

  function suche(selektoren) {
    for (var i = 0; i < selektoren.length; i++) {
      var treffer;
      try {
        treffer = document.querySelectorAll(selektoren[i]);
      } catch (e) {
        continue;
      }
      for (var j = 0; j < treffer.length; j++) {
        if (sichtbar(treffer[j])) return treffer[j];
      }
    }
    return null;
  }

  /** Wert so setzen, dass React/Angular-Formulare die Änderung mitbekommen. */
  function setzen(el, wert) {
    var art = el.tagName === "SELECT" ? "select" : el.tagName === "TEXTAREA" ? "textarea" : "input";
    if (art === "select") {
      var ziel = String(wert).toLowerCase();
      var gewaehlt = null;
      for (var i = 0; i < el.options.length; i++) {
        var o = el.options[i];
        var txt = (o.textContent || "").trim().toLowerCase();
        if (o.value === wert || txt === ziel) {
          gewaehlt = o;
          break;
        }
        if (!gewaehlt && (txt.indexOf(ziel) > -1 || ziel.indexOf(txt) > -1) && txt) gewaehlt = o;
      }
      if (!gewaehlt) return false;
      el.value = gewaehlt.value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    var proto =
      art === "textarea" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, "value");
    el.focus();
    if (setter && setter.set) setter.set.call(el, String(wert));
    else el.value = String(wert);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.blur();
    return true;
  }

  function fuelleFelder(felder) {
    var gesetzt = 0;
    var offen = [];
    for (var i = 0; i < felder.length; i++) {
      var feld = felder[i];
      if (feld.wert === null || feld.wert === undefined || feld.wert === "") continue;
      var el = suche(feld.selektoren || []);
      if (el && setzen(el, feld.wert)) gesetzt++;
      else offen.push(feld.label || feld.schluessel);
    }
    return { gesetzt: gesetzt, offen: offen };
  }

  async function fuelleBilder(urls, selektoren) {
    var eingabe = suche(selektoren || ['input[type="file"]']);
    if (!eingabe || !urls || urls.length === 0) return 0;
    var transfer = new DataTransfer();
    var anzahl = 0;
    for (var i = 0; i < urls.length; i++) {
      try {
        var antwort = await fetch(urls[i]);
        if (!antwort.ok) continue;
        var blob = await antwort.blob();
        var endung = (blob.type.split("/")[1] || "jpg").split("+")[0];
        transfer.items.add(new File([blob], "foto-" + (i + 1) + "." + endung, { type: blob.type }));
        anzahl++;
      } catch (e) {
        /* einzelnes Foto überspringen */
      }
    }
    if (anzahl === 0) return 0;
    eingabe.files = transfer.files;
    eingabe.dispatchEvent(new Event("change", { bubbles: true }));
    return anzahl;
  }

  async function start() {
    var p = parameter();
    if (!p) return;

    melden(TEXT.laden);
    var paket;
    try {
      var antwort = await fetch(p.api + "/api/public/uebergabe/" + encodeURIComponent(p.token), {
        headers: { Accept: "application/json" },
      });
      if (antwort.status === 404 || antwort.status === 410) {
        melden(TEXT.abgelaufen, "fehler");
        return;
      }
      if (!antwort.ok) {
        melden(TEXT.fehler, "fehler");
        return;
      }
      paket = await antwort.json();
    } catch (e) {
      melden(TEXT.fehler, "fehler");
      return;
    }

    // Auf das Formular warten (Plattformen laden ihre Felder oft nach).
    var versuche = 0;
    while (versuche < 40) {
      if (suche((paket.felder[0] && paket.felder[0].selektoren) || [])) break;
      await new Promise(function (r) {
        setTimeout(r, 500);
      });
      versuche++;
    }

    melden(TEXT.fuellen);
    var ergebnis = fuelleFelder(paket.felder || []);
    if (ergebnis.gesetzt === 0) {
      melden(TEXT.nichts, "fehler");
      return;
    }

    melden(TEXT.bilder);
    var bilder = await fuelleBilder(paket.bilder, paket.bildEingabe);

    var text = TEXT.fertig;
    if (bilder > 0) text = bilder + " Fotos übertragen. " + text;
    if (ergebnis.offen.length > 0)
      text = text + " Bitte noch selbst prüfen: " + ergebnis.offen.join(", ") + ".";
    melden(text, "fertig");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
