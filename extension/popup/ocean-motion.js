const STORAGE_KEY = "diver.oceanMotionPaused";
const pauseControl = document.getElementById("pause-ocean");

if (pauseControl) {
  try {
    pauseControl.checked =
      localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // The checkbox still works if saved preferences are unavailable.
  }

  pauseControl.addEventListener("change", () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        String(pauseControl.checked)
      );
    } catch {
      // Keep motion control working for this popup session.
    }
  });
}