document.addEventListener('DOMContentLoaded', () => {
  // Inicializar la conexión con Supabase
  const SUPABASE_URL = "https://uvhzeqemkmekgwhqczth.supabase.co";     // ← reemplaza
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHplcWVta21la2d3aHFjenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ2MzUsImV4cCI6MjA3Njc2MDYzNX0.vJtoznHXAnuBZNABDI8gZARYgXgIVuL-Y6Ut8XL88z8";                    // ← reemplaza (key pública)
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const form = document.getElementById('newProjectForm');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Recopilamos los datos del formulario
    const formData = new FormData(form);
    const projectData = {};

    formData.forEach((value, key) => {
      projectData[key] = value;
    });

    console.log("Datos del proyecto:", projectData);  // Verifica los datos que se están enviando

    // Insertar los datos en Supabase
    const { data, error } = await supabase
      .from('investigacion_aplicada')  // Nombre de la tabla en Supabase
      .insert([{
        titulo: projectData.titulo,
        programa_estudio: projectData['programa-estudio'],
        linea_investigacion: projectData.linea_investigacion,
        investigadores: projectData.investigadores,
        objetivo: projectData.objetivo,
        beneficiarios: projectData.beneficiarios,
        localizacion: projectData.localizacion,
        fechas: projectData.fechas,
      }]);

    // Manejo de errores
    if (error) {
      console.error('Error al insertar el proyecto:', error);
      alert('Hubo un problema al guardar el proyecto. Intenta nuevamente.');
      return;
    }

    // Si todo está bien, muestra un mensaje y redirige
    alert("¡Proyecto creado exitosamente!");
    window.location.href = "investigacion-aplicada.html";  // Redirige a la página de Innovación Tecnológica
  });
});
