const STORAGE_KEY = 'deafissance-knowledge-base';
const ADMIN_CLASS = 'is-admin';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const elements = {
  adminToggle: document.getElementById('adminToggle'),
  addService: document.getElementById('addService'),
  addCategory: document.getElementById('addCategory'),
  addKnowledge: document.getElementById('addKnowledge'),
  serviceGrid: document.getElementById('serviceGrid'),
  categoryList: document.getElementById('categoryList'),
  categoryPlaceholder: document.getElementById('categoryPlaceholder'),
  knowledgeList: document.getElementById('knowledgeList'),
  knowledgePlaceholder: document.getElementById('knowledgePlaceholder'),
  knowledgeEditor: document.getElementById('knowledgeEditor'),
  emptyState: document.getElementById('emptyState'),
  knowledgeTitle: document.getElementById('knowledgeTitle'),
  knowledgeDefinition: document.getElementById('knowledgeDefinition'),
  knowledgeBreadcrumb: document.getElementById('knowledgeBreadcrumb'),
  deleteKnowledge: document.getElementById('deleteKnowledge'),
  saveKnowledge: document.getElementById('saveKnowledge'),
  addRootStep: document.getElementById('addRootStep'),
  stepTree: document.getElementById('stepTree'),
  progressBar: document.getElementById('progressBar'),
  progressValue: document.getElementById('progressValue'),
  incompletePaths: document.getElementById('incompletePaths'),
  toast: document.getElementById('toast'),
};

let state = loadState();

function createStep(label = 'Nouvelle étape', children = [], isFinal = false) {
  if (typeof children === 'boolean') {
    isFinal = children;
    children = [];
  }
  return {
    id: generateId(),
    label,
    isFinal,
    children,
  };
}

function createDefaultState() {
  const serviceId = generateId();
  const categoryId = generateId();
  const knowledgeId = generateId();

  return {
    services: [
      {
        id: serviceId,
        name: 'Réclamation',
        icon: 'fa-solid fa-people-group',
        description: 'Traiter les litiges clients et assurer un suivi personnalisé.',
        categories: [
          {
            id: categoryId,
            name: 'Livraison',
            knowledges: [
              {
                id: knowledgeId,
                title: 'GP FO TEL | Objet non parvenu ni trouvé',
                definition:
                  "Le client ne retrouve pas son colis au-delà de 48h après le dépôt. Déclencher la procédure de réclamation adaptée.",
                steps: [
                  createStep('Front office', [
                    createStep('Vérifier le statut de la livraison'),
                    createStep('Créer un dossier de réclamation', [
                      createStep('Informer le client du suivi', true),
                    ]),
                  ]),
                  createStep('Back office', [
                    createStep('Analyser la traçabilité'),
                    createStep('Contacter le transporteur', [
                      createStep('Clôturer si colis retrouvé', true),
                      createStep('Escalader si colis perdu', true),
                    ]),
                  ]),
                ],
              },
            ],
          },
        ],
      },
      {
        id: generateId(),
        name: 'Information',
        icon: 'fa-solid fa-circle-info',
        description: 'Documents de référence et notes de service.',
        categories: [],
      },
      {
        id: generateId(),
        name: 'Demandes client',
        icon: 'fa-solid fa-pen-to-square',
        description: 'Suivi des demandes et des réponses envoyées.',
        categories: [],
      },
      {
        id: generateId(),
        name: 'Recours',
        icon: 'fa-solid fa-gavel',
        description: 'Gestion des recours et dossiers complexes.',
        categories: [],
      },
      {
        id: generateId(),
        name: 'Taxes et douanes',
        icon: 'fa-solid fa-passport',
        description: 'Informations sur les droits et formalités douanières.',
        categories: [],
      },
      {
        id: generateId(),
        name: 'Actualités',
        icon: 'fa-solid fa-newspaper',
        description: 'Dernières mises à jour et communications internes.',
        categories: [],
      },
    ],
    selectedServiceId: serviceId,
    selectedCategoryId: categoryId,
    selectedKnowledgeId: knowledgeId,
    adminMode: true,
  };
}

