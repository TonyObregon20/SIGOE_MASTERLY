// Safeguard for Custom Element Registration in sandboxed/iframe environments
if (typeof window !== "undefined" && window.customElements) {
  const originalDefine = window.customElements.define;
  if (originalDefine) {
    window.customElements.define = function (name, constructor, options) {
      try {
        originalDefine.call(window.customElements, name, constructor, options);
      } catch (err) {
        console.warn(`[Failsafe] customElements.define failed for "${name}":`, err);
      }
    };
  }
}
