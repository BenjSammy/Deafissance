const STORAGE_KEY = 'deafissance-knowledge-base';
const ADMIN_CLASS = 'is-admin';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const elements = {
  adminToggle: document.getElementById('adminToggle'),
  addCategory: document.getElementById('addCategory'),
  addKnowledge: document.getElementById('addKnowledge'),
  categoryList: document.getElementById('categoryList'),
  knowledgeList: document.getElementById('knowledgeList'),
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

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.warn('Impossible de charger les données sauvegardées.', error);
    }
  }

  const initialId = generateId();
  return {
    categories: [
      {
        id: initialId,
        name: 'Réclamation',
        knowledges: [
          {
            id: generateId(),
            title: 'GP FO TEL | Objet non parvenu ni trouvé',
            definition:
              "Le client nous informe ne pas avoir reçu son colis et le délai de dépôt est supérieur à 48h.",
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
    selectedCategoryId: initialId,
    selectedKnowledgeId: null,
    adminMode: true,
  };
}

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

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setAdminMode(enabled) {
  state.adminMode = enabled;
  document.body.classList.toggle(ADMIN_CLASS, enabled);
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

function render() {
  renderCategories();
  renderKnowledges();
  renderEditor();
  saveState();
}

function renderCategories() {
  elements.categoryList.innerHTML = '';
  state.categories.forEach((category) => {
    const li = document.createElement('li');
    li.dataset.id = category.id;
    li.textContent = category.name;
    if (state.selectedCategoryId === category.id) {
      li.classList.add('active');
    }
    li.addEventListener('click', () => {
      state.selectedCategoryId = category.id;
      const firstKnowledge = category.knowledges[0];
      state.selectedKnowledgeId = firstKnowledge ? firstKnowledge.id : null;
      render();
    });
    elements.categoryList.appendChild(li);
  });
}

function renderKnowledges() {
  elements.knowledgeList.innerHTML = '';
  const category = getSelectedCategory();
  if (!category) {
    elements.addKnowledge.disabled = true;
    return;
  }

  elements.addKnowledge.disabled = !state.adminMode;

  category.knowledges.forEach((knowledge) => {
    const li = document.createElement('li');
    li.dataset.id = knowledge.id;
    li.textContent = knowledge.title || 'Sans titre';
    if (state.selectedKnowledgeId === knowledge.id) {
      li.classList.add('active');
    }
    li.addEventListener('click', () => {
      state.selectedKnowledgeId = knowledge.id;
      render();
    });
    elements.knowledgeList.appendChild(li);
  });
}

function renderEditor() {
  const knowledge = getSelectedKnowledge();
  const category = getSelectedCategory();

  if (!knowledge || !category) {
    elements.emptyState.hidden = false;
    elements.knowledgeEditor.hidden = true;
    return;
  }

  elements.emptyState.hidden = true;
  elements.knowledgeEditor.hidden = false;

  elements.knowledgeTitle.value = knowledge.title || '';
  elements.knowledgeDefinition.value = knowledge.definition || '';
  elements.knowledgeBreadcrumb.textContent = `${category.name} › ${knowledge.title || 'Sans titre'}`;

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

function createTreeNode(step, depth = 0) {
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
      const childNode = createTreeNode(child, depth + 1);
      childrenContainer.appendChild(childNode);
    });
  }

  return node;
}

function addCategory() {
  const name = prompt('Nom de la nouvelle catégorie :');
  if (!name) return;

  state.categories.push({
    id: generateId(),
    name,
    knowledges: [],
  });
  render();
  showToast('Catégorie ajoutée');
}

function addKnowledge() {
  const category = getSelectedCategory();
  if (!category) return;
  const title = prompt('Titre de la connaissance :');
  if (!title) return;

  const knowledge = {
    id: generateId(),
    title,
    definition: '',
    steps: [],
  };

  category.knowledges.unshift(knowledge);
  state.selectedKnowledgeId = knowledge.id;
  render();
  showToast('Connaissance créée');
}

function deleteKnowledge() {
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
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  knowledge.title = elements.knowledgeTitle.value.trim() || 'Sans titre';
  knowledge.definition = elements.knowledgeDefinition.value.trim();

  render();
  showToast('Modifications enregistrées');
}

function addRootStep() {
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  const label = prompt('Point de départ du chemin :');
  if (!label) return;

  knowledge.steps.push(createStep(label));
  render();
  showToast('Nouvelle étape ajoutée');
}

function addChildStep(stepId) {
  const knowledge = getSelectedKnowledge();
  if (!knowledge) return;

  const step = findStepById(knowledge.steps, stepId);
  if (!step) return;

  const label = prompt('Nom de l’embranchement :');
  if (!label) return;

  step.children = step.children || [];
  step.children.push(createStep(label));
  step.isFinal = false;
  render();
  showToast('Embranchement ajouté');
}

function deleteStep(stepId) {
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

function getSelectedCategory() {
  return state.categories.find((category) => category.id === state.selectedCategoryId);
}

function getSelectedKnowledge() {
  const category = getSelectedCategory();
  if (!category) return null;
  return category.knowledges.find((knowledge) => knowledge.id === state.selectedKnowledgeId);
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

elements.addCategory.addEventListener('click', addCategory);
elements.addKnowledge.addEventListener('click', addKnowledge);
elements.deleteKnowledge.addEventListener('click', deleteKnowledge);
elements.saveKnowledge.addEventListener('click', saveKnowledge);
elements.addRootStep.addEventListener('click', addRootStep);

document.addEventListener('DOMContentLoaded', () => {
  setAdminMode(state.adminMode);
  render();
});
