// app.js — Login/SignUp con Supabase Auth (email & password)

document.addEventListener('DOMContentLoaded', () => {
  // 1) Configura tus credenciales de Supabase
  const SUPABASE_URL = "https://uvhzeqemkmekgwhqczth.supabase.co";     // ← reemplaza
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHplcWVta21la2d3aHFjenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ2MzUsImV4cCI6MjA3Njc2MDYzNX0.vJtoznHXAnuBZNABDI8gZARYgXgIVuL-Y6Ut8XL88z8";                    // ← reemplaza (key pública)

  // 2) Crea el cliente
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Referencias de elementos del formulario
  const form = document.getElementById("loginForm");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const result = document.getElementById("result");
  const togglePwd = document.getElementById("togglePwd");

  // Función para mostrar/ocultar la contraseña
  togglePwd.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    togglePwd.classList.toggle("is-on", !showing);
    togglePwd.setAttribute("aria-pressed", String(!showing));
  });

  // Función para manejar el inicio de sesión con correo y contraseña
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
      window.location.href = "categorias.html"; // Redirige a otra página después del login
    }, 1000);
  });

  // Configuración del inicio de sesión con Google
  window.handleCredentialResponse = async (response) => {
    const dataGoogle = JSON.parse(atob(response.credential.split('.')[1]));
    const emailGoogle = dataGoogle.email;

    // Buscar el perfil del usuario en Supabase
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('role')
      .eq('email', emailGoogle)
      .single();

    if (error || !perfil) {
      alert('❌ Este usuario no está registrado en el sistema.');
      return;
    }

    // Guardar los datos del usuario en el localStorage
    localStorage.setItem('auth', 'ok');
    localStorage.setItem('userEmail', emailGoogle);
    localStorage.setItem('role', perfil.role);

    // Redirigir según el rol del usuario
    if (perfil.role.toLowerCase() === 'administrador') {
      window.location.href = 'admin.html'; // Redirige al panel del administrador
    } else {
      window.location.href = 'empleado.html'; // Redirige a la página del empleado
    }
  };

  // Configuración del cliente de Google
  const GOOGLE_CLIENT_ID = "tu-client-id-google"; // Reemplaza con tu CLIENT_ID de Google
  window.onload = function () {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });
    google.accounts.id.renderButton(
      document.getElementById("googleLogin"),
      { theme: "outline", size: "large", width: "100%" } // Configuración del botón
    );
  };
});