// app.js — Login/SignUp con Supabase Auth (email & password)

document.addEventListener('DOMContentLoaded', () => {
  // 1) Configura tus credenciales de Supabase
  const SUPABASE_URL = "https://uvhzeqemkmekgwhqczth.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHplcWVta21la2d3aHFjenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ2MzUsImV4cCI6MjA3Njc2MDYzNX0.vJtoznHXAnuBZNABDI8gZARYgXgIVuL-Y6Ut8XL88z8"; // Reemplaza con tu clave pública

  // 2) Crea el cliente
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Referencias de elementos del formulario
  const form = document.getElementById("loginForm");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const result = document.getElementById("result");

  // Manejo del formulario de login
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mailVal = email.value.trim();
    const pwdVal = password.value;

    if (!mailVal || !pwdVal || pwdVal.length < 6) {
      result.textContent = "Correo o contraseña inválidos.";
      result.style.color = "red";
      return;
    }

    result.textContent = "Iniciando sesión...";
    result.style.color = "green";

    // Realiza la autenticación usando el email y la contraseña
    const { data, error } = await supabase.auth.signInWithPassword({
      email: mailVal,
      password: pwdVal,
    });

    if (error) {
      result.textContent = error.message;
      result.style.color = "red";
      return;
    }

    // Redirigir si el inicio de sesión es exitoso
    setTimeout(() => {
      window.location.href = "categorias.html";  // Redirige a la página de categorías
    }, 1000);
  });
});
