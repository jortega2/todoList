import createTask from './task';

export default function createProject(title, desc) {
  let _title = title;
  let _desc = desc;
  const _tasks = [];

  function getTitle() {
    return _title;
  }

  function setTitle(newTitle) {
    _title = newTitle;
  }

  function getDesc() {
    return _desc;
  }

  function setDesc(newDesc) {
    _desc = newDesc;
  }

  function addTask(taskInfo) {
    const newTask = createTask(taskInfo.title, taskInfo.desc, taskInfo.dueDate, taskInfo.priority);
    _tasks.push(newTask);
  }

  function deleteTask(id) {
    _tasks.splice(id, 1);
  }

  function editTask(id, taskInfo) {
    _tasks[id].setTitle(taskInfo.title);
    _tasks[id].setDesc(taskInfo.desc);
    _tasks[id].setDueDate(taskInfo.dueDate);
    _tasks[id].setPriority(taskInfo.priority);
  }

  function getTasks() {
    return _tasks;
  }

  return {
    getTitle, setTitle, getDesc, setDesc, addTask, deleteTask, editTask, getTasks,
  };
}
