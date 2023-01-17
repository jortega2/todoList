import PubSub from 'pubsub-js';
import createProject from './project';

function masterProject() {
  const _projects = [];
  let selectedProject = null;
  PubSub.subscribe('deleteProject', deleteProject);
  PubSub.subscribe('editProject', editProject);
  PubSub.subscribe('editTask', editTask);

  function deleteProject(data, id) {
    _projects.splice(id, 1);
    PubSub.publishSync('masterChanged');
  }

  function makeProject(projectInfo) {
    const newProject = createProject(projectInfo.title, projectInfo.desc);
    _projects.push(newProject);
    PubSub.publishSync('masterChanged');
  }

  function editProject(msg, data) {
    const projectInfo = data[0];
    const id = data[1];
    _projects[id].setTitle(projectInfo.title);
    _projects[id].setDesc(projectInfo.desc);
    PubSub.publishSync('masterChanged');
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

  function addTaskToSelected(taskInfo) {
    if (selectedProject === null) {
      alert('no list has been selected');
    } else {
      selectedProject.addTask(taskInfo);
      PubSub.publishSync('selectedProjectChanged');
    }
  }

  function editTask(msg, data) {
    if (selectedProject === null) {
      alert('no list has been selected');
    } else {
      const id = data[1];
      const taskInfo = data[0];
      selectedProject.editTask(id, taskInfo);
      PubSub.publishSync('selectedProjectChanged');
    }
  }

  return {
    deleteProject,
    makeProject,
    getProjects,
    editProject,
    setSelectedProject,
    getSelectedProject,
    addTaskToSelected,
  };
}
const master = masterProject();
master.makeProject({ title: 'monday', desc: 'today is monday' });
master.makeProject({ title: 'tuesday', desc: 'today is tuesday' });
master.makeProject({ title: 'wednesday', desc: 'today is wednesday' });
master.setSelectedProject(0);
const project = master.getSelectedProject();
project.addTask({
  title: 'task 1', desc: 'task 1 description', dueDate: Date(), priority: 'normal',
});
project.addTask({ title: 'task 2', dueDate: Date(), priority: 'normal' });
project.addTask({ title: 'task 3', dueDate: Date(), priority: 'normal' });
project.addTask({ title: 'task 4', dueDate: Date(), priority: 'normal' });

export default master;
