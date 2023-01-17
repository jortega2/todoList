import PubSub from 'pubsub-js';
import master from './master';
import elementCreator from './elementCreator';

function elementLoaderFactory() {
  const content = document.querySelector('.contentBar');
  const bar = document.querySelector('.projectsBar');
  PubSub.subscribe('masterChanged', loadBar);
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
  }

  function loadContent() {
    clearContent();
    const tasks = master.getSelectedProject().getTasks();

    for (let i = 0; i < tasks.length; i += 1) {
      const newTask = elementCreator.createTaskElement(tasks[i], i);
      content.append(newTask);
    }
  }
  return { loadBar, loadContent };
}

const elementLoader = elementLoaderFactory();
export default elementLoader;
