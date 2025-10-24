document.addEventListener('DOMContentLoaded', async () => {
  // Supabase
  const SUPABASE_URL = "https://uvhzeqemkmekgwhqczth.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHplcWVta21la2d3aHFjenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ2MzUsImV4cCI6MjA3Njc2MDYzNX0.vJtoznHXAnuBZNABDI8gZARYgXgIVuL-Y6Ut8XL88z8";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // UI refs
  const projectTitle = document.getElementById('projectTitle');
  const projectAuthor = document.getElementById('projectAuthor');
  const projectDescription = document.getElementById('projectDescription');
  const projectIdEl = document.getElementById('projectId');
  const btnProyecto = document.getElementById('btnProyecto');
  const btnInforme  = document.getElementById('btnInforme');
  const formWrap    = document.getElementById('formWrap');

  // Get id from URL
  const projectId = new URLSearchParams(location.search).get('id');
  if (!projectId) { alert('No se ha proporcionado un ID de proyecto válido.'); return; }

  // Cargar proyecto base
  const { data: project, error } = await supabase
    .from('investigacion_aplicada')  // Usar la tabla innovacion-pedagogica
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) { console.error(error); alert('Error al cargar el proyecto.'); return; }

  // Render info
  projectTitle.textContent = project.titulo || 'Sin título';
  projectAuthor.textContent = project.investigadores || '—';
  projectDescription.textContent = project.descripcion || '—';
  projectIdEl.textContent = project.id;

  // Botones
  btnProyecto.addEventListener('click', () => renderForm('proyecto', project));
  btnInforme .addEventListener('click', () => renderForm('informe', project));

  // ------- Helpers UI -------
  function secTpl(titulo, innerHtml, opened = false) {
    return `
      <div class="form-section">
        <button type="button" class="toggle-btn" aria-expanded="${opened ? 'true' : 'false'}">
          <span class="twisty">${opened ? '▾' : '▸'}</span> ${titulo}
        </button>
        <div class="form-content" style="display:${opened ? 'block' : 'none'}">
          ${innerHtml}
        </div>
      </div>
    `;
  }

  function attachToggles(scopeEl) {
    scopeEl.querySelectorAll('.form-section .toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const icon = btn.querySelector('.twisty');
        if (icon) icon.textContent = expanded ? '▸' : '▾';
        content.style.display = expanded ? 'none' : 'block';
      });
    });
  }

  // Radios Sí/No
  function yn(name, label) {
    return `
      <div class="field">
        <label>${label}</label>
        <div class="yn-group" style="display:flex;gap:12px;align-items:center">
          <label style="display:inline-flex;gap:6px;align-items:center">
            <input type="radio" name="${name}" value="si"> Sí
          </label>
          <label style="display:inline-flex;gap:6px;align-items:center">
            <input type="radio" name="${name}" value="no"> No
          </label>
        </div>
      </div>
    `;
  }

  // Cargar respuestas previas (tabla según tipo)
  async function loadRespuestas(table) {
    const { data, error } = await supabase
      .from(table)
      .select('respuestas')
      .eq('project_id', projectId)
      .maybeSingle();
    if (error) { console.error('Error al cargar respuestas:', error); return null; }
    return data?.respuestas || null;
  }

  // Aplicar respuestas a radios
  function applyRespuestas(json) {
    if (!json) return;
    Object.entries(json).forEach(([name, val]) => {
      const input = formWrap.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(val)}"]`);
      if (input) input.checked = true;
    });
  }

  // Colectar radios → JSON
  function collectRespuestas() {
    const all = formWrap.querySelectorAll('input[type="radio"]');
    const out = {};
    all.forEach(r => {
      if (r.checked) out[r.name] = r.value; // "si" o "no"
      if (!(r.name in out)) out[r.name] = out[r.name] || null;
    });
    return out;
  }

  // Guardar (upsert) en tabla según tipo
  async function saveRespuestas(table, json) {
    const payload = {
      project_id: Number(projectId),
      respuestas: json,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from(table).upsert(payload, { onConflict: 'project_id' });
    if (error) { console.error('Error al guardar:', error); alert('No se pudo guardar.'); return false; }
    return true;
  }

  // ------- Render dinámico -------
  async function renderForm(type, p) {
    formWrap.hidden = false;

    if (type === 'proyecto') {
      // ===== PROYECTO =====
      const sI = `
        <div class="form-grid">
          ${yn('s11', '1.1. Título del proyecto')}
          ${yn('s12', '1.2. Investigador(es)')}
          ${yn('s13', '1.3. Programa(s) de estudios')}
          ${yn('s14', '1.4. Línea de investigación')}
          ${yn('s15d', '1.5. Número de Beneficiarios (directos e indirectos)')}
          ${yn('s16', '1.6. Costo del proyecto')}
          ${yn('s17', '1.7. Lugar de ejecución')}
          ${yn('s18', '1.8. Fuente de financiamiento')}
        </div>`;
      const sII = `
        <div class="form-grid">
          ${yn('s21', '2.1. Identificación del problema (incluye causas)')}
          ${yn('s22', '2.2. Formulación del problema (General-Específico)')}
          ${yn('s23', '2.3. Objetivos de la Investigación (G.E.), verbo en infinitivo')}
          ${yn('s24', '2.4. Justificación social (necesidad u oportunidad a aprovechar)')}
          ${yn('s25', '2.5. Limitaciones de la investigación')}
        </div>`;
      const sIII = `
        <div class="form-grid">
          ${yn('s31', '3.1. Antecedentes del estudio')}
          ${yn('s32', '3.2. Bases teóricas - científicas')}
          ${yn('s33', '3.3. Definición de términos básicos')}
        </div>`;
      const sIV = `
        <div class="form-grid">
          ${yn('s41', '4.1. Cuadro de operacionalización de variables e indicadores')}
          ${yn('s42', '4.2. Hipótesis (G.E.)')}
        </div>`;
      const sV = `
        <div class="form-grid">
          ${yn('s51', '5.1. Tipo de investigación: Aplicada')}
          ${yn('s52', '5.2. Diseño de investigación')}
          ${yn('s53', '5.3. Alcance de la investigación')}
          ${yn('s54', '5.4. Lugar y periodo de la investigación')}
          ${yn('s55', '5.5. Instrumentos de recolección de datos')}
          ${yn('s56', '5.6. Población y muestra')}
          ${yn('s57', '5.7. Plan de análisis estadístico de datos')}
        </div>`;
      const sVI = `
        <div class="form-grid">
          ${yn('s61', '6.1. Cronograma de actividades')}
        </div>`;
      const sVII = `
        <div class="form-grid">
          ${yn('s71', '7.1. Presupuesto')}
        </div>`;

      formWrap.innerHTML = `
        <div class="card__body">
          <h3 class="card__title">PROYECTO DE INVESTIGACIÓN TECNOLÓGICA</h3>
          ${secTpl('I. DATOS GENERALES', sI, true)}
          ${secTpl('II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', sII)}
          ${secTpl('III. MARCO TEÓRICO', sIII)}
          ${secTpl('IV. FORMULACIÓN DE HIPÓTESIS', sIV)}
          ${secTpl('V. METODOLOGÍA', sV)}
          ${secTpl('VI. CRONOGRAMA DE ACTIVIDADES', sVI)}
          ${secTpl('VII. PRESUPUESTO', sVII)}
          <div class="form-actions">
            <button id="btnSaveProyecto" class="btn">Guardar borrador</button>
            <button class="btn" onclick="history.back()">Cancelar</button>
          </div>
        </div>`;
      attachToggles(formWrap);

      const prev = await loadRespuestas('innovacion_pedagogica_form_proyecto');
      applyRespuestas(prev);
      document.getElementById('btnSaveProyecto').addEventListener('click', async () => {
        const respuestas = collectRespuestas();
        const ok = await saveRespuestas('innovacion_pedagogica_form_proyecto', respuestas);
        if (ok) alert('Guardado correctamente.');
      });

    } else {
      // ===== INFORME FINAL =====
      const if_I = `
        <div class="form-grid">
          ${yn('if_i1',  '1.1. Página de respeto')}
          ${yn('if_i2',  '1.2. Resolución Directoral de aprobación del proyecto')}
          ${yn('if_i3',  '1.3. Dedicatoria')}
          ${yn('if_i4',  '1.4. Agradecimiento')}
          ${yn('if_i5',  '1.5. Tabla de contenidos (índice)')}
          ${yn('if_i6',  '1.6. Introducción')}
          ${yn('if_i7',  '1.7. Resumen')}
        </div>`;
      const if_II = `
        <div class="form-grid">
          ${yn('if_ii11', '2.1. Identificación del problema (causas)')}
          ${yn('if_ii12', '2.2. Formulación del problema (G.E.)')}
          ${yn('if_ii13', '2.3. Objetivos de la Investigación (G.E.), verbo en infinitivo')}
          ${yn('if_ii14', '2.4. Justificación social (necesidad u oportunidad a aprovechar)')}
          ${yn('if_ii15', '2.5. Limitaciones de la investigación')}
        </div>`;
      const if_III = `
        <div class="form-grid">
          ${yn('if_iii21', '3.1. Antecedentes del estudio')}
          ${yn('if_iii22', '3.2. Bases teóricas - científicas')}
          ${yn('if_iii23', '3.3. Definición de términos básicos')}
        </div>`;
      const if_IV = `
        <div class="form-grid">
          ${yn('if_iv31', '4.1. Hipótesis (G.E.)')}
          ${yn('if_iv32', '4.2. Identificación y definición operacional de variables')}
        </div>`;
      const if_V = `
        <div class="form-grid">
          ${yn('if_v41', '5.1. Tipo de investigación')}
          ${yn('if_v42', '5.2. Diseño de investigación')}
          ${yn('if_v43', '5.3. Alcance de la investigación')}
          ${yn('if_v44', '5.4. Instrumento de recolección de datos')}
          ${yn('if_v45', '5.5. Población y muestra')}
          ${yn('if_v46', '5.6. Procesamiento estadístico y análisis de datos')}
        </div>`;
      const if_VI = `
        <div class="form-grid">
          ${yn('if_vi51', '6.1. Resultados')}
        </div>`;
      const if_VI_discussion = `
        <div class="form-grid">
          ${yn('if_vi61', '6.1. Contrastación de la Hipótesis con los resultados')}
          ${yn('if_vi62', '6.2. Contrastación de resultados con otros estudios')}
        </div>`;
      const if_VII = `
        <div class="form-grid">
          ${yn('if_vii1', '7.1. Conclusiones y Recomendaciones')}
        </div>`;
      const if_VIII = `
        <div class="form-grid">
          ${yn('if_viii1', '8.1. Referencias Bibliográficas - APA')}
        </div>`;
      const if_IX = `
        <div class="form-grid">
          ${yn('if_ix1', '9.1. Anexos')}
          ${yn('if_ix2', '9.2. Cuadro de operacionalización de variables e indicadores')}
          ${yn('if_ix3', '9.3. Matriz de consistencia')}
          ${yn('if_ix4', '9.4. Fuente de financiamiento')}
          ${yn('if_ix5', '9.5. Beneficiarios (directos e indirectos)')}
          ${yn('if_ix6', '9.6. Declaración jurada de autoría del proyecto')}
        </div>`;

      formWrap.innerHTML = `
        <div class="card__body">
          <h3 class="card__title">INFORME FINAL DE INVESTIGACIÓN TECNOLÓGICA</h3>
          ${secTpl('I. CARÁTULA', if_I, true)}
          ${secTpl('II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', if_II)}
          ${secTpl('III. MARCO TEÓRICO', if_III)}
          ${secTpl('IV. FORMULACIÓN DE HIPÓTESIS', if_IV)}
          ${secTpl('V. METODOLOGÍA', if_V)}
          ${secTpl('VI. RESULTADOS', if_VI)}
          ${secTpl('VI. DISCUSIÓN DE RESULTADOS', if_VI_discussion)}
          ${secTpl('VII. CONCLUSIONES Y RECOMENDACIONES', if_VII)}
          ${secTpl('VIII. REFERENCIAS BIBLIOGRÁFICAS - APA', if_VIII)}
          ${secTpl('IX. ANEXOS', if_IX)}
          <div class="form-actions">
            <button id="btnSaveInforme" class="btn">Guardar borrador</button>
            <button class="btn" onclick="history.back()">Cancelar</button>
          </div>
        </div>`;
      attachToggles(formWrap);

      const prevIF = await loadRespuestas('innovacion_pedagogica_form_informe');
      applyRespuestas(prevIF);

      document.getElementById('btnSaveInforme').addEventListener('click', async () => {
        const respuestas = collectRespuestas();
        const ok = await saveRespuestas('innovacion_pedagogica_form_informe', respuestas);
        if (ok) alert('Guardado correctamente.');
      });
    }

    formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Utilidad anti-XSS
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[s]);
}