function normalizeService(service) {
  const categories = Array.isArray(service.categories) ? service.categories : [];
  return {
    id: service.id ?? generateId(),
    name: service.name ?? 'Nouveau service',
    icon: service.icon ?? 'fa-solid fa-briefcase',
    description: service.description ?? '',
    categories: categories.map((category) => ({
      id: category.id ?? generateId(),
      name: category.name ?? 'Sans nom',
      knowledges: Array.isArray(category.knowledges)
        ? category.knowledges.map((knowledge) => ({
            id: knowledge.id ?? generateId(),
            title: knowledge.title ?? 'Sans titre',
            definition: knowledge.definition ?? '',
            steps: Array.isArray(knowledge.steps) ? knowledge.steps : [],
          }))
        : [],
    })),
  };
}

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.services)) {
        const services = parsed.services.map(normalizeService);
        const fallbackServiceId = services[0]?.id ?? null;
        const selectedServiceId = parsed.selectedServiceId ?? fallbackServiceId;
        const service = services.find((s) => s.id === selectedServiceId);
        const fallbackCategoryId = service?.categories[0]?.id ?? null;
        const selectedCategoryId = parsed.selectedCategoryId ?? fallbackCategoryId;
        const category = service?.categories.find((c) => c.id === selectedCategoryId);
        const fallbackKnowledgeId = category?.knowledges[0]?.id ?? null;
        const selectedKnowledgeId = parsed.selectedKnowledgeId ?? fallbackKnowledgeId;

        const adminMode = parsed.adminMode ?? true;
        return {
          services,
          selectedServiceId,
          selectedCategoryId,
          selectedKnowledgeId,
          adminMode,
        };
      }

      if (Array.isArray(parsed.categories)) {
        const defaultState = createDefaultState();
        defaultState.services[0].categories = parsed.categories.map((category) => ({
          ...category,
          id: category.id ?? generateId(),
          knowledges: Array.isArray(category.knowledges)
            ? category.knowledges.map((knowledge) => ({
                ...knowledge,
                id: knowledge.id ?? generateId(),
                steps: Array.isArray(knowledge.steps) ? knowledge.steps : [],
              }))
            : [],
        }));
        defaultState.selectedCategoryId =
          parsed.selectedCategoryId ?? defaultState.services[0].categories[0]?.id ?? null;
        defaultState.selectedKnowledgeId =
          parsed.selectedKnowledgeId ??
          defaultState.services[0].categories[0]?.knowledges[0]?.id ??
            defaultState.selectedKnowledgeId;
        defaultState.adminMode = Boolean(parsed.adminMode ?? true);
        return defaultState;
      }
    } catch (error) {
      console.warn('Impossible de charger les données sauvegardées.', error);
    }
  }

  return createDefaultState();
}

function saveState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      services: state.services,
      selectedServiceId: state.selectedServiceId,
      selectedCategoryId: state.selectedCategoryId,
      selectedKnowledgeId: state.selectedKnowledgeId,
      adminMode: state.adminMode,
    })
  );
}

function setAdminMode(enabled) {
  state.adminMode = enabled;
  document.body.classList.toggle(ADMIN_CLASS, enabled);
  elements.addService.disabled = !enabled;
  elements.addCategory.disabled = !enabled;
  elements.addKnowledge.disabled = !enabled;
  elements.deleteKnowledge.disabled = !enabled;
  elements.saveKnowledge.disabled = !enabled;
  elements.addRootStep.disabled = !enabled;
  elements.stepTree.classList.toggle('readonly', !enabled);
  elements.adminToggle.classList.toggle('active', enabled);
  elements.knowledgeTitle.toggleAttribute('readonly', !enabled);
  elements.knowledgeDefinition.toggleAttribute('readonly', !enabled);
}

function ensureSelectionConsistency() {
  if (state.services.length === 0) {
    state.selectedServiceId = null;
    state.selectedCategoryId = null;
    state.selectedKnowledgeId = null;
    return;
  }

  let service = getSelectedService();
  if (!service) {
    state.selectedServiceId = state.services[0].id;
    service = getSelectedService();
  }

  if (!service) {
    state.selectedCategoryId = null;
    state.selectedKnowledgeId = null;
    return;
  }

  if (!service.categories.some((category) => category.id === state.selectedCategoryId)) {
    state.selectedCategoryId = service.categories[0]?.id ?? null;
  }

  const category = getSelectedCategory();
  if (!category) {
    state.selectedKnowledgeId = null;
    return;
  }

  if (!category.knowledges.some((knowledge) => knowledge.id === state.selectedKnowledgeId)) {
    state.selectedKnowledgeId = category.knowledges[0]?.id ?? null;
  }
}

function render() {
  ensureSelectionConsistency();
  renderServices();
  renderCategories();
  renderKnowledges();
  renderEditor();
  saveState();
}

