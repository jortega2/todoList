import PubSub from 'pubsub-js';
import master from './master';

function inputHandlerFactory() {
  PubSub.subscribe('pageRefreshed', refreshPopup);
  PubSub.subscribe('projectClicked', selectProject);
  PubSub.subscribe('taskClicked', selectTask);

  let popups = [...document.getElementsByClassName('popup')];
  popups.forEach((p) => {
    p.addEventListener('click', toggle);
  });

  const createProject = document.querySelector('.projectForm');
  createProject.addEventListener('submit', newProject);

  const createTask = document.querySelector('.taskForm');
  createTask.addEventListener('submit', newTask);

  window.addEventListener('click', ({ target }) => {
    if (target instanceof HTMLImageElement) {
      if (target.parentNode.classList.contains('popup')) {
        return;
      }
    }
    if (target.parentNode instanceof HTMLFormElement || target instanceof HTMLFormElement) {
      return;
    }
    popups.forEach((p) => p.classList.remove('show'));
  });

  function refreshPopup(msg) {
    popups = [...document.getElementsByClassName('popup')];
    popups.forEach((p) => {
      p.addEventListener('click', toggle);
    });
  }

  function toggle(event) {
    const { parentNode } = event.target;
    popups.forEach((p) => {
      if (p !== parentNode) {
        if (p.classList.contains('show')) {
          p.classList.remove('show');
        }
      } else {
        p.classList.toggle('show');
      }
    });
  }

  function newProject(event) {
    event.preventDefault();
    const myFormData = new FormData(event.target);
    const projectInfo = Object.fromEntries(myFormData.entries());
    master.makeProject(projectInfo);
  }

  function newTask(event) {
    event.preventDefault();
    const myFormData = new FormData(event.target);
    const taskInfo = Object.fromEntries(myFormData.entries());
    master.addTaskToSelected(taskInfo);
  }

  function selectProject(msg, projectToSelect) {
    const projects = document.querySelectorAll('.project');

    projects.forEach((project) => {
      if (project.classList.contains('selected') && project !== projectToSelect) {
        project.classList.remove('selected');
      }
    });

    projectToSelect.classList.toggle('selected');
    master.setSelectedProject(projectToSelect.getAttribute('data-projectID'));
  }

  function selectTask(msg, taskToSelect) {
    const projects = document.querySelectorAll('.task');

    projects.forEach((task) => {
      if (task.classList.contains('selected') && task !== taskToSelect) {
        task.classList.remove('selected');
      }
    });

    taskToSelect.classList.toggle('selected');
  }
}

const inputHandler = inputHandlerFactory();
export default inputHandler;
