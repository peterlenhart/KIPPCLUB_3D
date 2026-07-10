// ============================================================
// share-helper.js
// Eine Datei, die von ALLEN Spielen gemeinsam genutzt wird.
// Muss nur EINMAL im Repo liegen, nicht in jede HTML kopiert werden.
// ============================================================

async function universalShare({ title, text, url, filesBlob, fileName }) {
  // Stufe 1: Native App (Capacitor) — zuverlässigster Weg
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()
      && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
    try {
      await window.Capacitor.Plugins.Share.share({ title, text, url, dialogTitle: title });
      return;
    } catch (e) {
      if (e && e.message && e.message.toLowerCase().includes('cancel')) return;
      console.warn('[SHARE] Capacitor Share fehlgeschlagen, versuche Fallback:', e);
    }
  }

  // Stufe 2: Normaler Browser mit Bild (falls vorhanden)
  if (filesBlob && navigator.canShare) {
    try {
      const file = new File([filesBlob], fileName || 'kippclub.png', { type: 'image/png' });
      const shareData = { title, text, url, files: [file] };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) { /* weiter zu Stufe 3 */ }
  }

  // Stufe 2b: Normaler Browser, nur Text/Link
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (e) { /* weiter zu Stufe 3 */ }
  }

  // Stufe 3: Letzter Fallback — WhatsApp-Web-Link
  window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank");
}
