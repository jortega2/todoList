import PubSub from 'pubsub-js';

function elementCreatorFactory() {
  function createDelButton() {
    const delButton = document.createElement('button');
    delButton.classList.add('imageButton');
    delButton.classList.add('delButton');

    const delImg = document.createElement('img');
    delImg.src = '../images/delete.png';

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

  // function editButtonProjectListener(button, id) {
  //   button.addEventListener('click', () => {
  //     PubSub.publishSync('editProject', id);
  //   });
  // }

  // function editButtonTasktListener(button, id) {
  //   button.addEventListener('click', () => {
  //     PubSub.publishSync('editTask', id);
  //   });
  // }

  function createEditButton() {
    const editButton = document.createElement('button');
    editButton.classList.add('imageButton');
    editButton.classList.add('editButton');
    editButton.classList.add('popup');

    const editImg = document.createElement('img');
    editImg.src = '../images/archive-edit-outline.png';

    editButton.appendChild(editImg);

    return editButton;
  }

  function createDescElement(desc) {
    const descElement = document.createElement('div');
    descElement.innerText = desc;
    descElement.classList.add('projectDesc');
    descElement.style.display = 'none';

    return descElement;
  }

  function createEditProjectForm() {
    const form = document.createElement('form');
    form.classList.add('editProjectForm');

    const header = document.createElement('h3');
    header.textContent = 'Edit Project';

    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'title');
    titleLabel.textContent = 'Title';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'title';
    titleInput.id = 'title';

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

    form.appendChild(header);
    form.appendChild(titleLabel);
    form.appendChild(titleInput);
    form.appendChild(descLabel);
    form.appendChild(descInput);
    form.appendChild(subButton);

    return form;
  }

  function createProjectElement(title, desc, id) {
    const project = document.createElement('div');
    project.classList.add('project');
    project.innerText = title;
    project.setAttribute('data-projectID', id);

    const descElement = createDescElement(desc);
    const delButton = createDelButton();
    delButtonProjectListener(delButton, id);
    const editButton = createEditButton();
    const form = createEditProjectForm();

    project.appendChild(editButton);
    project.appendChild(form);
    project.appendChild(delButton);
    project.appendChild(descElement);

    // project.addEventListener('click', () => {
    //   project.classList.toggle('highlighted');
    //   descElement.classList.toggle('hidden');
    // });

    return project;
  }

  // create taskElement
  function createTaskElement(title, id) {
    const task = document.createElement('div');
    task.classList.add('task');
    task.innerText = title;
    task.setAttribute('data-taskID', id);

    const delButton = createDelButton(id);
    delButtonTasktListener(delButton, id);
    const editButton = createEditButton();

    task.appendChild(editButton);
    task.appendChild(delButton);

    return task;
  }

  return { createProjectElement, createTaskElement };
}

const elementCreator = elementCreatorFactory();
export default elementCreator;
