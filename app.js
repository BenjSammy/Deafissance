const STORAGE_KEY = 'deafissance-knowledge-base';
const ADMIN_CLASS = 'is-admin';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const elements = {
  adminToggle: document.getElementById('adminToggle'),
  addService: document.getElementById('addService'),
  serviceGrid: document.getElementById('serviceGrid'),
  knowledgeList: document.getElementById('knowledgeList'),
  knowledgePlaceholder: document.getElementById('knowledgePlaceholder'),
  emptyState: document.getElementById('emptyState'),
  knowledgeViewer: document.getElementById('knowledgeViewer'),
  viewerKnowledgeTitle: document.getElementById('viewerKnowledgeTitle'),
  viewerBreadcrumb: document.getElementById('viewerBreadcrumb'),
  viewerDefinition: document.getElementById('viewerDefinition'),
  viewerStepTitle: document.getElementById('viewerStepTitle'),
  viewerStatus: document.getElementById('viewerStatus'),
  viewerOptions: document.getElementById('viewerOptions'),
  viewerReset: document.getElementById('viewerReset'),
  viewerBack: document.getElementById('viewerBack'),
  adminOverlay: document.getElementById('adminOverlay'),
  adminBackdrop: document.getElementById('adminBackdrop'),
  closeAdmin: document.getElementById('closeAdmin'),
  adminAddService: document.getElementById('adminAddService'),
  adminAddKnowledge: document.getElementById('adminAddKnowledge'),
  adminServiceList: document.getElementById('adminServiceList'),
  adminKnowledgeList: document.getElementById('adminKnowledgeList'),
  adminKnowledgePlaceholder: document.getElementById('adminKnowledgePlaceholder'),
  adminEmptyState: document.getElementById('adminEmptyState'),
  knowledgeEditor: document.getElementById('knowledgeEditor'),
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
let viewerPath = [];

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
  const knowledgeId = generateId();

  return {
    services: [
      {
        id: serviceId,
        name: 'Réclamation',
        icon: 'fa-solid fa-people-group',
        description: 'Traiter les litiges clients et assurer un suivi personnalisé.',
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
      {
        id: generateId(),
        name: 'Information',
        icon: 'fa-solid fa-circle-info',
        description: 'Documents de référence et notes de service.',
        knowledges: [],
      },
      {
        id: generateId(),
        name: 'Demandes client',
        icon: 'fa-solid fa-pen-to-square',
        description: 'Suivi des demandes et des réponses envoyées.',
        knowledges: [],
      },
      {
        id: generateId(),
        name: 'Recours',
        icon: 'fa-solid fa-gavel',
        description: 'Gestion des recours et dossiers complexes.',
        knowledges: [],
      },
      {
        id: generateId(),
        name: 'Taxes et douanes',
        icon: 'fa-solid fa-passport',
        description: 'Informations sur les droits et formalités douanières.',
        knowledges: [],
      },
      {
        id: generateId(),
        name: 'Actualités',
        icon: 'fa-solid fa-newspaper',
        description: 'Dernières mises à jour et communications internes.',
        knowledges: [],
      },
    ],
    selectedServiceId: serviceId,
    selectedKnowledgeId: knowledgeId,
    adminMode: false,
  };
}

function normalizeKnowledge(knowledge, categoryName = null) {
  return {
    id: knowledge.id ?? generateId(),
    title: knowledge.title ?? 'Sans titre',
    definition: knowledge.definition ?? '',
    steps: Array.isArray(knowledge.steps) ? knowledge.steps : [],
    category: knowledge.category ?? categoryName ?? null,
  };
}

function normalizeService(service) {
  const knowledges = [];

  if (Array.isArray(service.categories)) {
    service.categories.forEach((category) => {
      const entries = Array.isArray(category.knowledges) ? category.knowledges : [];
      entries.forEach((knowledge) => {
        knowledges.push(normalizeKnowledge(knowledge, category.name ?? null));
      });
    });
  }

  if (Array.isArray(service.knowledges)) {
    service.knowledges.forEach((knowledge) => {
      knowledges.push(normalizeKnowledge(knowledge));
    });
  }

  return {
    id: service.id ?? generateId(),
    name: service.name ?? 'Nouveau service',
    icon: service.icon ?? 'fa-solid fa-briefcase',
    description: service.description ?? '',
    knowledges,
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
        const service = services.find((item) => item.id === selectedServiceId);
        const fallbackKnowledgeId = service?.knowledges[0]?.id ?? null;
        const selectedKnowledgeId = parsed.selectedKnowledgeId ?? fallbackKnowledgeId;
        const adminMode = Boolean(parsed.adminMode);

        return {
          services,
          selectedServiceId,
          selectedKnowledgeId,
          adminMode,
        };
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
      selectedKnowledgeId: state.selectedKnowledgeId,
      adminMode: state.adminMode,
    })
  );
}

