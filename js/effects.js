export function animateValue(element, start, end, duration = 700) {
  if (!element) return;
  const startTime = performance.now();
  const tick = now => {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + (end - start) * (1 - Math.pow(1 - progress, 3)));
    element.textContent = value.toLocaleString('es-CO');
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function launchConfetti() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 1.4}s`;
    piece.style.setProperty('--drift', `${(Math.random() - .5) * 180}px`);
    fragment.appendChild(piece);
  }
  document.body.appendChild(fragment);
  window.setTimeout(() => document.querySelectorAll('.confetti').forEach(item => item.remove()), 3200);
}

export function notify(message) {
  if ('Notification' in window && Notification.permission === 'granted') new Notification(message);
}
