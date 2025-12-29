(function () {
  const page = document.documentElement.dataset.page;

  const STORAGE_KEY = 'maker-portfolio-projects-v1';

  const projectStore = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.warn('Unable to read stored projects', err);
        return [];
      }
    },
    save(projects) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      } catch (err) {
        console.warn('Unable to save projects', err);
      }
    },
    clear() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('Unable to clear projects', err);
      }
    }
  };

  /**
   * Placeholder for future Claude (or other LLM) integration.
   * Swap this function's internals with an API call and return
   * a structured project object to keep the rendering layer untouched.
   */
  function formatProjectWithAI(rawText, providedTitle) {
    const text = rawText.trim();
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

    const pickByKeyword = (keywords) => {
      const needle = new RegExp(`^(${keywords.join('|')}):?`, 'i');
      const hit = lines.find(l => needle.test(l));
      if (!hit) return '';
      return hit.replace(needle, '').trim();
    };

    const extractList = (keywords) => {
      const needle = new RegExp(`^(${keywords.join('|')})[:\-]?`, 'i');
      const candidates = lines
        .filter(l => needle.test(l))
        .flatMap(l => l.replace(needle, '').split(/[,;]/))
        .map(item => item.trim())
        .filter(Boolean);
      return Array.from(new Set(candidates)).slice(0, 8);
    };

    const sentences = text
      .replace(/\s+/g, ' ')
      .match(/[^.!?]+[.!?]?/g) || [];

    const title = providedTitle || (sentences[0] ? sentences[0].split(':')[0].slice(0, 80) : 'Untitled project');
    const description = sentences.slice(0, 3).join(' ').trim();

    const technologies = extractList(['tech', 'stack', 'technologies', 'tools']);
    const challenges = pickByKeyword(['challenge', 'challenges', 'problem', 'issue']) || sentences.slice(3, 5).join(' ');
    const outcome = pickByKeyword(['outcome', 'result', 'impact']) || sentences.slice(-2).join(' ');

    // Placeholder media slots that a future uploader could populate.
    const media = [];

    return {
      title: title || 'Untitled project',
      description: description || text || 'No description provided yet.',
      technologies,
      challenges: challenges || 'Details pending.',
      outcome: outcome || 'Outcome not captured yet.',
      media
    };
  }

  function createSection(label, content) {
    const wrapper = document.createElement('div');
    const labelEl = document.createElement('p');
    labelEl.className = 'section-label';
    labelEl.textContent = label;

    const box = document.createElement('div');
    box.className = 'section-box';

    if (Array.isArray(content) && content.length) {
      const ul = document.createElement('ul');
      content.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      box.appendChild(ul);
    } else {
      const p = document.createElement('p');
      p.textContent = typeof content === 'string' ? content : 'Not provided.';
      box.appendChild(p);
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(box);
    return wrapper;
  }

  function buildProjectCard(project) {
    const details = document.createElement('details');
    details.className = 'project-card';
    details.open = false;

    const summary = document.createElement('summary');
    summary.className = 'project-header';

    const title = document.createElement('h3');
    title.className = 'project-title';
    title.textContent = project.title;

    const meta = document.createElement('span');
    meta.className = 'meta';
    const date = new Date(project.createdAt || Date.now());
    meta.textContent = `Captured ${date.toLocaleDateString()} · ${project.rawText ? 'From intake' : 'Generated'}`;

    summary.appendChild(title);
    summary.appendChild(meta);

    const body = document.createElement('div');
    body.className = 'project-body';
    body.appendChild(createSection('Description', project.description));
    body.appendChild(createSection('Technologies', project.technologies && project.technologies.length ? project.technologies : ['Not specified']));
    body.appendChild(createSection('Challenges', project.challenges));
    body.appendChild(createSection('Outcome', project.outcome));
    body.appendChild(createSection('Media', project.media && project.media.length ? project.media : ['Add links or media later.']));

    details.appendChild(summary);
    details.appendChild(body);
    return details;
  }

  function renderProjects(projects, container) {
    container.innerHTML = '';
    if (!projects.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No projects captured yet. Paste notes and ingest to see structured cards here.';
      container.appendChild(empty);
      return;
    }

    projects.forEach(project => {
      const card = buildProjectCard(project);
      container.appendChild(card);
    });
  }

  function wireProjectsPage() {
    const form = document.getElementById('intake-form');
    const titleInput = document.getElementById('project-title');
    const notesInput = document.getElementById('project-notes');
    const statusEl = document.getElementById('status');
    const container = document.getElementById('projects-container');
    const clearBtn = document.getElementById('clear-storage');

    if (!form || !notesInput || !container) return;

    let projects = projectStore.load();
    renderProjects(projects, container);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const rawText = notesInput.value.trim();
      const providedTitle = titleInput.value.trim();

      if (!rawText) {
        statusEl.textContent = 'Please paste some project details first.';
        return;
      }

      // Mock AI formatting; replace with API call later.
      const structured = formatProjectWithAI(rawText, providedTitle);
      const now = new Date();
      const record = {
        id: `${now.getTime()}-${Math.random().toString(16).slice(2, 7)}`,
        rawText,
        createdAt: now.toISOString(),
        ...structured
      };

      projects.unshift(record);
      projectStore.save(projects);
      renderProjects(projects, container);

      statusEl.textContent = 'Project ingested and structured locally.';
      form.reset();
    });

    clearBtn?.addEventListener('click', () => {
      projectStore.clear();
      projects = [];
      renderProjects(projects, container);
      statusEl.textContent = 'Stored projects cleared.';
    });
  }

  if (page === 'projects') {
    document.addEventListener('DOMContentLoaded', wireProjectsPage);
  }
})();
