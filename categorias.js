// categorias.js — versión con botón de Cerrar Sesión

document.addEventListener("DOMContentLoaded", async () => {
  // Configura Supabase (igual que en login)
  const SUPABASE_URL = "https://uvhzeqemkmekgwhqczth.supabase.co";     // ← reemplaza
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHplcWVta21la2d3aHFjenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ2MzUsImV4cCI6MjA3Njc2MDYzNX0.vJtoznHXAnuBZNABDI8gZARYgXgIVuL-Y6Ut8XL88z8";  // ← reemplaza (key pública)

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1️⃣ Verificar sesión activa
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // si no hay sesión, regresar al login
    window.location.href = "index.html";
    return;
  }

  // 2️⃣ Mostrar año actual
  document.getElementById("year").textContent = new Date().getFullYear();

  // 3️⃣ Función para cerrar sesión
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });

  // 4️⃣ Efecto ripple al hacer clic en tarjetas
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      makeRipple(e, card);
      const cat = card.dataset.cat;
      
      // Redirigir a la página correspondiente según la categoría
      if (cat === "tecnologica") {
        window.location.href = "innovacion.html";
      } else if (cat === "aplicada") {
        window.location.href = "investigacion-aplicada.html";
      } else if (cat === "pedagogica") {
        window.location.href = "innovacion-pedagogica.html";
      }

      e.preventDefault(); // Evita el comportamiento por defecto del enlace
    });
  });
});

// ----------------------
// Función efecto ripple
// ----------------------
function makeRipple(event, card) {
  const ripple = card.querySelector(".ripple");
  const rect = card.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.2;
  const x = (event.clientX ?? rect.left + rect.width / 2) - rect.left;
  const y = (event.clientY ?? rect.top + rect.height / 2) - rect.top;

  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = ripple.style.height = "0px";
  ripple.style.opacity = "0.45";
  requestAnimationFrame(() => {
    ripple.style.width = ripple.style.height = `${size}px`;
    setTimeout(() => (ripple.style.opacity = "0"), 250);
  });
}