function renderServices() {
  elements.serviceGrid.innerHTML = '';

  if (state.services.length === 0) {
    const message = document.createElement('div');
    message.className = 'panel__placeholder is-visible';
    message.textContent = 'Ajoutez un service pour commencer.';
    elements.serviceGrid.appendChild(message);
    return;
  }

  state.services.forEach((service) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'service-card';
    button.dataset.id = service.id;

    const icon = document.createElement('div');
    icon.className = 'service-card__icon';
    const iconElement = document.createElement('i');
    iconElement.className = service.icon || 'fa-solid fa-briefcase';
    icon.appendChild(iconElement);

    const title = document.createElement('h3');
    title.className = 'service-card__title';
    title.textContent = service.name || 'Sans nom';

    const description = document.createElement('p');
    description.className = 'service-card__desc';
    description.textContent = service.description || 'Décrivez le périmètre de ce service.';

    const footer = document.createElement('div');
    footer.className = 'service-card__footer';
    const stats = document.createElement('span');
    const categoryCount = service.categories.length;
    const knowledgeCount = service.categories.reduce(
      (total, category) => total + category.knowledges.length,
      0
    );
    stats.textContent = `${categoryCount} catégories · ${knowledgeCount} connaissances`;
    const ctaIcon = document.createElement('i');
    ctaIcon.className = 'fa-solid fa-arrow-right';
    footer.append(stats, ctaIcon);

    button.append(icon, title, description, footer);

    if (state.selectedServiceId === service.id) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      state.selectedServiceId = service.id;
      state.selectedCategoryId = service.categories[0]?.id ?? null;
      state.selectedKnowledgeId = service.categories[0]?.knowledges[0]?.id ?? null;
      render();
    });

    elements.serviceGrid.appendChild(button);
  });
}

function renderCategories() {
  const service = getSelectedService();
  const list = elements.categoryList;
  const placeholder = elements.categoryPlaceholder;

  list.innerHTML = '';
  list.hidden = false;
  placeholder.classList.remove('is-visible');

  if (!service) {
    placeholder.textContent = 'Ajoutez un service pour créer vos catégories.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    elements.addCategory.disabled = true;
    return;
  }

  elements.addCategory.disabled = !state.adminMode;

  if (service.categories.length === 0) {
    placeholder.textContent = 'Aucune catégorie. Ajoutez-en une pour démarrer.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    return;
  }

  service.categories.forEach((category) => {
    const item = document.createElement('li');
    item.dataset.id = category.id;
    item.textContent = category.name || 'Sans nom';
    if (state.selectedCategoryId === category.id) {
      item.classList.add('active');
    }
    item.addEventListener('click', () => {
      state.selectedCategoryId = category.id;
      state.selectedKnowledgeId = category.knowledges[0]?.id ?? null;
      render();
    });
    list.appendChild(item);
  });
}

function renderKnowledges() {
  const category = getSelectedCategory();
  const list = elements.knowledgeList;
  const placeholder = elements.knowledgePlaceholder;

  list.innerHTML = '';
  list.hidden = false;
  placeholder.classList.remove('is-visible');

  if (!category) {
    placeholder.textContent = 'Choisissez une catégorie pour voir ses connaissances.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    elements.addKnowledge.disabled = true;
    return;
  }

  elements.addKnowledge.disabled = !state.adminMode;

  if (!category.knowledges.length) {
    placeholder.textContent = 'Aucune connaissance. Ajoutez la première fiche.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    return;
  }

  category.knowledges.forEach((knowledge) => {
    const item = document.createElement('li');
    item.dataset.id = knowledge.id;
    item.textContent = knowledge.title || 'Sans titre';
    if (state.selectedKnowledgeId === knowledge.id) {
      item.classList.add('active');
    }
    item.addEventListener('click', () => {
      state.selectedKnowledgeId = knowledge.id;
      render();
    });
    list.appendChild(item);
  });
}

function renderEditor() {
  const service = getSelectedService();
  const category = getSelectedCategory();
  const knowledge = getSelectedKnowledge();

  if (!service || !category || !knowledge) {
    elements.emptyState.hidden = false;
    elements.knowledgeEditor.hidden = true;
    return;
  }

  elements.emptyState.hidden = true;
  elements.knowledgeEditor.hidden = false;

  elements.knowledgeTitle.value = knowledge.title || '';
  elements.knowledgeDefinition.value = knowledge.definition || '';
  elements.knowledgeBreadcrumb.textContent = `${service.name} › ${category.name} › ${
    knowledge.title || 'Sans titre'
  }`;

  renderTree(knowledge.steps || []);
  updateProgress(knowledge.steps || []);
}

