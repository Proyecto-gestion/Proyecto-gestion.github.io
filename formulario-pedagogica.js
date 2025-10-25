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
    .from('innovacion_pedagogica')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) { console.error(error); alert('Error al cargar el proyecto.'); return; }

  // Render info
  projectTitle.textContent = project.titulo || 'Sin título';
  projectAuthor.textContent = project.investigadores || '—';
  projectDescription.textContent = project.descripcion || '—';
  projectIdEl.textContent = project.id;

  // ----- Calcular Puntaje y Porcentaje -----
  const projectScore = document.getElementById('projectScore');
  const projectPercent = document.getElementById('projectPercent');

  try {
    // Cargar respuestas del formulario de proyecto
    const { data: formData, error: formError } = await supabase
      .from('innovacion_pedagogica_form_proyecto')
      .select('respuestas')
      .eq('project_id', projectId)
      .maybeSingle();

    if (formError) throw formError;

    if (formData?.respuestas) {
      const respuestas = formData.respuestas;

      // Asegúrate de que respuestas es un objeto
      const respuestasObj = typeof respuestas === 'string' ? JSON.parse(respuestas) : respuestas;

      // Verificación para evitar errores si respuestas es null o undefined
      const totalPreguntas = respuestasObj ? Object.keys(respuestasObj).length : 0;
      const totalSi = respuestasObj ? Object.values(respuestasObj).filter(v => v === 'si').length : 0;

      // Calcular puntaje y porcentaje
      const puntaje = totalSi; // cada "si" vale 1 punto
      const porcentaje = totalPreguntas > 0 ? ((totalSi / totalPreguntas) * 100).toFixed(2) : 0;

      // Mostrar en pantalla
      projectScore.textContent = puntaje;
      projectPercent.textContent = `${porcentaje}%`;

      // Cambiar color del porcentaje basado en el valor
      if (porcentaje >= 65) {
        projectPercent.classList.add('green');
        projectPercent.classList.remove('red');
      } else {
        projectPercent.classList.add('red');
        projectPercent.classList.remove('green');
      }
    } else {
      projectScore.textContent = '—';
      projectPercent.textContent = '—';
    }
  } catch (err) {
    console.error('Error al calcular puntaje/porcentaje:', err);
    projectScore.textContent = '—';
    projectPercent.textContent = '—';
  }

  // Botones
  btnProyecto.addEventListener('click', () => renderForm('proyecto', project));
  btnInforme.addEventListener('click', () => renderForm('informe', project));

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
          ${yn('s21', '2.1. Listado de situaciones problemáticas')}
          ${yn('s22', '2.2. Agrupación y priorización del problema')}
          ${yn('s23', '2.3. Definición de las causas y efectos del problema priorizado')}
          ${yn('s24', '2.4. Análisis de las potencialidades')}
        </div>`;
      const sIII = `
        <div class="form-grid">
          ${yn('s31', '3.1. Definición del objetivo central')}
          ${yn('s32', '3.2. Definición de los resultados')}
        </div>`;
      const sIV = `
        <div class="form-grid">
          ${yn('s41', '4.1. Fundamentación teórica del proyecto')}
        </div>`;
      const sV = `
        <div class="form-grid">
          ${yn('s51', '5.1. Tipo de investigación: Aplicada')}
          ${yn('s52', '5.2. Lugar y periodo de la investigación')}
          ${yn('s53', '5.3. Población beneficiaria')}
          ${yn('s54', '5.4. Fecha de inicio y fin del proyecto')}
        </div>`;
      const sVI = `
        <div class="form-grid">
          ${yn('s61', '6.1. Presupuesto del proyecto')}
        </div>`;
      const sVII = `
        <div class="form-grid">
          ${yn('s71', '7.1. Determinación de las actividades y las metas')}
          ${yn('s72', '7.2. Determinación del cronograma')}
          ${yn('s73', '7.3. Determinación de los responsables')}
        </div>`;

      formWrap.innerHTML = `
        <div class="card__body">
          <h3 class="card__title">PROYECTO DE INNOVACIÓN PEDAGÓGICA-INSTITUCIONAL</h3>
          ${secTpl('I. DATOS GENERALES', sI, true)}
          ${secTpl('II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', sII)}
          ${secTpl('III. DEFINICIÓN DE LOS OBJETIVOS Y LOS RESULTADOS', sIII)}
          ${secTpl('IV. FUNDAMENTACIÓN TEÓRICA DEL PROYECTO', sIV)}
          ${secTpl('V. METODOLOGÍA', sV)}
          ${secTpl('VI. PRESUPUESTO', sVI)}
          ${secTpl('VII. DETERMINACIÓN DE LAS ACTIVIDADES Y LAS METAS, DEL CRONOGRAMA Y RESPONSABLES', sVII)}
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
        </div>`;
      const if_II = `
        <div class="form-grid">
          ${yn('if_ii11', '2.1. Resumen del proyecto')}
        </div>`;
      const if_III = `
        <div class="form-grid">
          ${yn('if_iii21', '3.1. Problema principal')}
          ${yn('if_iii22', '3.2. Causas del problema principal')}
          ${yn('if_iii23', '3.3. Consecuencias del problema y necesidad de ser resuelta')}
        </div>`;
      const if_IV = `
        <div class="form-grid">
          ${yn('if_iv31', '4.1. Utilidad del proyecto')}
          ${yn('if_iv32', '4.2. Pertinencia del proyecto')}
          ${yn('if_iv33', '4.3. Limitaciones del proyecto')}
        </div>`;
      const if_V = `
        <div class="form-grid">
          ${yn('if_v51', '5.1. Beneficiarios directos')}
          ${yn('if_v52', '5.2. Beneficiarios indirectos')}
        </div>`;
      const if_VI = `
        <div class="form-grid">
          ${yn('if_vi1', '6.1. Fundamentos teóricos del proyecto')}
        </div>`;
      const if_VII = `
        <div class="form-grid">
          ${yn('if_vii1', '7.1. Objetivo central del proyecto')}
        </div>`;
      const if_VIII = `
        <div class="form-grid">
          ${yn('if_viii1', '8.1. Tipo de investigación')}
          ${yn('if_viii2', '8.2. Lugar y periodo de la investigación')}
          ${yn('if_viii3', '8.3. Fecha de inicio y fin del proyecto')}
        </div>`;
      const if_IX = `
        <div class="form-grid">
          ${yn('if_ix1', '9.1. Cronograma de actividades cumplidas')}
        </div>`;
      const if_X = `
        <div class="form-grid">
          ${yn('if_x1', '10.1. Descripción real de la inversión por actividad')}
          ${yn('if_x2', '10.2. Resumen de gastos de todas las actividades')}
        </div>`;
      const if_XI = `
        <div class="form-grid">
          ${yn('if_xi1', '11.1. Resultados, indicadores y medios de verificación')}
        </div>`;
      const if_XII = `
        <div class="form-grid">
          ${yn('if_xii1', '12.1. Actividades para la sostenibilidad del proyecto')}
          ${yn('if_xii2', '12.2. Replicabilidad del proyecto')}
        </div>`;
      const if_XIII = `
        <div class="form-grid">
          ${yn('if_xiii1', '13.1. Conclusiones y recomendaciones')}
        </div>`;
      const if_XIV = `
        <div class="form-grid">
          ${yn('if_xiv1', '14.1. Referencias Bibliográficas - APA')}
        </div>`;
      const if_Anexos = `
        <div class="form-grid">
          ${yn('if_anexos1', 'Anexos')}
          ${yn('if_anexos2', 'Matriz de consistencia')}
          ${yn('if_anexos3', 'Fuente de financiamiento')}
          ${yn('if_anexos4', 'Beneficiarios (directos e indirectos)')}
        </div>`;

      formWrap.innerHTML = `
        <div class="card__body">
          <h3 class="card__title">INFORME FINAL DE INNOVACIÓN PEDAGÓGICA-INSTITUCIONAL</h3>
          ${secTpl('I. CARÁTULA', if_I, true)}
          ${secTpl('II. DESCRIPCIÓN GENERAL DEL PROYECTO', if_II)}
          ${secTpl('III. IDENTIFICACIÓN DEL PROBLEMA', if_III)}
          ${secTpl('IV. JUSTIFICACIÓN DEL PROYECTO', if_IV)}
          ${secTpl('V. BENEFICIARIOS DEL PROYECTO', if_V)}
          ${secTpl('VI. FUNDAMENTACIÓN TEÓRICA DEL PROYECTO', if_VI)}
          ${secTpl('VII. OBJETIVOS Y RESULTADOS DEL PROYECTO', if_VII)}
          ${secTpl('VIII. METODOLOGÍA', if_VIII)}
          ${secTpl('IX. ACTIVIDADES, METAS Y RESPONSABLES DEL PROYECTO', if_IX)}
          ${secTpl('X. COSTOS DEL PROYECTO', if_X)}
          ${secTpl('XI. EVALUACIÓN DEL PROYECTO', if_XI)}
          ${secTpl('XII. SOSTENIBILIDAD DEL PROYECTO', if_XII)}
          ${secTpl('XIII. CONCLUSIONES Y RECOMENDACIONES', if_XIII)}
          ${secTpl('XIV. REFERENCIAS BIBLIOGRÁFICAS - APA', if_XIV)}
          ${secTpl('ANEXOS', if_Anexos)}
          <div class="form-actions">
            <button id="btnSaveInforme" class="btn">Guardar borrador</button>
            <button class="btn" onclick="history.back()">Cancelar</button>
          </div>
        </div>`;
    }

    // Scroll suave
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
