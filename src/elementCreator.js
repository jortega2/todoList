import PubSub from 'pubsub-js';

function elementCreatorFactory() {
  function createDelButton() {
    const delButton = document.createElement('button');
    delButton.classList.add('imageButton');
    delButton.classList.add('delButton');

    const delImg = document.createElement('img');
    delImg.src = 'images/delete.png';

    delButton.appendChild(delImg);

    return delButton;
  }

  function delButtonProjectListener(button, id) {
    button.addEventListener('click', () => {
      PubSub.publishSync('deleteProject', id);
    });
  }

  function delButtonTasktListener(button, id) {
    button.addEventListener('click', () => {
      PubSub.publishSync('deleteTask', id);
    });
  }

  function createEditButton() {
    const editButton = document.createElement('button');
    editButton.classList.add('imageButton');
    editButton.classList.add('editButton');
    editButton.classList.add('popup');

    const editImg = document.createElement('img');
    editImg.src = 'images/archive-edit.png';

    editButton.appendChild(editImg);

    PubSub.publishSync('popupCreated', editButton);

    return editButton;
  }

  function createDescElement(desc) {
    const descElement = document.createElement('div');
    descElement.innerText = desc;
    descElement.classList.add('description');
    descElement.classList.add('hidden');

    return descElement;
  }

  function createEditProjectForm() {
    const formElement = document.createElement('form');
    formElement.classList.add('form');

    const header = document.createElement('h3');
    header.textContent = 'Edit Project';

    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'title');
    titleLabel.textContent = 'Title';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'title';
    titleInput.id = 'title';
    titleInput.required = true;

    const descLabel = document.createElement('label');
    descLabel.setAttribute('for', 'desc');
    descLabel.textContent = 'Description';

    const descInput = document.createElement('textarea');
    descInput.name = 'desc';
    descInput.id = 'desc';
    descInput.setAttribute('cols', '10');
    descInput.setAttribute('rows', '10');

    const subButton = document.createElement('button');
    subButton.textContent = 'Submit';
    subButton.type = 'submit';
    subButton.id = 'submit';

    formElement.appendChild(header);
    formElement.appendChild(titleLabel);
    formElement.appendChild(titleInput);
    formElement.appendChild(descLabel);
    formElement.appendChild(descInput);
    formElement.appendChild(subButton);

    return formElement;
  }

  function createEditTaskForm() {
    const formElement = document.createElement('form');
    formElement.classList.add('form');

    const header = document.createElement('h3');
    header.textContent = 'Edit Task';

    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'title');
    titleLabel.textContent = 'Title';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'title';
    titleInput.id = 'title';
    titleInput.required = true;

    const descLabel = document.createElement('label');
    descLabel.setAttribute('for', 'desc');
    descLabel.textContent = 'Description';

    const descInput = document.createElement('textarea');
    descInput.name = 'desc';
    descInput.id = 'desc';
    descInput.setAttribute('cols', '10');
    descInput.setAttribute('rows', '10');

    const priorityLabel = document.createElement('label');
    priorityLabel.setAttribute('for', 'priority');
    priorityLabel.textContent = 'Priority';

    const priorityInput = document.createElement('select');
    priorityInput.setAttribute('name', 'priority');
    priorityInput.setAttribute('id', 'priority');
    const normal = document.createElement('option');
    normal.value = '0';
    normal.textContent = 'Normal';
    const high = document.createElement('option');
    high.value = '1';
    high.textContent = 'High';
    const highest = document.createElement('option');
    normal.value = '2';
    highest.textContent = 'Highest';

    priorityInput.appendChild(normal);
    priorityInput.appendChild(high);
    priorityInput.appendChild(highest);

    const dueDateLabel = document.createElement('label');
    dueDateLabel.setAttribute('for', 'dueDate');

    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    dueDateInput.name = 'dueDate';
    dueDateInput.id = 'dueDate';

    const subButton = document.createElement('button');
    subButton.textContent = 'Submit';
    subButton.type = 'submit';
    subButton.id = 'submit';

    formElement.appendChild(header);
    formElement.appendChild(titleLabel);
    formElement.appendChild(titleInput);
    formElement.appendChild(descLabel);
    formElement.appendChild(descInput);
    formElement.appendChild(priorityLabel);
    formElement.appendChild(priorityInput);
    formElement.appendChild(dueDateLabel);
    formElement.appendChild(dueDateInput);
    formElement.appendChild(subButton);

    return formElement;
  }

  function createStatusButton() {
    const statusButton = document.createElement('button');
    statusButton.classList.add('imageButton');

    const statusImg = document.createElement('img');
    statusImg.src = 'images/circle-outline.png';

    statusButton.addEventListener('click', () => {
      statusImg.src = 'images/circle.png';
    });

    statusButton.appendChild(statusImg);

    return statusButton;
  }

  function createDateElement(date) {
    const dateElement = document.createElement('div');
    dateElement.innerText = date;

    return dateElement;
  }

  function editProject(event) {
    event.preventDefault();
    const id = this.parentNode.getAttribute('data-projectid');
    const myFormData = new FormData(event.target);
    const projectInfo = Object.fromEntries(myFormData.entries());

    PubSub.publishSync('editProject', [projectInfo, id]);
  }

  function editTask(event) {
    event.preventDefault();
    const id = this.parentNode.getAttribute('data-taskid');
    const myFormData = new FormData(event.target);
    const taskInfo = Object.fromEntries(myFormData.entries());

    PubSub.publishSync('editTask', [taskInfo, id]);
  }

  function createProjectElement(projectInfo, id) {
    const project = document.createElement('div');
    project.classList.add('project');
    project.innerText = projectInfo.getTitle();
    project.setAttribute('data-projectID', id);

    const descElement = createDescElement(projectInfo.getDesc());
    const delButton = createDelButton();
    delButtonProjectListener(delButton, id);
    const editButton = createEditButton();
    const formElement = createEditProjectForm();
    formElement.addEventListener('submit', editProject);

    project.appendChild(editButton);
    project.appendChild(formElement);
    project.appendChild(delButton);
    project.appendChild(descElement);
    project.onclick = () => {
      PubSub.publishSync('projectClicked', project);
    };

    return project;
  }

  // create taskElement
  function createTaskElement(taskInfo, id) {
    const task = document.createElement('div');
    const titleElement = document.createElement('div');
    titleElement.innerText = taskInfo.getTitle();
    task.classList.add('task');
    task.setAttribute('data-taskID', id);

    // priority
    if (taskInfo.getPriority() === '0') {
      task.classList.add('normal');
    } else if (taskInfo.getPriority() === '1') {
      task.classList.add('high');
    } else if (taskInfo.getPriority() === '2') {
      task.classList.add('highest');
    }

    const statusButton = createStatusButton();
    const dateElement = createDateElement(taskInfo.getDueDate());
    const delButton = createDelButton(id);
    delButtonTasktListener(delButton, id);
    const editButton = createEditButton();
    const descElement = createDescElement(taskInfo.getDesc());
    const formElement = createEditTaskForm();
    formElement.addEventListener('submit', editTask);

    task.appendChild(statusButton);
    task.appendChild(titleElement);
    task.appendChild(dateElement);
    task.appendChild(editButton);
    task.appendChild(formElement);
    task.appendChild(delButton);
    task.appendChild(descElement);
    task.onclick = () => {
      PubSub.publishSync('taskClicked', task);
    };

    return task;
  }

  return { createProjectElement, createTaskElement };
}

const elementCreator = elementCreatorFactory();
export default elementCreator;