function renderTree(steps) {
  elements.stepTree.innerHTML = '';
  steps.forEach((step) => {
    const node = createTreeNode(step);
    elements.stepTree.appendChild(node);
  });
}

function createTreeNode(step) {
  const template = document.getElementById('treeNodeTemplate');
  const node = template.content.firstElementChild.cloneNode(true);
  const label = node.querySelector('.tree-node__text');
  const toggle = node.querySelector('.tree-node__toggle');
  const addButton = node.querySelector('[data-action="add"]');
  const deleteButton = node.querySelector('[data-action="delete"]');
  const checkbox = node.querySelector('.tree-node__final');
  const childrenContainer = node.querySelector('.tree-node__children');

  node.dataset.id = step.id;
  label.textContent = step.label;
  checkbox.checked = !!step.isFinal;

  if (!state.adminMode) {
    addButton.hidden = true;
    deleteButton.hidden = true;
    checkbox.disabled = true;
  }

  if (!step.children || step.children.length === 0) {
    toggle.style.visibility = 'hidden';
  }

  toggle.addEventListener('click', () => {
    const collapsed = node.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed', collapsed);
    childrenContainer.hidden = collapsed;
  });

  label.addEventListener('dblclick', () => {
    if (!state.adminMode) return;
    label.contentEditable = 'true';
    label.focus();
    document.execCommand('selectAll', false, null);
  });

  label.addEventListener('blur', () => {
    if (label.isContentEditable) {
      label.contentEditable = 'false';
      updateStepLabel(step.id, label.textContent.trim() || 'Sans nom');
    }
  });

  label.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      label.blur();
    }
  });

  addButton.addEventListener('click', () => {
    addChildStep(step.id);
  });

  deleteButton.addEventListener('click', () => {
    deleteStep(step.id);
  });

  checkbox.addEventListener('change', () => {
    toggleStepFinal(step.id, checkbox.checked);
  });

  if (step.children && step.children.length > 0) {
    step.children.forEach((child) => {
      const childNode = createTreeNode(child);
      childrenContainer.appendChild(childNode);
    });
  }

  return node;
}

function addService() {
  if (!state.adminMode) return;
  const name = prompt('Nom du service :');
  if (!name) return;

  const description = prompt('Description du service (optionnel) :') || '';
  const icon =
    prompt(
      'Icône Font Awesome (ex: fa-solid fa-circle-info). Laissez vide pour utiliser celle par défaut :'
    ) || '';

  const service = {
    id: generateId(),
    name: name.trim(),
    description: description.trim(),
    icon: icon.trim() || 'fa-solid fa-briefcase',
    categories: [],
  };

  state.services.push(service);
  state.selectedServiceId = service.id;
  state.selectedCategoryId = null;
  state.selectedKnowledgeId = null;
  render();
  showToast('Service ajouté');
}

function addCategory() {
  if (!state.adminMode) return;
  const service = getSelectedService();
  if (!service) return;

  const name = prompt('Nom de la nouvelle catégorie :');
  if (!name) return;

  const category = {
    id: generateId(),
    name: name.trim(),
    knowledges: [],
  };

  service.categories.unshift(category);
  state.selectedCategoryId = category.id;
  state.selectedKnowledgeId = null;
  render();
  showToast('Catégorie ajoutée');
}

function addKnowledge() {
  if (!state.adminMode) return;
  const category = getSelectedCategory();
  if (!category) return;

  const title = prompt('Titre de la connaissance :');
  if (!title) return;

  const knowledge = {
    id: generateId(),
    title: title.trim(),
    definition: '',
    steps: [],
  };

  category.knowledges.unshift(knowledge);
  state.selectedKnowledgeId = knowledge.id;
  render();
  showToast('Connaissance créée');
}

function deleteKnowledge() {
  if (!state.adminMode) return;
  const category = getSelectedCategory();
  const knowledge = getSelectedKnowledge();
  if (!category || !knowledge) return;

  const confirmDelete = confirm('Supprimer cette connaissance ?');
  if (!confirmDelete) return;

  category.knowledges = category.knowledges.filter((k) => k.id !== knowledge.id);
  state.selectedKnowledgeId = category.knowledges[0]?.id ?? null;
  render();
  showToast('Connaissance supprimée');
}

