import PubSub from 'pubsub-js';

function elementCreatorFactory() {
  function createDelButton(id) {
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

    const editImg = document.createElement('img');
    editImg.src = '../images/archive-edit-outline.png';

    editButton.appendChild(editImg);

    return editButton;
  }

  function createDescElement(desc) {
    const descElement = document.createElement('div');
    descElement.innerText = desc;
    descElement.classList.add('hidden');
    descElement.classList.add('projectDesc');

    return descElement;
  }

  function createProjectElement(title, desc, id) {
    const project = document.createElement('div');
    project.classList.add('project');
    project.innerText = title;
    project.setAttribute('data-projectID', id);

    const descElement = createDescElement(desc);
    const delButton = createDelButton(id);
    delButtonProjectListener(delButton, id);
    const editButton = createEditButton();
    editButtonProjectListener(editButton, id);

    project.appendChild(editButton);
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
    editButtonTasktListener(editButton, id);

    task.appendChild(editButton);
    task.appendChild(delButton);

    return task;
  }

  return { createProjectElement, createTaskElement };
}

const elementCreator = elementCreatorFactory();
export default elementCreator;
