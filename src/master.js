import PubSub from 'pubsub-js';
import createProject from './project';

function masterProject() {
  const _projects = [];
  let selectedProject = null;
  PubSub.subscribe('deleteProject', deleteProject);
  PubSub.subscribe('editProject', editProject);
  function deleteProject(data, id) {
    _projects.splice(id, 1);
  }

  function makeProject(projectInfo) {
    const newProject = createProject(projectInfo.title, projectInfo.desc);
    _projects.push(newProject);
  }

  function editProject(id, projectInfo) {
    _projects[id].setTitle(projectInfo.title);
    _projects[id].setDesc(projectInfo.desc);
  }

  function getProjects() {
    return _projects;
  }

  function setSelectedProject(id) {
    selectedProject = _projects[id];
  }

  function getSelectedProject() {
    return selectedProject;
  }

  return {
    deleteProject,
    makeProject,
    getProjects,
    editProject,
    setSelectedProject,
    getSelectedProject,
    _projects,
  };
}
const master = masterProject();
export default master;