function setAdminMode(enabled) {
  state.adminMode = enabled;
  document.body.classList.toggle(ADMIN_CLASS, enabled);
  elements.adminOverlay.hidden = !enabled;
  elements.addService.disabled = !enabled;
  renderAdminPanel();
}

function ensureSelectionConsistency() {
  if (state.services.length === 0) {
    state.selectedServiceId = null;
    state.selectedKnowledgeId = null;
    viewerPath = [];
    return;
  }

  let service = getSelectedService();
  if (!service) {
    state.selectedServiceId = state.services[0].id;
    service = getSelectedService();
  }

  if (!service) {
    state.selectedKnowledgeId = null;
    viewerPath = [];
    return;
  }

  if (!service.knowledges.some((knowledge) => knowledge.id === state.selectedKnowledgeId)) {
    state.selectedKnowledgeId = service.knowledges[0]?.id ?? null;
  }
}

function ensureViewerPath() {
  const knowledge = getSelectedKnowledge();
  if (!knowledge) {
    viewerPath = [];
    return;
  }

  const validPath = [];
  let steps = knowledge.steps || [];

  for (const stepId of viewerPath) {
    const next = steps.find((step) => step.id === stepId);
    if (!next) break;
    validPath.push(next.id);
    steps = next.children || [];
  }

  viewerPath = validPath;
}

function resetViewerPath() {
  viewerPath = [];
}

function render() {
  ensureSelectionConsistency();
  ensureViewerPath();
  renderServices();
  renderKnowledgeList();
  renderViewer();
  renderAdminPanel();
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
    const knowledgeCount = service.knowledges.length;
    const stats = document.createElement('span');
    stats.textContent = `${knowledgeCount} fiche${knowledgeCount > 1 ? 's' : ''}`;
    const ctaIcon = document.createElement('i');
    ctaIcon.className = 'fa-solid fa-arrow-right';
    footer.append(stats, ctaIcon);

    button.append(icon, title, description, footer);

    if (state.selectedServiceId === service.id) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      state.selectedServiceId = service.id;
      state.selectedKnowledgeId = service.knowledges[0]?.id ?? null;
      resetViewerPath();
      render();
    });

    elements.serviceGrid.appendChild(button);
  });
}

function renderKnowledgeList() {
  const service = getSelectedService();
  const list = elements.knowledgeList;
  const placeholder = elements.knowledgePlaceholder;

  list.innerHTML = '';
  list.hidden = false;
  placeholder.classList.remove('is-visible');

  if (!service) {
    placeholder.textContent = 'Ajoutez un service pour créer vos connaissances.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    return;
  }

  if (!service.knowledges.length) {
    placeholder.textContent = 'Aucune connaissance. Ajoutez la première fiche via le mode admin.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    return;
  }

  service.knowledges.forEach((knowledge) => {
    const item = document.createElement('li');
    item.dataset.id = knowledge.id;
    item.textContent = knowledge.title || 'Sans titre';
    if (state.selectedKnowledgeId === knowledge.id) {
      item.classList.add('active');
    }
    item.addEventListener('click', () => {
      state.selectedKnowledgeId = knowledge.id;
      resetViewerPath();
      render();
    });
    list.appendChild(item);
  });
}

function renderViewer() {
  const service = getSelectedService();
  const knowledge = getSelectedKnowledge();

  if (!service || !knowledge) {
    elements.emptyState.hidden = false;
    elements.knowledgeViewer.hidden = true;
    return;
  }

  elements.emptyState.hidden = true;
  elements.knowledgeViewer.hidden = false;

  elements.viewerKnowledgeTitle.textContent = knowledge.title || 'Sans titre';
  const breadcrumb = [service.name || 'Service'];
  if (knowledge.category) {
    breadcrumb.push(knowledge.category);
  }
  elements.viewerBreadcrumb.textContent = breadcrumb.join(' › ');
  elements.viewerDefinition.textContent =
    knowledge.definition?.trim() || 'Aucune définition renseignée pour le moment.';

  const context = getViewerContext(knowledge);
  const status = elements.viewerStatus;
  const optionsContainer = elements.viewerOptions;
  const hasPath = context.labels.length > 0;

  elements.viewerStepTitle.textContent = hasPath ? context.labels.join(' › ') : 'Point de départ';
  elements.viewerBack.disabled = viewerPath.length === 0;
  elements.viewerReset.disabled = viewerPath.length === 0;

  status.className = 'knowledge-viewer__status';
  optionsContainer.innerHTML = '';

  if (!context.hasAnyStep) {
    status.textContent =
      "Aucun chemin n'est configuré pour cette connaissance. Complétez-la dans le mode admin.";
    status.classList.add('is-empty');
    return;
  }

  if (context.reachedFinal) {
    status.textContent = 'Fin de chemin atteinte. Vous pouvez revenir en arrière ou recommencer.';
    status.classList.add('is-final');
    return;
  }

  if (context.isIncompleteLeaf) {
    status.textContent =
      "Cette étape n'a pas encore de suite. Consultez l'administration pour compléter le chemin.";
    status.classList.add('is-warning');
    return;
  }

  status.textContent = 'Sélectionnez la suite du parcours.';
  status.classList.add('is-info');

  context.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'viewer-option';

    const badge = document.createElement('span');
    badge.className = 'viewer-option__badge';
    badge.textContent = getOptionLetter(index);

    const label = document.createElement('span');
    label.className = 'viewer-option__label';
    label.textContent = option.label || `Option ${getOptionLetter(index)}`;

    button.append(badge, label);
    button.addEventListener('click', () => {
      viewerPath = [...viewerPath, option.id];
      render();
    });

    optionsContainer.appendChild(button);
  });
}

