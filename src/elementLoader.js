import PubSub from 'pubsub-js';
import master from './master';
import elementCreator from './elementCreator';

function elementLoaderFactory() {
  const content = document.querySelector('.contentBar');
  const bar = document.querySelector('.projectsBar');
  PubSub.subscribe('masterChanged', loadBar);
  PubSub.subscribe('selectedProjectChanged', loadContent);
  loadBar();
  loadContent();

  function clearBar() {
    bar.innerText = '';
  }

  function clearContent() {
    content.innerText = '';
  }

  function loadBar() {
    clearBar();
    const projects = master.getProjects();

    for (let i = 0; i < projects.length; i += 1) {
      const newProjEle = elementCreator.createProjectElement(projects[i], i);
      bar.appendChild(newProjEle);
    }
    PubSub.publishSync('pageRefreshed');
  }

  function loadContent() {
    clearContent();
    if (master.getSelectedProject() === null) {
      content.textContent = 'Choose a list';
      return;
    }
    const tasks = master.getSelectedProject().getTasks();
    if (tasks.length === 0) {
      return;
    }

    for (let i = 0; i < tasks.length; i += 1) {
      const newTask = elementCreator.createTaskElement(tasks[i], i);
      content.append(newTask);
    }
    PubSub.publishSync('pageRefreshed');
  }
  return { loadBar, loadContent };
}

const elementLoader = elementLoaderFactory();
export default elementLoader;
