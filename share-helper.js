// ============================================================
// share-helper.js
// Eine Datei, die von ALLEN Spielen gemeinsam genutzt wird.
// Muss nur EINMAL im Repo liegen, nicht in jede HTML kopiert werden.
// ============================================================
//
// WICHTIG: Fuer Bilder in der nativen App wird zusaetzlich das
// Capacitor Filesystem-Plugin benoetigt (einmalig installieren):
//   npm install @capacitor/filesystem
//   npx cap sync android
// ============================================================

async function _blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function universalShare({ title, text, url, filesBlob, fileName }) {
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

  // Stufe 1: Native App (Capacitor) — zuverlässigster Weg
  if (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
    try {
      const shareOptions = { title, text, url, dialogTitle: title };

      if (filesBlob && window.Capacitor.Plugins.Filesystem) {
        try {
          const base64Data = await _blobToBase64(filesBlob);
          const path = fileName || ('kippclub_share_' + Date.now() + '.png');
          const writeResult = await window.Capacitor.Plugins.Filesystem.writeFile({
            path: path,
            data: base64Data,
            directory: 'CACHE'
          });
          if (writeResult && writeResult.uri) {
            shareOptions.files = [writeResult.uri];
          }
        } catch (fsErr) {
          console.warn('[SHARE] Bild konnte nicht als Datei geschrieben werden, teile ohne Bild:', fsErr);
        }
      }

      await window.Capacitor.Plugins.Share.share(shareOptions);
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
  var fallbackText = url ? (text + " " + url) : text;
  window.open("https://wa.me/?text=" + encodeURIComponent(fallbackText), "_blank");
}