function renderAdminPanel() {
  document.body.classList.toggle(ADMIN_CLASS, state.adminMode);
  elements.adminOverlay.hidden = !state.adminMode;

  if (!state.adminMode) {
    return;
  }

  renderAdminServices();
  renderAdminKnowledges();
  renderKnowledgeEditor();
}

function renderAdminServices() {
  elements.adminServiceList.innerHTML = '';

  if (!state.services.length) {
    const empty = document.createElement('li');
    empty.className = 'admin-empty';
    empty.textContent = 'Aucun service pour le moment. Ajoutez-en un pour commencer.';
    elements.adminServiceList.appendChild(empty);
    return;
  }

  state.services.forEach((service) => {
    const item = document.createElement('li');
    item.dataset.id = service.id;
    item.className = 'admin-item';
    if (state.selectedServiceId === service.id) {
      item.classList.add('active');
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'admin-item__select';
    button.innerHTML = `
      <span class="admin-item__title">${service.name || 'Sans nom'}</span>
      <span class="admin-item__meta">${service.knowledges.length} fiche${
        service.knowledges.length > 1 ? 's' : ''
      }</span>
    `;

    button.addEventListener('click', () => {
      state.selectedServiceId = service.id;
      state.selectedKnowledgeId = service.knowledges[0]?.id ?? null;
      resetViewerPath();
      render();
    });

    const actions = document.createElement('div');
    actions.className = 'admin-item__actions';

    const renameBtn = document.createElement('button');
    renameBtn.type = 'button';
    renameBtn.className = 'icon-button';
    renameBtn.dataset.action = 'rename-service';
    renameBtn.title = 'Renommer';
    renameBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    renameBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      renameService(service.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-button';
    deleteBtn.dataset.action = 'delete-service';
    deleteBtn.title = 'Supprimer';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteService(service.id);
    });

    actions.append(renameBtn, deleteBtn);

    item.append(button, actions);
    elements.adminServiceList.appendChild(item);
  });
}

function renderAdminKnowledges() {
  const service = getSelectedService();
  const list = elements.adminKnowledgeList;
  const placeholder = elements.adminKnowledgePlaceholder;

  list.innerHTML = '';
  list.hidden = false;
  placeholder.classList.remove('is-visible');
  elements.adminAddKnowledge.disabled = !service;

  if (!service) {
    placeholder.textContent = 'Sélectionnez un service pour gérer ses connaissances.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    return;
  }

  if (!service.knowledges.length) {
    placeholder.textContent = 'Aucune connaissance pour ce service. Ajoutez-en une nouvelle.';
    placeholder.classList.add('is-visible');
    list.hidden = true;
    return;
  }

  service.knowledges.forEach((knowledge) => {
    const item = document.createElement('li');
    item.dataset.id = knowledge.id;
    item.className = 'admin-item admin-item--knowledge';
    if (state.selectedKnowledgeId === knowledge.id) {
      item.classList.add('active');
    }

    const leaves = collectLeaves(knowledge.steps || []);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'admin-item__select';
    button.innerHTML = `
      <span class="admin-item__title">${knowledge.title || 'Sans titre'}</span>
      <span class="admin-item__meta">${leaves.length} étape${leaves.length > 1 ? 's' : ''}</span>
    `;

    button.addEventListener('click', () => {
      state.selectedKnowledgeId = knowledge.id;
      resetViewerPath();
      render();
    });

    item.appendChild(button);
    list.appendChild(item);
  });
}

