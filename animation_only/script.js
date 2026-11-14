const introLoader = document.querySelector('#introLoader');

if (introLoader) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const introDuration = reducedMotion ? 250 : 5300;

  window.setTimeout(() => {
    introLoader.classList.add('is-done');
    introLoader.setAttribute('aria-hidden', 'true');
    document.body.classList.add('animation-done');
    document.body.classList.remove('animation-lock');
    window.setTimeout(() => introLoader.remove(), 550);
  }, introDuration);
}