function saveKnowledge() {
  if (!state.adminMode) return;
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  knowledge.title = elements.knowledgeTitle.value.trim() || 'Sans titre';
  knowledge.definition = elements.knowledgeDefinition.value.trim();

  render();
  showToast('Modifications enregistrées');
}

function addRootStep() {
  if (!state.adminMode) return;
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  const label = prompt('Point de départ du chemin :');
  if (!label) return;

  knowledge.steps.push(createStep(label.trim()));
  render();
  showToast('Nouvelle étape ajoutée');
}

function addChildStep(stepId) {
  if (!state.adminMode) return;
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  const step = findStepById(knowledge.steps, stepId);
  if (!step) return;

  const label = prompt('Nom de l’embranchement :');
  if (!label) return;

  step.children = step.children || [];
  step.children.push(createStep(label.trim()));
  step.isFinal = false;
  render();
  showToast('Embranchement ajouté');
}

function deleteStep(stepId) {
  if (!state.adminMode) return;
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  const confirmDelete = confirm('Supprimer cette étape et ses sous-étapes ?');
  if (!confirmDelete) return;

  knowledge.steps = removeStepById(knowledge.steps, stepId);
  render();
  showToast('Étape supprimée');
}

function toggleStepFinal(stepId, isFinal) {
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  const step = findStepById(knowledge.steps, stepId);
  if (!step) return;

  step.isFinal = isFinal;
  if (isFinal) {
    step.children = [];
  }
  render();
}

function updateStepLabel(stepId, label) {
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;
  const step = findStepById(knowledge.steps, stepId);
  if (!step) return;
  step.label = label;
  render();
}

function findStepById(steps, id) {
  for (const step of steps) {
    if (step.id === id) return step;
    const child = findStepById(step.children || [], id);
    if (child) return child;
  }
  return null;
}

function removeStepById(steps, id) {
  return steps
    .filter((step) => step.id !== id)
    .map((step) => ({
      ...step,
      children: removeStepById(step.children || [], id),
    }));
}

function updateProgress(steps) {
  const leaves = collectLeaves(steps);
  const total = leaves.length;
  const completed = leaves.filter((leaf) => leaf.isFinal).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.progressBar.style.width = `${percent}%`;
  elements.progressValue.textContent = `${percent}%`;

  const incomplete = leaves.filter((leaf) => !leaf.isFinal);
  const container = elements.incompletePaths;
  const list = container.querySelector('ul');
  list.innerHTML = '';

  if (incomplete.length === 0) {
    container.hidden = true;
    return;
  }

  incomplete.forEach((leaf) => {
    const item = document.createElement('li');
    item.textContent = leaf.path.join(' › ');
    list.appendChild(item);
  });

  container.hidden = false;
}

function collectLeaves(steps, path = [], leaves = []) {
  steps.forEach((step) => {
    const currentPath = [...path, step.label];
    if (!step.children || step.children.length === 0) {
      leaves.push({ ...step, path: currentPath });
    } else {
      collectLeaves(step.children, currentPath, leaves);
    }
  });
  return leaves;
}

function getSelectedService() {
  return state.services.find((service) => service.id === state.selectedServiceId) ?? null;
}

function getSelectedCategory() {
  const service = getSelectedService();
  if (!service) return null;
  return service.categories.find((category) => category.id === state.selectedCategoryId) ?? null;
}

function getSelectedKnowledge() {
  const category = getSelectedCategory();
  if (!category) return null;
  return (
    category.knowledges.find((knowledge) => knowledge.id === state.selectedKnowledgeId) ?? null
  );
}

function showToast(message) {
  if (!message) return;
  elements.toast.querySelector('span').textContent = message;
  elements.toast.hidden = false;
  setTimeout(() => {
    elements.toast.hidden = true;
  }, 2000);
}

// Event bindings

elements.adminToggle.addEventListener('click', () => {
  setAdminMode(!state.adminMode);
  render();
});

elements.addService.addEventListener('click', addService);
elements.addCategory.addEventListener('click', addCategory);
elements.addKnowledge.addEventListener('click', addKnowledge);
elements.deleteKnowledge.addEventListener('click', deleteKnowledge);
elements.saveKnowledge.addEventListener('click', saveKnowledge);
elements.addRootStep.addEventListener('click', addRootStep);

function initialize() {
  setAdminMode(state.adminMode);
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
