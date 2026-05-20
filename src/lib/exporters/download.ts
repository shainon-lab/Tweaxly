// Trigger a browser download for a Blob with a stamped filename.
// Single helper so every report uses the same naming convention:
//   {prefix}_{YYYY-MM-DD}.{ext}

export function downloadBlob(blob: Blob, filenamePrefix: string, ext: "csv" | "xlsx") {
  const today = new Date().toISOString().slice(0, 10);
  const safe = filenamePrefix.replace(/[^A-Za-z0-9_-]+/g, "_");
  const filename = `${safe}_${today}.${ext}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick before revoking - some browsers cancel
  // the download if revoke happens too early.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