function renderKnowledgeEditor() {
  const service = getSelectedService();
  const knowledge = getSelectedKnowledge();

  if (!service || !knowledge) {
    elements.adminEmptyState.hidden = false;
    elements.knowledgeEditor.hidden = true;
    return;
  }

  elements.adminEmptyState.hidden = true;
  elements.knowledgeEditor.hidden = false;
  elements.stepTree.classList.toggle('readonly', !state.adminMode);

  elements.knowledgeTitle.value = knowledge.title || '';
  elements.knowledgeDefinition.value = knowledge.definition || '';
  const breadcrumb = [service.name || 'Service'];
  if (knowledge.category) {
    breadcrumb.push(knowledge.category);
  }
  breadcrumb.push(knowledge.title || 'Sans titre');
  elements.knowledgeBreadcrumb.textContent = breadcrumb.join(' › ');

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

function getViewerContext(knowledge) {
  const labels = [];
  let current = null;
  let steps = knowledge.steps || [];

  for (const stepId of viewerPath) {
    const next = steps.find((step) => step.id === stepId);
    if (!next) break;
    current = next;
    labels.push(next.label || 'Sans nom');
    steps = next.children || [];
  }

  const options = current ? current.children || [] : knowledge.steps || [];
  const hasAnyStep = (knowledge.steps || []).length > 0;
  const reachedFinal = Boolean(current?.isFinal);
  const isIncompleteLeaf = Boolean(current) && !reachedFinal && options.length === 0;

  return {
    current,
    options,
    labels,
    hasAnyStep,
    reachedFinal,
    isIncompleteLeaf,
  };
}

function getOptionLetter(index) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let value = index;
  let label = '';

  while (value >= 0) {
    label = alphabet[value % 26] + label;
    value = Math.floor(value / 26) - 1;
  }

  return label;
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
    knowledges: [],
  };

  state.services.push(service);
  state.selectedServiceId = service.id;
  state.selectedKnowledgeId = null;
  resetViewerPath();
  render();
  showToast('Service ajouté');
}

function renameService(serviceId) {
  if (!state.adminMode) return;
  const service = state.services.find((item) => item.id === serviceId);
  if (!service) return;

  const name = prompt('Nouveau nom du service :', service.name || '');
  if (!name) return;

  service.name = name.trim();
  render();
  showToast('Service renommé');
}

function deleteService(serviceId) {
  if (!state.adminMode) return;
  const service = state.services.find((item) => item.id === serviceId);
  if (!service) return;

  const confirmDelete = confirm(
    `Supprimer le service "${service.name || 'Sans nom'}" et toutes ses connaissances ?`
  );
  if (!confirmDelete) return;

  state.services = state.services.filter((item) => item.id !== serviceId);
  if (state.selectedServiceId === serviceId) {
    state.selectedServiceId = state.services[0]?.id ?? null;
    const newService = getSelectedService();
    state.selectedKnowledgeId = newService?.knowledges[0]?.id ?? null;
  }
  resetViewerPath();
  render();
  showToast('Service supprimé');
}

function addKnowledge() {
  if (!state.adminMode) return;
  const service = getSelectedService();
  if (!service) return;

  const title = prompt('Titre de la connaissance :');
  if (!title) return;

  const knowledge = {
    id: generateId(),
    title: title.trim(),
    definition: '',
    steps: [],
    category: null,
  };

  service.knowledges.unshift(knowledge);
  state.selectedKnowledgeId = knowledge.id;
  resetViewerPath();
  render();
  showToast('Connaissance créée');
}

function deleteKnowledge() {
  if (!state.adminMode) return;
  const service = getSelectedService();
  const knowledge = getSelectedKnowledge();
  if (!service || !knowledge) return;

  const confirmDelete = confirm('Supprimer cette connaissance ?');
  if (!confirmDelete) return;

  service.knowledges = service.knowledges.filter((item) => item.id !== knowledge.id);
  state.selectedKnowledgeId = service.knowledges[0]?.id ?? null;
  resetViewerPath();
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
  resetViewerPath();
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
  resetViewerPath();
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
  resetViewerPath();
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
  resetViewerPath();
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

function getSelectedKnowledge() {
  const service = getSelectedService();
  if (!service) return null;
  return service.knowledges.find((knowledge) => knowledge.id === state.selectedKnowledgeId) ?? null;
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

elements.closeAdmin.addEventListener('click', () => {
  setAdminMode(false);
  render();
});

elements.adminBackdrop.addEventListener('click', () => {
  setAdminMode(false);
  render();
});

elements.addService.addEventListener('click', addService);

elements.adminAddService.addEventListener('click', addService);

elements.adminAddKnowledge.addEventListener('click', addKnowledge);

elements.deleteKnowledge.addEventListener('click', deleteKnowledge);

elements.saveKnowledge.addEventListener('click', saveKnowledge);

elements.addRootStep.addEventListener('click', addRootStep);

elements.viewerReset.addEventListener('click', () => {
  resetViewerPath();
  render();
});

elements.viewerBack.addEventListener('click', () => {
  if (viewerPath.length === 0) return;
  viewerPath = viewerPath.slice(0, -1);
  render();
});

function initialize() {
  setAdminMode(state.adminMode);
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
