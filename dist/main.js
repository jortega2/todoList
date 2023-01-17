/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/pubsub-js/src/pubsub.js":
/*!**********************************************!*\
  !*** ./node_modules/pubsub-js/src/pubsub.js ***!
  \**********************************************/
/***/ (function(module, exports, __webpack_require__) {

/* module decorator */ module = __webpack_require__.nmd(module);
/**
 * Copyright (c) 2010,2011,2012,2013,2014 Morgan Roderick http://roderick.dk
 * License: MIT - http://mrgnrdrck.mit-license.org
 *
 * https://github.com/mroderick/PubSubJS
 */

(function (root, factory){
    'use strict';

    var PubSub = {};

    if (root.PubSub) {
        PubSub = root.PubSub;
        console.warn("PubSub already loaded, using existing version");
    } else {
        root.PubSub = PubSub;
        factory(PubSub);
    }
    // CommonJS and Node.js module support
    if (true){
        if (module !== undefined && module.exports) {
            exports = module.exports = PubSub; // Node.js specific `module.exports`
        }
        exports.PubSub = PubSub; // CommonJS module 1.1.1 spec
        module.exports = exports = PubSub; // CommonJS
    }
    // AMD support
    /* eslint-disable no-undef */
    else {}

}(( typeof window === 'object' && window ) || this, function (PubSub){
    'use strict';

    var messages = {},
        lastUid = -1,
        ALL_SUBSCRIBING_MSG = '*';

    function hasKeys(obj){
        var key;

        for (key in obj){
            if ( Object.prototype.hasOwnProperty.call(obj, key) ){
                return true;
            }
        }
        return false;
    }

    /**
     * Returns a function that throws the passed exception, for use as argument for setTimeout
     * @alias throwException
     * @function
     * @param { Object } ex An Error object
     */
    function throwException( ex ){
        return function reThrowException(){
            throw ex;
        };
    }

    function callSubscriberWithDelayedExceptions( subscriber, message, data ){
        try {
            subscriber( message, data );
        } catch( ex ){
            setTimeout( throwException( ex ), 0);
        }
    }

    function callSubscriberWithImmediateExceptions( subscriber, message, data ){
        subscriber( message, data );
    }

    function deliverMessage( originalMessage, matchedMessage, data, immediateExceptions ){
        var subscribers = messages[matchedMessage],
            callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions,
            s;

        if ( !Object.prototype.hasOwnProperty.call( messages, matchedMessage ) ) {
            return;
        }

        for (s in subscribers){
            if ( Object.prototype.hasOwnProperty.call(subscribers, s)){
                callSubscriber( subscribers[s], originalMessage, data );
            }
        }
    }

    function createDeliveryFunction( message, data, immediateExceptions ){
        return function deliverNamespaced(){
            var topic = String( message ),
                position = topic.lastIndexOf( '.' );

            // deliver the message as it is now
            deliverMessage(message, message, data, immediateExceptions);

            // trim the hierarchy and deliver message to each level
            while( position !== -1 ){
                topic = topic.substr( 0, position );
                position = topic.lastIndexOf('.');
                deliverMessage( message, topic, data, immediateExceptions );
            }

            deliverMessage(message, ALL_SUBSCRIBING_MSG, data, immediateExceptions);
        };
    }

    function hasDirectSubscribersFor( message ) {
        var topic = String( message ),
            found = Boolean(Object.prototype.hasOwnProperty.call( messages, topic ) && hasKeys(messages[topic]));

        return found;
    }

    function messageHasSubscribers( message ){
        var topic = String( message ),
            found = hasDirectSubscribersFor(topic) || hasDirectSubscribersFor(ALL_SUBSCRIBING_MSG),
            position = topic.lastIndexOf( '.' );

        while ( !found && position !== -1 ){
            topic = topic.substr( 0, position );
            position = topic.lastIndexOf( '.' );
            found = hasDirectSubscribersFor(topic);
        }

        return found;
    }

    function publish( message, data, sync, immediateExceptions ){
        message = (typeof message === 'symbol') ? message.toString() : message;

        var deliver = createDeliveryFunction( message, data, immediateExceptions ),
            hasSubscribers = messageHasSubscribers( message );

        if ( !hasSubscribers ){
            return false;
        }

        if ( sync === true ){
            deliver();
        } else {
            setTimeout( deliver, 0 );
        }
        return true;
    }

    /**
     * Publishes the message, passing the data to it's subscribers
     * @function
     * @alias publish
     * @param { String } message The message to publish
     * @param {} data The data to pass to subscribers
     * @return { Boolean }
     */
    PubSub.publish = function( message, data ){
        return publish( message, data, false, PubSub.immediateExceptions );
    };

    /**
     * Publishes the message synchronously, passing the data to it's subscribers
     * @function
     * @alias publishSync
     * @param { String } message The message to publish
     * @param {} data The data to pass to subscribers
     * @return { Boolean }
     */
    PubSub.publishSync = function( message, data ){
        return publish( message, data, true, PubSub.immediateExceptions );
    };

    /**
     * Subscribes the passed function to the passed message. Every returned token is unique and should be stored if you need to unsubscribe
     * @function
     * @alias subscribe
     * @param { String } message The message to subscribe to
     * @param { Function } func The function to call when a new message is published
     * @return { String }
     */
    PubSub.subscribe = function( message, func ){
        if ( typeof func !== 'function'){
            return false;
        }

        message = (typeof message === 'symbol') ? message.toString() : message;

        // message is not registered yet
        if ( !Object.prototype.hasOwnProperty.call( messages, message ) ){
            messages[message] = {};
        }

        // forcing token as String, to allow for future expansions without breaking usage
        // and allow for easy use as key names for the 'messages' object
        var token = 'uid_' + String(++lastUid);
        messages[message][token] = func;

        // return token for unsubscribing
        return token;
    };

    PubSub.subscribeAll = function( func ){
        return PubSub.subscribe(ALL_SUBSCRIBING_MSG, func);
    };

    /**
     * Subscribes the passed function to the passed message once
     * @function
     * @alias subscribeOnce
     * @param { String } message The message to subscribe to
     * @param { Function } func The function to call when a new message is published
     * @return { PubSub }
     */
    PubSub.subscribeOnce = function( message, func ){
        var token = PubSub.subscribe( message, function(){
            // before func apply, unsubscribe message
            PubSub.unsubscribe( token );
            func.apply( this, arguments );
        });
        return PubSub;
    };

    /**
     * Clears all subscriptions
     * @function
     * @public
     * @alias clearAllSubscriptions
     */
    PubSub.clearAllSubscriptions = function clearAllSubscriptions(){
        messages = {};
    };

    /**
     * Clear subscriptions by the topic
     * @function
     * @public
     * @alias clearAllSubscriptions
     * @return { int }
     */
    PubSub.clearSubscriptions = function clearSubscriptions(topic){
        var m;
        for (m in messages){
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                delete messages[m];
            }
        }
    };

    /**
       Count subscriptions by the topic
     * @function
     * @public
     * @alias countSubscriptions
     * @return { Array }
    */
    PubSub.countSubscriptions = function countSubscriptions(topic){
        var m;
        // eslint-disable-next-line no-unused-vars
        var token;
        var count = 0;
        for (m in messages) {
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0) {
                for (token in messages[m]) {
                    count++;
                }
                break;
            }
        }
        return count;
    };


    /**
       Gets subscriptions by the topic
     * @function
     * @public
     * @alias getSubscriptions
    */
    PubSub.getSubscriptions = function getSubscriptions(topic){
        var m;
        var list = [];
        for (m in messages){
            if (Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0){
                list.push(m);
            }
        }
        return list;
    };

    /**
     * Removes subscriptions
     *
     * - When passed a token, removes a specific subscription.
     *
	 * - When passed a function, removes all subscriptions for that function
     *
	 * - When passed a topic, removes all subscriptions for that topic (hierarchy)
     * @function
     * @public
     * @alias subscribeOnce
     * @param { String | Function } value A token, function or topic to unsubscribe from
     * @example // Unsubscribing with a token
     * var token = PubSub.subscribe('mytopic', myFunc);
     * PubSub.unsubscribe(token);
     * @example // Unsubscribing with a function
     * PubSub.unsubscribe(myFunc);
     * @example // Unsubscribing from a topic
     * PubSub.unsubscribe('mytopic');
     */
    PubSub.unsubscribe = function(value){
        var descendantTopicExists = function(topic) {
                var m;
                for ( m in messages ){
                    if ( Object.prototype.hasOwnProperty.call(messages, m) && m.indexOf(topic) === 0 ){
                        // a descendant of the topic exists:
                        return true;
                    }
                }

                return false;
            },
            isTopic    = typeof value === 'string' && ( Object.prototype.hasOwnProperty.call(messages, value) || descendantTopicExists(value) ),
            isToken    = !isTopic && typeof value === 'string',
            isFunction = typeof value === 'function',
            result = false,
            m, message, t;

        if (isTopic){
            PubSub.clearSubscriptions(value);
            return;
        }

        for ( m in messages ){
            if ( Object.prototype.hasOwnProperty.call( messages, m ) ){
                message = messages[m];

                if ( isToken && message[value] ){
                    delete message[value];
                    result = value;
                    // tokens are unique, so we can just stop here
                    break;
                }

                if (isFunction) {
                    for ( t in message ){
                        if (Object.prototype.hasOwnProperty.call(message, t) && message[t] === value){
                            delete message[t];
                            result = true;
                        }
                    }
                }
            }
        }

        return result;
    };
}));


/***/ }),

/***/ "./src/elementCreator.js":
/*!*******************************!*\
  !*** ./src/elementCreator.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pubsub-js */ "./node_modules/pubsub-js/src/pubsub.js");
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pubsub_js__WEBPACK_IMPORTED_MODULE_0__);


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
      pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('deleteProject', id);
    });
  }

  function delButtonTasktListener(button, id) {
    button.addEventListener('click', () => {
      pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('deleteTask', id);
    });
  }

  function createEditButton() {
    const editButton = document.createElement('button');
    editButton.classList.add('imageButton');
    editButton.classList.add('editButton');
    editButton.classList.add('popup');

    const editImg = document.createElement('img');
    editImg.src = '../images/archive-edit.png';

    editButton.appendChild(editImg);

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('popupCreated', editButton);

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
    statusImg.src = '../images/circle-outline.png';

    statusButton.addEventListener('click', () => {
      statusImg.src = '../images/circle.png';
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

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('editProject', [projectInfo, id]);
  }

  function editTask(event) {
    event.preventDefault();
    const id = this.parentNode.getAttribute('data-taskid');
    const myFormData = new FormData(event.target);
    const taskInfo = Object.fromEntries(myFormData.entries());

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('editTask', [taskInfo, id]);
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
      pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('projectClicked', project);
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
      pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('taskClicked', task);
    };

    return task;
  }

  return { createProjectElement, createTaskElement };
}

const elementCreator = elementCreatorFactory();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (elementCreator);


/***/ }),

/***/ "./src/elementLoader.js":
/*!******************************!*\
  !*** ./src/elementLoader.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pubsub-js */ "./node_modules/pubsub-js/src/pubsub.js");
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pubsub_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _master__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./master */ "./src/master.js");
/* harmony import */ var _elementCreator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./elementCreator */ "./src/elementCreator.js");




function elementLoaderFactory() {
  const content = document.querySelector('.contentBar');
  const bar = document.querySelector('.projectsBar');
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('masterChanged', loadBar);
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('selectedProjectChanged', loadContent);

  function clearBar() {
    bar.innerText = '';
  }

  function clearContent() {
    content.innerText = '';
  }

  function loadBar() {
    clearBar();
    const projects = _master__WEBPACK_IMPORTED_MODULE_1__["default"].getProjects();

    for (let i = 0; i < projects.length; i += 1) {
      const newProjEle = _elementCreator__WEBPACK_IMPORTED_MODULE_2__["default"].createProjectElement(projects[i], i);
      bar.appendChild(newProjEle);
    }
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('pageRefreshed');
  }

  function loadContent() {
    clearContent();
    if (_master__WEBPACK_IMPORTED_MODULE_1__["default"].getSelectedProject() === null) {
      content.textContent = 'Choose a list';
      return;
    }
    const tasks = _master__WEBPACK_IMPORTED_MODULE_1__["default"].getSelectedProject().getTasks();
    if (tasks.length === 0) {
      return;
    }

    for (let i = 0; i < tasks.length; i += 1) {
      const newTask = _elementCreator__WEBPACK_IMPORTED_MODULE_2__["default"].createTaskElement(tasks[i], i);
      content.append(newTask);
    }
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('pageRefreshed');
  }
  return { loadBar, loadContent };
}

const elementLoader = elementLoaderFactory();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (elementLoader);


/***/ }),

/***/ "./src/inputHandler.js":
/*!*****************************!*\
  !*** ./src/inputHandler.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pubsub-js */ "./node_modules/pubsub-js/src/pubsub.js");
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pubsub_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _master__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./master */ "./src/master.js");



function inputHandlerFactory() {
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('pageRefreshed', refreshPopup);
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('projectClicked', selectProject);
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('taskClicked', selectTask);

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
    _master__WEBPACK_IMPORTED_MODULE_1__["default"].makeProject(projectInfo);
  }

  function newTask(event) {
    event.preventDefault();
    const myFormData = new FormData(event.target);
    const taskInfo = Object.fromEntries(myFormData.entries());
    _master__WEBPACK_IMPORTED_MODULE_1__["default"].addTaskToSelected(taskInfo);
  }

  function selectProject(msg, projectToSelect) {
    const projects = document.querySelectorAll('.project');

    projects.forEach((project) => {
      if (project.classList.contains('selected') && project !== projectToSelect) {
        project.classList.remove('selected');
      }
    });

    projectToSelect.classList.toggle('selected');
    _master__WEBPACK_IMPORTED_MODULE_1__["default"].setSelectedProject(projectToSelect.getAttribute('data-projectID'));
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (inputHandler);


/***/ }),

/***/ "./src/master.js":
/*!***********************!*\
  !*** ./src/master.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pubsub-js */ "./node_modules/pubsub-js/src/pubsub.js");
/* harmony import */ var pubsub_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pubsub_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _project__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./project */ "./src/project.js");



function masterProject() {
  const _projects = [];
  let selectedProject = null;
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('deleteProject', deleteProject);
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('editProject', editProject);
  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('editTask', editTask);

  function deleteProject(data, id) {
    _projects.splice(id, 1);
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('masterChanged');
  }

  function makeProject(projectInfo) {
    const newProject = (0,_project__WEBPACK_IMPORTED_MODULE_1__["default"])(projectInfo.title, projectInfo.desc);
    _projects.push(newProject);
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('masterChanged');
  }

  function editProject(msg, data) {
    const projectInfo = data[0];
    const id = data[1];
    _projects[id].setTitle(projectInfo.title);
    _projects[id].setDesc(projectInfo.desc);
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('masterChanged');
  }

  function getProjects() {
    return _projects;
  }

  function setSelectedProject(id) {
    selectedProject = _projects[id];
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('selectedProjectChanged');
  }

  function getSelectedProject() {
    return selectedProject;
  }

  function addTaskToSelected(taskInfo) {
    if (selectedProject === null) {
      alert('no list has been selected');
    } else {
      selectedProject.addTask(taskInfo);
      pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('selectedProjectChanged');
    }
  }

  function editTask(msg, data) {
    if (selectedProject === null) {
      alert('no list has been selected');
    } else {
      const id = data[1];
      const taskInfo = data[0];
      selectedProject.editTask(id, taskInfo);
      pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('selectedProjectChanged');
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
// master.makeProject({ title: 'monday', desc: 'today is monday' });
// master.makeProject({ title: 'tuesday', desc: 'today is tuesday' });
// master.makeProject({ title: 'wednesday', desc: 'today is wednesday' });
// master.setSelectedProject(0);
// const project = master.getSelectedProject();
// project.addTask({
//   title: 'task 1', desc: 'task 1 description', dueDate: Date(), priority: 'normal',
// });
// project.addTask({ title: 'task 2', dueDate: Date(), priority: 'normal' });
// project.addTask({ title: 'task 3', dueDate: Date(), priority: 'normal' });
// project.addTask({ title: 'task 4', dueDate: Date(), priority: 'normal' });

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (master);


/***/ }),

/***/ "./src/project.js":
/*!************************!*\
  !*** ./src/project.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ createProject)
/* harmony export */ });
/* harmony import */ var _task__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./task */ "./src/task.js");


function createProject(title, desc) {
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
    const newTask = (0,_task__WEBPACK_IMPORTED_MODULE_0__["default"])(taskInfo.title, taskInfo.desc, taskInfo.dueDate, taskInfo.priority);
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


/***/ }),

/***/ "./src/task.js":
/*!*********************!*\
  !*** ./src/task.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ createTask)
/* harmony export */ });
function createTask(title, desc, dueDate, priority) {
  let _title = title;
  let _desc = desc;
  let _dueDate = dueDate;
  let _priority = priority;

  function setTitle(newTitle) {
    _title = newTitle;
  }

  function getTitle() {
    return _title;
  }

  function setDesc(newDesc) {
    _desc = newDesc;
  }

  function getDesc() {
    return _desc;
  }

  function setDueDate(newDate) {
    _dueDate = newDate;
  }

  function getDueDate() {
    return _dueDate;
  }

  function setPriority(prio) {
    _priority = prio;
  }

  function getPriority() {
    return _priority;
  }

  return {
    setTitle, getTitle, setDueDate, getDueDate, setDesc, getDesc, setPriority, getPriority,
  };
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _elementLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./elementLoader */ "./src/elementLoader.js");
/* harmony import */ var _inputHandler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./inputHandler */ "./src/inputHandler.js");



_elementLoader__WEBPACK_IMPORTED_MODULE_0__["default"].loadBar();
_elementLoader__WEBPACK_IMPORTED_MODULE_0__["default"].loadContent();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RXOEI7O0FBRS9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFNLDREQUFrQjtBQUN4QixLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBLE1BQU0sNERBQWtCO0FBQ3hCLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUEsSUFBSSw0REFBa0I7O0FBRXRCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FB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O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDekJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxpQ0FBaUMsV0FBVztXQUM1QztXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDSjRDO0FBQ0Y7O0FBRTFDLDhEQUFxQjtBQUNyQixrRUFBeUIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90b2RvbGlzdC8uL25vZGVfbW9kdWxlcy9wdWJzdWItanMvc3JjL3B1YnN1Yi5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9lbGVtZW50Q3JlYXRvci5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9lbGVtZW50TG9hZGVyLmpzIiwid2VicGFjazovL3RvZG9saXN0Ly4vc3JjL2lucHV0SGFuZGxlci5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9tYXN0ZXIuanMiLCJ3ZWJwYWNrOi8vdG9kb2xpc3QvLi9zcmMvcHJvamVjdC5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy90YXNrLmpzIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90b2RvbGlzdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdG9kb2xpc3Qvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMCwyMDExLDIwMTIsMjAxMywyMDE0IE1vcmdhbiBSb2RlcmljayBodHRwOi8vcm9kZXJpY2suZGtcbiAqIExpY2Vuc2U6IE1JVCAtIGh0dHA6Ly9tcmducmRyY2subWl0LWxpY2Vuc2Uub3JnXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL21yb2Rlcmljay9QdWJTdWJKU1xuICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSl7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFB1YlN1YiA9IHt9O1xuXG4gICAgaWYgKHJvb3QuUHViU3ViKSB7XG4gICAgICAgIFB1YlN1YiA9IHJvb3QuUHViU3ViO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQdWJTdWIgYWxyZWFkeSBsb2FkZWQsIHVzaW5nIGV4aXN0aW5nIHZlcnNpb25cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5QdWJTdWIgPSBQdWJTdWI7XG4gICAgICAgIGZhY3RvcnkoUHViU3ViKTtcbiAgICB9XG4gICAgLy8gQ29tbW9uSlMgYW5kIE5vZGUuanMgbW9kdWxlIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKXtcbiAgICAgICAgaWYgKG1vZHVsZSAhPT0gdW5kZWZpbmVkICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBQdWJTdWI7IC8vIE5vZGUuanMgc3BlY2lmaWMgYG1vZHVsZS5leHBvcnRzYFxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuUHViU3ViID0gUHViU3ViOyAvLyBDb21tb25KUyBtb2R1bGUgMS4xLjEgc3BlY1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBQdWJTdWI7IC8vIENvbW1vbkpTXG4gICAgfVxuICAgIC8vIEFNRCBzdXBwb3J0XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpe1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBQdWJTdWI7IH0pO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZGVmICovXG4gICAgfVxuXG59KCggdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93ICkgfHwgdGhpcywgZnVuY3Rpb24gKFB1YlN1Yil7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG1lc3NhZ2VzID0ge30sXG4gICAgICAgIGxhc3RVaWQgPSAtMSxcbiAgICAgICAgQUxMX1NVQlNDUklCSU5HX01TRyA9ICcqJztcblxuICAgIGZ1bmN0aW9uIGhhc0tleXMob2JqKXtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBmb3IgKGtleSBpbiBvYmope1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHRocm93cyB0aGUgcGFzc2VkIGV4Y2VwdGlvbiwgZm9yIHVzZSBhcyBhcmd1bWVudCBmb3Igc2V0VGltZW91dFxuICAgICAqIEBhbGlhcyB0aHJvd0V4Y2VwdGlvblxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7IE9iamVjdCB9IGV4IEFuIEVycm9yIG9iamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRocm93RXhjZXB0aW9uKCBleCApe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcmVUaHJvd0V4Y2VwdGlvbigpe1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsbFN1YnNjcmliZXJXaXRoRGVsYXllZEV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN1YnNjcmliZXIoIG1lc3NhZ2UsIGRhdGEgKTtcbiAgICAgICAgfSBjYXRjaCggZXggKXtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIHRocm93RXhjZXB0aW9uKCBleCApLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgc3Vic2NyaWJlciggbWVzc2FnZSwgZGF0YSApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlbGl2ZXJNZXNzYWdlKCBvcmlnaW5hbE1lc3NhZ2UsIG1hdGNoZWRNZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHZhciBzdWJzY3JpYmVycyA9IG1lc3NhZ2VzW21hdGNoZWRNZXNzYWdlXSxcbiAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyID0gaW1tZWRpYXRlRXhjZXB0aW9ucyA/IGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMgOiBjYWxsU3Vic2NyaWJlcldpdGhEZWxheWVkRXhjZXB0aW9ucyxcbiAgICAgICAgICAgIHM7XG5cbiAgICAgICAgaWYgKCAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgbWF0Y2hlZE1lc3NhZ2UgKSApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAocyBpbiBzdWJzY3JpYmVycyl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzdWJzY3JpYmVycywgcykpe1xuICAgICAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyKCBzdWJzY3JpYmVyc1tzXSwgb3JpZ2luYWxNZXNzYWdlLCBkYXRhICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkZWxpdmVyTmFtZXNwYWNlZCgpe1xuICAgICAgICAgICAgdmFyIHRvcGljID0gU3RyaW5nKCBtZXNzYWdlICksXG4gICAgICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cbiAgICAgICAgICAgIC8vIGRlbGl2ZXIgdGhlIG1lc3NhZ2UgYXMgaXQgaXMgbm93XG4gICAgICAgICAgICBkZWxpdmVyTWVzc2FnZShtZXNzYWdlLCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zKTtcblxuICAgICAgICAgICAgLy8gdHJpbSB0aGUgaGllcmFyY2h5IGFuZCBkZWxpdmVyIG1lc3NhZ2UgdG8gZWFjaCBsZXZlbFxuICAgICAgICAgICAgd2hpbGUoIHBvc2l0aW9uICE9PSAtMSApe1xuICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgICAgICAgICAgICBkZWxpdmVyTWVzc2FnZSggbWVzc2FnZSwgdG9waWMsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UobWVzc2FnZSwgQUxMX1NVQlNDUklCSU5HX01TRywgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoIG1lc3NhZ2UgKSB7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBCb29sZWFuKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIHRvcGljICkgJiYgaGFzS2V5cyhtZXNzYWdlc1t0b3BpY10pKTtcblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVzc2FnZUhhc1N1YnNjcmliZXJzKCBtZXNzYWdlICl7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBoYXNEaXJlY3RTdWJzY3JpYmVyc0Zvcih0b3BpYykgfHwgaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoQUxMX1NVQlNDUklCSU5HX01TRyksXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCAnLicgKTtcblxuICAgICAgICB3aGlsZSAoICFmb3VuZCAmJiBwb3NpdGlvbiAhPT0gLTEgKXtcbiAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG4gICAgICAgICAgICBmb3VuZCA9IGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKHRvcGljKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBzeW5jLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIG1lc3NhZ2UgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzeW1ib2wnKSA/IG1lc3NhZ2UudG9TdHJpbmcoKSA6IG1lc3NhZ2U7XG5cbiAgICAgICAgdmFyIGRlbGl2ZXIgPSBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICksXG4gICAgICAgICAgICBoYXNTdWJzY3JpYmVycyA9IG1lc3NhZ2VIYXNTdWJzY3JpYmVycyggbWVzc2FnZSApO1xuXG4gICAgICAgIGlmICggIWhhc1N1YnNjcmliZXJzICl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN5bmMgPT09IHRydWUgKXtcbiAgICAgICAgICAgIGRlbGl2ZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIGRlbGl2ZXIsIDAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoZXMgdGhlIG1lc3NhZ2UsIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBwdWJsaXNoXG4gICAgICogQHBhcmFtIHt9IGRhdGEgVGhlIGRhdGEgdG8gcGFzcyB0byBzdWJzY3JpYmVyc1xuICAgICAqIEByZXR1cm4geyBCb29sZWFuIH1cbiAgICAgKi9cbiAgICBQdWJTdWIucHVibGlzaCA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHJldHVybiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBmYWxzZSwgUHViU3ViLmltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGlzaGVzIHRoZSBtZXNzYWdlIHN5bmNocm9ub3VzbHksIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoU3luY1xuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuICAgICAqIEBwYXJhbSB7fSBkYXRhIFRoZSBkYXRhIHRvIHBhc3MgdG8gc3Vic2NyaWJlcnNcbiAgICAgKiBAcmV0dXJuIHsgQm9vbGVhbiB9XG4gICAgICovXG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgcmV0dXJuIHB1Ymxpc2goIG1lc3NhZ2UsIGRhdGEsIHRydWUsIFB1YlN1Yi5pbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2UuIEV2ZXJ5IHJldHVybmVkIHRva2VuIGlzIHVuaXF1ZSBhbmQgc2hvdWxkIGJlIHN0b3JlZCBpZiB5b3UgbmVlZCB0byB1bnN1YnNjcmliZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbmV3IG1lc3NhZ2UgaXMgcHVibGlzaGVkXG4gICAgICogQHJldHVybiB7IFN0cmluZyB9XG4gICAgICovXG4gICAgUHViU3ViLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBmdW5jICl7XG4gICAgICAgIGlmICggdHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZSA9ICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N5bWJvbCcpID8gbWVzc2FnZS50b1N0cmluZygpIDogbWVzc2FnZTtcblxuICAgICAgICAvLyBtZXNzYWdlIGlzIG5vdCByZWdpc3RlcmVkIHlldFxuICAgICAgICBpZiAoICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCBtZXNzYWdlICkgKXtcbiAgICAgICAgICAgIG1lc3NhZ2VzW21lc3NhZ2VdID0ge307XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JjaW5nIHRva2VuIGFzIFN0cmluZywgdG8gYWxsb3cgZm9yIGZ1dHVyZSBleHBhbnNpb25zIHdpdGhvdXQgYnJlYWtpbmcgdXNhZ2VcbiAgICAgICAgLy8gYW5kIGFsbG93IGZvciBlYXN5IHVzZSBhcyBrZXkgbmFtZXMgZm9yIHRoZSAnbWVzc2FnZXMnIG9iamVjdFxuICAgICAgICB2YXIgdG9rZW4gPSAndWlkXycgKyBTdHJpbmcoKytsYXN0VWlkKTtcbiAgICAgICAgbWVzc2FnZXNbbWVzc2FnZV1bdG9rZW5dID0gZnVuYztcblxuICAgICAgICAvLyByZXR1cm4gdG9rZW4gZm9yIHVuc3Vic2NyaWJpbmdcbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH07XG5cbiAgICBQdWJTdWIuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oIGZ1bmMgKXtcbiAgICAgICAgcmV0dXJuIFB1YlN1Yi5zdWJzY3JpYmUoQUxMX1NVQlNDUklCSU5HX01TRywgZnVuYyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2Ugb25jZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcGFyYW0geyBGdW5jdGlvbiB9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBtZXNzYWdlIGlzIHB1Ymxpc2hlZFxuICAgICAqIEByZXR1cm4geyBQdWJTdWIgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5zdWJzY3JpYmVPbmNlID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGZ1bmMgKXtcbiAgICAgICAgdmFyIHRva2VuID0gUHViU3ViLnN1YnNjcmliZSggbWVzc2FnZSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGJlZm9yZSBmdW5jIGFwcGx5LCB1bnN1YnNjcmliZSBtZXNzYWdlXG4gICAgICAgICAgICBQdWJTdWIudW5zdWJzY3JpYmUoIHRva2VuICk7XG4gICAgICAgICAgICBmdW5jLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBQdWJTdWI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENsZWFycyBhbGwgc3Vic2NyaXB0aW9uc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyQWxsU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyQWxsU3Vic2NyaXB0aW9ucygpe1xuICAgICAgICBtZXNzYWdlcyA9IHt9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICogQHJldHVybiB7IGludCB9XG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyU3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpe1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgbSkgJiYgbS5pbmRleE9mKHRvcGljKSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VzW21dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAgIENvdW50IHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBjb3VudFN1YnNjcmlwdGlvbnNcbiAgICAgKiBAcmV0dXJuIHsgQXJyYXkgfVxuICAgICovXG4gICAgUHViU3ViLmNvdW50U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNvdW50U3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgdmFyIHRva2VuO1xuICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKHRva2VuIGluIG1lc3NhZ2VzW21dKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgICBHZXRzIHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBnZXRTdWJzY3JpcHRpb25zXG4gICAgKi9cbiAgICBQdWJTdWIuZ2V0U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGdldFN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgdmFyIGxpc3QgPSBbXTtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKXtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApe1xuICAgICAgICAgICAgICAgIGxpc3QucHVzaChtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBzdWJzY3JpcHRpb25zXG4gICAgICpcbiAgICAgKiAtIFdoZW4gcGFzc2VkIGEgdG9rZW4sIHJlbW92ZXMgYSBzcGVjaWZpYyBzdWJzY3JpcHRpb24uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIGZ1bmN0aW9uLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IGZ1bmN0aW9uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIHRvcGljLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IHRvcGljIChoaWVyYXJjaHkpXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIHwgRnVuY3Rpb24gfSB2YWx1ZSBBIHRva2VuLCBmdW5jdGlvbiBvciB0b3BpYyB0byB1bnN1YnNjcmliZSBmcm9tXG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyB3aXRoIGEgdG9rZW5cbiAgICAgKiB2YXIgdG9rZW4gPSBQdWJTdWIuc3Vic2NyaWJlKCdteXRvcGljJywgbXlGdW5jKTtcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUodG9rZW4pO1xuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgd2l0aCBhIGZ1bmN0aW9uXG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKG15RnVuYyk7XG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyBmcm9tIGEgdG9waWNcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUoJ215dG9waWMnKTtcbiAgICAgKi9cbiAgICBQdWJTdWIudW5zdWJzY3JpYmUgPSBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIHZhciBkZXNjZW5kYW50VG9waWNFeGlzdHMgPSBmdW5jdGlvbih0b3BpYykge1xuICAgICAgICAgICAgICAgIHZhciBtO1xuICAgICAgICAgICAgICAgIGZvciAoIG0gaW4gbWVzc2FnZXMgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgZGVzY2VuZGFudCBvZiB0aGUgdG9waWMgZXhpc3RzOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNUb3BpYyAgICA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIHZhbHVlKSB8fCBkZXNjZW5kYW50VG9waWNFeGlzdHModmFsdWUpICksXG4gICAgICAgICAgICBpc1Rva2VuICAgID0gIWlzVG9waWMgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyxcbiAgICAgICAgICAgIGlzRnVuY3Rpb24gPSB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicsXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZSxcbiAgICAgICAgICAgIG0sIG1lc3NhZ2UsIHQ7XG5cbiAgICAgICAgaWYgKGlzVG9waWMpe1xuICAgICAgICAgICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBtIGluIG1lc3NhZ2VzICl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIG0gKSApe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlc1ttXTtcblxuICAgICAgICAgICAgICAgIGlmICggaXNUb2tlbiAmJiBtZXNzYWdlW3ZhbHVlXSApe1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWVzc2FnZVt2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyB0b2tlbnMgYXJlIHVuaXF1ZSwgc28gd2UgY2FuIGp1c3Qgc3RvcCBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHQgaW4gbWVzc2FnZSApe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlLCB0KSAmJiBtZXNzYWdlW3RdID09PSB2YWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VbdF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbn0pKTtcbiIsImltcG9ydCBQdWJTdWIgZnJvbSAncHVic3ViLWpzJztcblxuZnVuY3Rpb24gZWxlbWVudENyZWF0b3JGYWN0b3J5KCkge1xuICBmdW5jdGlvbiBjcmVhdGVEZWxCdXR0b24oKSB7XG4gICAgY29uc3QgZGVsQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgZGVsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2ltYWdlQnV0dG9uJyk7XG4gICAgZGVsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2RlbEJ1dHRvbicpO1xuXG4gICAgY29uc3QgZGVsSW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgZGVsSW1nLnNyYyA9ICcuLi9pbWFnZXMvZGVsZXRlLnBuZyc7XG5cbiAgICBkZWxCdXR0b24uYXBwZW5kQ2hpbGQoZGVsSW1nKTtcblxuICAgIHJldHVybiBkZWxCdXR0b247XG4gIH1cblxuICBmdW5jdGlvbiBkZWxCdXR0b25Qcm9qZWN0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZGVsZXRlUHJvamVjdCcsIGlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbEJ1dHRvblRhc2t0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZGVsZXRlVGFzaycsIGlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUVkaXRCdXR0b24oKSB7XG4gICAgY29uc3QgZWRpdEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGVkaXRCdXR0b24uY2xhc3NMaXN0LmFkZCgnaW1hZ2VCdXR0b24nKTtcbiAgICBlZGl0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2VkaXRCdXR0b24nKTtcbiAgICBlZGl0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3BvcHVwJyk7XG5cbiAgICBjb25zdCBlZGl0SW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgZWRpdEltZy5zcmMgPSAnLi4vaW1hZ2VzL2FyY2hpdmUtZWRpdC5wbmcnO1xuXG4gICAgZWRpdEJ1dHRvbi5hcHBlbmRDaGlsZChlZGl0SW1nKTtcblxuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygncG9wdXBDcmVhdGVkJywgZWRpdEJ1dHRvbik7XG5cbiAgICByZXR1cm4gZWRpdEJ1dHRvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZURlc2NFbGVtZW50KGRlc2MpIHtcbiAgICBjb25zdCBkZXNjRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRlc2NFbGVtZW50LmlubmVyVGV4dCA9IGRlc2M7XG4gICAgZGVzY0VsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZGVzY3JpcHRpb24nKTtcbiAgICBkZXNjRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcblxuICAgIHJldHVybiBkZXNjRWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUVkaXRQcm9qZWN0Rm9ybSgpIHtcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICBmb3JtRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmb3JtJyk7XG5cbiAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGhlYWRlci50ZXh0Q29udGVudCA9ICdFZGl0IFByb2plY3QnO1xuXG4gICAgY29uc3QgdGl0bGVMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgdGl0bGVMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICd0aXRsZScpO1xuICAgIHRpdGxlTGFiZWwudGV4dENvbnRlbnQgPSAnVGl0bGUnO1xuXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgdGl0bGVJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIHRpdGxlSW5wdXQubmFtZSA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5pZCA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5yZXF1aXJlZCA9IHRydWU7XG5cbiAgICBjb25zdCBkZXNjTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgIGRlc2NMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdkZXNjJyk7XG4gICAgZGVzY0xhYmVsLnRleHRDb250ZW50ID0gJ0Rlc2NyaXB0aW9uJztcblxuICAgIGNvbnN0IGRlc2NJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgZGVzY0lucHV0Lm5hbWUgPSAnZGVzYyc7XG4gICAgZGVzY0lucHV0LmlkID0gJ2Rlc2MnO1xuICAgIGRlc2NJbnB1dC5zZXRBdHRyaWJ1dGUoJ2NvbHMnLCAnMTAnKTtcbiAgICBkZXNjSW5wdXQuc2V0QXR0cmlidXRlKCdyb3dzJywgJzEwJyk7XG5cbiAgICBjb25zdCBzdWJCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBzdWJCdXR0b24udGV4dENvbnRlbnQgPSAnU3VibWl0JztcbiAgICBzdWJCdXR0b24udHlwZSA9ICdzdWJtaXQnO1xuICAgIHN1YkJ1dHRvbi5pZCA9ICdzdWJtaXQnO1xuXG4gICAgZm9ybUVsZW1lbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICBmb3JtRWxlbWVudC5hcHBlbmRDaGlsZCh0aXRsZUxhYmVsKTtcbiAgICBmb3JtRWxlbWVudC5hcHBlbmRDaGlsZCh0aXRsZUlucHV0KTtcbiAgICBmb3JtRWxlbWVudC5hcHBlbmRDaGlsZChkZXNjTGFiZWwpO1xuICAgIGZvcm1FbGVtZW50LmFwcGVuZENoaWxkKGRlc2NJbnB1dCk7XG4gICAgZm9ybUVsZW1lbnQuYXBwZW5kQ2hpbGQoc3ViQnV0dG9uKTtcblxuICAgIHJldHVybiBmb3JtRWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUVkaXRUYXNrRm9ybSgpIHtcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICBmb3JtRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmb3JtJyk7XG5cbiAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGhlYWRlci50ZXh0Q29udGVudCA9ICdFZGl0IFRhc2snO1xuXG4gICAgY29uc3QgdGl0bGVMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgdGl0bGVMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICd0aXRsZScpO1xuICAgIHRpdGxlTGFiZWwudGV4dENvbnRlbnQgPSAnVGl0bGUnO1xuXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgdGl0bGVJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIHRpdGxlSW5wdXQubmFtZSA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5pZCA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5yZXF1aXJlZCA9IHRydWU7XG5cbiAgICBjb25zdCBkZXNjTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgIGRlc2NMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdkZXNjJyk7XG4gICAgZGVzY0xhYmVsLnRleHRDb250ZW50ID0gJ0Rlc2NyaXB0aW9uJztcblxuICAgIGNvbnN0IGRlc2NJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgZGVzY0lucHV0Lm5hbWUgPSAnZGVzYyc7XG4gICAgZGVzY0lucHV0LmlkID0gJ2Rlc2MnO1xuICAgIGRlc2NJbnB1dC5zZXRBdHRyaWJ1dGUoJ2NvbHMnLCAnMTAnKTtcbiAgICBkZXNjSW5wdXQuc2V0QXR0cmlidXRlKCdyb3dzJywgJzEwJyk7XG5cbiAgICBjb25zdCBwcmlvcml0eUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICBwcmlvcml0eUxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgJ3ByaW9yaXR5Jyk7XG4gICAgcHJpb3JpdHlMYWJlbC50ZXh0Q29udGVudCA9ICdQcmlvcml0eSc7XG5cbiAgICBjb25zdCBwcmlvcml0eUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gICAgcHJpb3JpdHlJbnB1dC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAncHJpb3JpdHknKTtcbiAgICBwcmlvcml0eUlucHV0LnNldEF0dHJpYnV0ZSgnaWQnLCAncHJpb3JpdHknKTtcbiAgICBjb25zdCBub3JtYWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBub3JtYWwudmFsdWUgPSAnMCc7XG4gICAgbm9ybWFsLnRleHRDb250ZW50ID0gJ05vcm1hbCc7XG4gICAgY29uc3QgaGlnaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIGhpZ2gudmFsdWUgPSAnMSc7XG4gICAgaGlnaC50ZXh0Q29udGVudCA9ICdIaWdoJztcbiAgICBjb25zdCBoaWdoZXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgbm9ybWFsLnZhbHVlID0gJzInO1xuICAgIGhpZ2hlc3QudGV4dENvbnRlbnQgPSAnSGlnaGVzdCc7XG5cbiAgICBwcmlvcml0eUlucHV0LmFwcGVuZENoaWxkKG5vcm1hbCk7XG4gICAgcHJpb3JpdHlJbnB1dC5hcHBlbmRDaGlsZChoaWdoKTtcbiAgICBwcmlvcml0eUlucHV0LmFwcGVuZENoaWxkKGhpZ2hlc3QpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICBkdWVEYXRlTGFiZWwuc2V0QXR0cmlidXRlKCdmb3InLCAnZHVlRGF0ZScpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICBkdWVEYXRlSW5wdXQudHlwZSA9ICdkYXRlJztcbiAgICBkdWVEYXRlSW5wdXQubmFtZSA9ICdkdWVEYXRlJztcbiAgICBkdWVEYXRlSW5wdXQuaWQgPSAnZHVlRGF0ZSc7XG5cbiAgICBjb25zdCBzdWJCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBzdWJCdXR0b24udGV4dENvbnRlbnQgPSAnU3VibWl0JztcbiAgICBzdWJCdXR0b24udHlwZSA9ICdzdWJtaXQnO1xuICAgIHN1YkJ1dHRvbi5pZCA9ICdzdWJtaXQnO1xuXG4gICAgZm9ybUVsZW1lbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICBmb3JtRWxlbWVudC5hcHBlbmRDaGlsZCh0aXRsZUxhYmVsKTtcbiAgICBmb3JtRWxlbWVudC5hcHBlbmRDaGlsZCh0aXRsZUlucHV0KTtcbiAgICBmb3JtRWxlbWVudC5hcHBlbmRDaGlsZChkZXNjTGFiZWwpO1xuICAgIGZvcm1FbGVtZW50LmFwcGVuZENoaWxkKGRlc2NJbnB1dCk7XG4gICAgZm9ybUVsZW1lbnQuYXBwZW5kQ2hpbGQocHJpb3JpdHlMYWJlbCk7XG4gICAgZm9ybUVsZW1lbnQuYXBwZW5kQ2hpbGQocHJpb3JpdHlJbnB1dCk7XG4gICAgZm9ybUVsZW1lbnQuYXBwZW5kQ2hpbGQoZHVlRGF0ZUxhYmVsKTtcbiAgICBmb3JtRWxlbWVudC5hcHBlbmRDaGlsZChkdWVEYXRlSW5wdXQpO1xuICAgIGZvcm1FbGVtZW50LmFwcGVuZENoaWxkKHN1YkJ1dHRvbik7XG5cbiAgICByZXR1cm4gZm9ybUVsZW1lbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTdGF0dXNCdXR0b24oKSB7XG4gICAgY29uc3Qgc3RhdHVzQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgc3RhdHVzQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2ltYWdlQnV0dG9uJyk7XG5cbiAgICBjb25zdCBzdGF0dXNJbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICBzdGF0dXNJbWcuc3JjID0gJy4uL2ltYWdlcy9jaXJjbGUtb3V0bGluZS5wbmcnO1xuXG4gICAgc3RhdHVzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgc3RhdHVzSW1nLnNyYyA9ICcuLi9pbWFnZXMvY2lyY2xlLnBuZyc7XG4gICAgfSk7XG5cbiAgICBzdGF0dXNCdXR0b24uYXBwZW5kQ2hpbGQoc3RhdHVzSW1nKTtcblxuICAgIHJldHVybiBzdGF0dXNCdXR0b247XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVEYXRlRWxlbWVudChkYXRlKSB7XG4gICAgY29uc3QgZGF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkYXRlRWxlbWVudC5pbm5lclRleHQgPSBkYXRlO1xuXG4gICAgcmV0dXJuIGRhdGVFbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gZWRpdFByb2plY3QoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGlkID0gdGhpcy5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0aWQnKTtcbiAgICBjb25zdCBteUZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGV2ZW50LnRhcmdldCk7XG4gICAgY29uc3QgcHJvamVjdEluZm8gPSBPYmplY3QuZnJvbUVudHJpZXMobXlGb3JtRGF0YS5lbnRyaWVzKCkpO1xuXG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdlZGl0UHJvamVjdCcsIFtwcm9qZWN0SW5mbywgaWRdKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVkaXRUYXNrKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpZCA9IHRoaXMucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGFza2lkJyk7XG4gICAgY29uc3QgbXlGb3JtRGF0YSA9IG5ldyBGb3JtRGF0YShldmVudC50YXJnZXQpO1xuICAgIGNvbnN0IHRhc2tJbmZvID0gT2JqZWN0LmZyb21FbnRyaWVzKG15Rm9ybURhdGEuZW50cmllcygpKTtcblxuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZWRpdFRhc2snLCBbdGFza0luZm8sIGlkXSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVQcm9qZWN0RWxlbWVudChwcm9qZWN0SW5mbywgaWQpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcHJvamVjdC5jbGFzc0xpc3QuYWRkKCdwcm9qZWN0Jyk7XG4gICAgcHJvamVjdC5pbm5lclRleHQgPSBwcm9qZWN0SW5mby5nZXRUaXRsZSgpO1xuICAgIHByb2plY3Quc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3RJRCcsIGlkKTtcblxuICAgIGNvbnN0IGRlc2NFbGVtZW50ID0gY3JlYXRlRGVzY0VsZW1lbnQocHJvamVjdEluZm8uZ2V0RGVzYygpKTtcbiAgICBjb25zdCBkZWxCdXR0b24gPSBjcmVhdGVEZWxCdXR0b24oKTtcbiAgICBkZWxCdXR0b25Qcm9qZWN0TGlzdGVuZXIoZGVsQnV0dG9uLCBpZCk7XG4gICAgY29uc3QgZWRpdEJ1dHRvbiA9IGNyZWF0ZUVkaXRCdXR0b24oKTtcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IGNyZWF0ZUVkaXRQcm9qZWN0Rm9ybSgpO1xuICAgIGZvcm1FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGVkaXRQcm9qZWN0KTtcblxuICAgIHByb2plY3QuYXBwZW5kQ2hpbGQoZWRpdEJ1dHRvbik7XG4gICAgcHJvamVjdC5hcHBlbmRDaGlsZChmb3JtRWxlbWVudCk7XG4gICAgcHJvamVjdC5hcHBlbmRDaGlsZChkZWxCdXR0b24pO1xuICAgIHByb2plY3QuYXBwZW5kQ2hpbGQoZGVzY0VsZW1lbnQpO1xuICAgIHByb2plY3Qub25jbGljayA9ICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygncHJvamVjdENsaWNrZWQnLCBwcm9qZWN0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHByb2plY3Q7XG4gIH1cblxuICAvLyBjcmVhdGUgdGFza0VsZW1lbnRcbiAgZnVuY3Rpb24gY3JlYXRlVGFza0VsZW1lbnQodGFza0luZm8sIGlkKSB7XG4gICAgY29uc3QgdGFzayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnN0IHRpdGxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRpdGxlRWxlbWVudC5pbm5lclRleHQgPSB0YXNrSW5mby5nZXRUaXRsZSgpO1xuICAgIHRhc2suY2xhc3NMaXN0LmFkZCgndGFzaycpO1xuICAgIHRhc2suc2V0QXR0cmlidXRlKCdkYXRhLXRhc2tJRCcsIGlkKTtcblxuICAgIC8vIHByaW9yaXR5XG4gICAgaWYgKHRhc2tJbmZvLmdldFByaW9yaXR5KCkgPT09ICcwJykge1xuICAgICAgdGFzay5jbGFzc0xpc3QuYWRkKCdub3JtYWwnKTtcbiAgICB9IGVsc2UgaWYgKHRhc2tJbmZvLmdldFByaW9yaXR5KCkgPT09ICcxJykge1xuICAgICAgdGFzay5jbGFzc0xpc3QuYWRkKCdoaWdoJyk7XG4gICAgfSBlbHNlIGlmICh0YXNrSW5mby5nZXRQcmlvcml0eSgpID09PSAnMicpIHtcbiAgICAgIHRhc2suY2xhc3NMaXN0LmFkZCgnaGlnaGVzdCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXR1c0J1dHRvbiA9IGNyZWF0ZVN0YXR1c0J1dHRvbigpO1xuICAgIGNvbnN0IGRhdGVFbGVtZW50ID0gY3JlYXRlRGF0ZUVsZW1lbnQodGFza0luZm8uZ2V0RHVlRGF0ZSgpKTtcbiAgICBjb25zdCBkZWxCdXR0b24gPSBjcmVhdGVEZWxCdXR0b24oaWQpO1xuICAgIGRlbEJ1dHRvblRhc2t0TGlzdGVuZXIoZGVsQnV0dG9uLCBpZCk7XG4gICAgY29uc3QgZWRpdEJ1dHRvbiA9IGNyZWF0ZUVkaXRCdXR0b24oKTtcbiAgICBjb25zdCBkZXNjRWxlbWVudCA9IGNyZWF0ZURlc2NFbGVtZW50KHRhc2tJbmZvLmdldERlc2MoKSk7XG4gICAgY29uc3QgZm9ybUVsZW1lbnQgPSBjcmVhdGVFZGl0VGFza0Zvcm0oKTtcbiAgICBmb3JtRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBlZGl0VGFzayk7XG5cbiAgICB0YXNrLmFwcGVuZENoaWxkKHN0YXR1c0J1dHRvbik7XG4gICAgdGFzay5hcHBlbmRDaGlsZCh0aXRsZUVsZW1lbnQpO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZGF0ZUVsZW1lbnQpO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZWRpdEJ1dHRvbik7XG4gICAgdGFzay5hcHBlbmRDaGlsZChmb3JtRWxlbWVudCk7XG4gICAgdGFzay5hcHBlbmRDaGlsZChkZWxCdXR0b24pO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZGVzY0VsZW1lbnQpO1xuICAgIHRhc2sub25jbGljayA9ICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygndGFza0NsaWNrZWQnLCB0YXNrKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRhc2s7XG4gIH1cblxuICByZXR1cm4geyBjcmVhdGVQcm9qZWN0RWxlbWVudCwgY3JlYXRlVGFza0VsZW1lbnQgfTtcbn1cblxuY29uc3QgZWxlbWVudENyZWF0b3IgPSBlbGVtZW50Q3JlYXRvckZhY3RvcnkoKTtcbmV4cG9ydCBkZWZhdWx0IGVsZW1lbnRDcmVhdG9yO1xuIiwiaW1wb3J0IFB1YlN1YiBmcm9tICdwdWJzdWItanMnO1xuaW1wb3J0IG1hc3RlciBmcm9tICcuL21hc3Rlcic7XG5pbXBvcnQgZWxlbWVudENyZWF0b3IgZnJvbSAnLi9lbGVtZW50Q3JlYXRvcic7XG5cbmZ1bmN0aW9uIGVsZW1lbnRMb2FkZXJGYWN0b3J5KCkge1xuICBjb25zdCBjb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNvbnRlbnRCYXInKTtcbiAgY29uc3QgYmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnByb2plY3RzQmFyJyk7XG4gIFB1YlN1Yi5zdWJzY3JpYmUoJ21hc3RlckNoYW5nZWQnLCBsb2FkQmFyKTtcbiAgUHViU3ViLnN1YnNjcmliZSgnc2VsZWN0ZWRQcm9qZWN0Q2hhbmdlZCcsIGxvYWRDb250ZW50KTtcblxuICBmdW5jdGlvbiBjbGVhckJhcigpIHtcbiAgICBiYXIuaW5uZXJUZXh0ID0gJyc7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckNvbnRlbnQoKSB7XG4gICAgY29udGVudC5pbm5lclRleHQgPSAnJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRCYXIoKSB7XG4gICAgY2xlYXJCYXIoKTtcbiAgICBjb25zdCBwcm9qZWN0cyA9IG1hc3Rlci5nZXRQcm9qZWN0cygpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9qZWN0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY29uc3QgbmV3UHJvakVsZSA9IGVsZW1lbnRDcmVhdG9yLmNyZWF0ZVByb2plY3RFbGVtZW50KHByb2plY3RzW2ldLCBpKTtcbiAgICAgIGJhci5hcHBlbmRDaGlsZChuZXdQcm9qRWxlKTtcbiAgICB9XG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdwYWdlUmVmcmVzaGVkJyk7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkQ29udGVudCgpIHtcbiAgICBjbGVhckNvbnRlbnQoKTtcbiAgICBpZiAobWFzdGVyLmdldFNlbGVjdGVkUHJvamVjdCgpID09PSBudWxsKSB7XG4gICAgICBjb250ZW50LnRleHRDb250ZW50ID0gJ0Nob29zZSBhIGxpc3QnO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0YXNrcyA9IG1hc3Rlci5nZXRTZWxlY3RlZFByb2plY3QoKS5nZXRUYXNrcygpO1xuICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhc2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb25zdCBuZXdUYXNrID0gZWxlbWVudENyZWF0b3IuY3JlYXRlVGFza0VsZW1lbnQodGFza3NbaV0sIGkpO1xuICAgICAgY29udGVudC5hcHBlbmQobmV3VGFzayk7XG4gICAgfVxuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygncGFnZVJlZnJlc2hlZCcpO1xuICB9XG4gIHJldHVybiB7IGxvYWRCYXIsIGxvYWRDb250ZW50IH07XG59XG5cbmNvbnN0IGVsZW1lbnRMb2FkZXIgPSBlbGVtZW50TG9hZGVyRmFjdG9yeSgpO1xuZXhwb3J0IGRlZmF1bHQgZWxlbWVudExvYWRlcjtcbiIsImltcG9ydCBQdWJTdWIgZnJvbSAncHVic3ViLWpzJztcbmltcG9ydCBtYXN0ZXIgZnJvbSAnLi9tYXN0ZXInO1xuXG5mdW5jdGlvbiBpbnB1dEhhbmRsZXJGYWN0b3J5KCkge1xuICBQdWJTdWIuc3Vic2NyaWJlKCdwYWdlUmVmcmVzaGVkJywgcmVmcmVzaFBvcHVwKTtcbiAgUHViU3ViLnN1YnNjcmliZSgncHJvamVjdENsaWNrZWQnLCBzZWxlY3RQcm9qZWN0KTtcbiAgUHViU3ViLnN1YnNjcmliZSgndGFza0NsaWNrZWQnLCBzZWxlY3RUYXNrKTtcblxuICBsZXQgcG9wdXBzID0gWy4uLmRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3BvcHVwJyldO1xuICBwb3B1cHMuZm9yRWFjaCgocCkgPT4ge1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGUpO1xuICB9KTtcblxuICBjb25zdCBjcmVhdGVQcm9qZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnByb2plY3RGb3JtJyk7XG4gIGNyZWF0ZVByb2plY3QuYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgbmV3UHJvamVjdCk7XG5cbiAgY29uc3QgY3JlYXRlVGFzayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50YXNrRm9ybScpO1xuICBjcmVhdGVUYXNrLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIG5ld1Rhc2spO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICh7IHRhcmdldCB9KSA9PiB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHtcbiAgICAgIGlmICh0YXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ3BvcHVwJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGFyZ2V0LnBhcmVudE5vZGUgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQgfHwgdGFyZ2V0IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHBvcHVwcy5mb3JFYWNoKChwKSA9PiBwLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHJlZnJlc2hQb3B1cChtc2cpIHtcbiAgICBwb3B1cHMgPSBbLi4uZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncG9wdXAnKV07XG4gICAgcG9wdXBzLmZvckVhY2goKHApID0+IHtcbiAgICAgIHAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGUpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9nZ2xlKGV2ZW50KSB7XG4gICAgY29uc3QgeyBwYXJlbnROb2RlIH0gPSBldmVudC50YXJnZXQ7XG4gICAgcG9wdXBzLmZvckVhY2goKHApID0+IHtcbiAgICAgIGlmIChwICE9PSBwYXJlbnROb2RlKSB7XG4gICAgICAgIGlmIChwLmNsYXNzTGlzdC5jb250YWlucygnc2hvdycpKSB7XG4gICAgICAgICAgcC5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHAuY2xhc3NMaXN0LnRvZ2dsZSgnc2hvdycpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gbmV3UHJvamVjdChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgbXlGb3JtRGF0YSA9IG5ldyBGb3JtRGF0YShldmVudC50YXJnZXQpO1xuICAgIGNvbnN0IHByb2plY3RJbmZvID0gT2JqZWN0LmZyb21FbnRyaWVzKG15Rm9ybURhdGEuZW50cmllcygpKTtcbiAgICBtYXN0ZXIubWFrZVByb2plY3QocHJvamVjdEluZm8pO1xuICB9XG5cbiAgZnVuY3Rpb24gbmV3VGFzayhldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgbXlGb3JtRGF0YSA9IG5ldyBGb3JtRGF0YShldmVudC50YXJnZXQpO1xuICAgIGNvbnN0IHRhc2tJbmZvID0gT2JqZWN0LmZyb21FbnRyaWVzKG15Rm9ybURhdGEuZW50cmllcygpKTtcbiAgICBtYXN0ZXIuYWRkVGFza1RvU2VsZWN0ZWQodGFza0luZm8pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VsZWN0UHJvamVjdChtc2csIHByb2plY3RUb1NlbGVjdCkge1xuICAgIGNvbnN0IHByb2plY3RzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2plY3QnKTtcblxuICAgIHByb2plY3RzLmZvckVhY2goKHByb2plY3QpID0+IHtcbiAgICAgIGlmIChwcm9qZWN0LmNsYXNzTGlzdC5jb250YWlucygnc2VsZWN0ZWQnKSAmJiBwcm9qZWN0ICE9PSBwcm9qZWN0VG9TZWxlY3QpIHtcbiAgICAgICAgcHJvamVjdC5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcHJvamVjdFRvU2VsZWN0LmNsYXNzTGlzdC50b2dnbGUoJ3NlbGVjdGVkJyk7XG4gICAgbWFzdGVyLnNldFNlbGVjdGVkUHJvamVjdChwcm9qZWN0VG9TZWxlY3QuZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3RJRCcpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdFRhc2sobXNnLCB0YXNrVG9TZWxlY3QpIHtcbiAgICBjb25zdCBwcm9qZWN0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YXNrJyk7XG5cbiAgICBwcm9qZWN0cy5mb3JFYWNoKCh0YXNrKSA9PiB7XG4gICAgICBpZiAodGFzay5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdGVkJykgJiYgdGFzayAhPT0gdGFza1RvU2VsZWN0KSB7XG4gICAgICAgIHRhc2suY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRhc2tUb1NlbGVjdC5jbGFzc0xpc3QudG9nZ2xlKCdzZWxlY3RlZCcpO1xuICB9XG59XG5cbmNvbnN0IGlucHV0SGFuZGxlciA9IGlucHV0SGFuZGxlckZhY3RvcnkoKTtcbmV4cG9ydCBkZWZhdWx0IGlucHV0SGFuZGxlcjtcbiIsImltcG9ydCBQdWJTdWIgZnJvbSAncHVic3ViLWpzJztcbmltcG9ydCBjcmVhdGVQcm9qZWN0IGZyb20gJy4vcHJvamVjdCc7XG5cbmZ1bmN0aW9uIG1hc3RlclByb2plY3QoKSB7XG4gIGNvbnN0IF9wcm9qZWN0cyA9IFtdO1xuICBsZXQgc2VsZWN0ZWRQcm9qZWN0ID0gbnVsbDtcbiAgUHViU3ViLnN1YnNjcmliZSgnZGVsZXRlUHJvamVjdCcsIGRlbGV0ZVByb2plY3QpO1xuICBQdWJTdWIuc3Vic2NyaWJlKCdlZGl0UHJvamVjdCcsIGVkaXRQcm9qZWN0KTtcbiAgUHViU3ViLnN1YnNjcmliZSgnZWRpdFRhc2snLCBlZGl0VGFzayk7XG5cbiAgZnVuY3Rpb24gZGVsZXRlUHJvamVjdChkYXRhLCBpZCkge1xuICAgIF9wcm9qZWN0cy5zcGxpY2UoaWQsIDEpO1xuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnbWFzdGVyQ2hhbmdlZCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZVByb2plY3QocHJvamVjdEluZm8pIHtcbiAgICBjb25zdCBuZXdQcm9qZWN0ID0gY3JlYXRlUHJvamVjdChwcm9qZWN0SW5mby50aXRsZSwgcHJvamVjdEluZm8uZGVzYyk7XG4gICAgX3Byb2plY3RzLnB1c2gobmV3UHJvamVjdCk7XG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdtYXN0ZXJDaGFuZ2VkJyk7XG4gIH1cblxuICBmdW5jdGlvbiBlZGl0UHJvamVjdChtc2csIGRhdGEpIHtcbiAgICBjb25zdCBwcm9qZWN0SW5mbyA9IGRhdGFbMF07XG4gICAgY29uc3QgaWQgPSBkYXRhWzFdO1xuICAgIF9wcm9qZWN0c1tpZF0uc2V0VGl0bGUocHJvamVjdEluZm8udGl0bGUpO1xuICAgIF9wcm9qZWN0c1tpZF0uc2V0RGVzYyhwcm9qZWN0SW5mby5kZXNjKTtcbiAgICBQdWJTdWIucHVibGlzaFN5bmMoJ21hc3RlckNoYW5nZWQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFByb2plY3RzKCkge1xuICAgIHJldHVybiBfcHJvamVjdHM7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRTZWxlY3RlZFByb2plY3QoaWQpIHtcbiAgICBzZWxlY3RlZFByb2plY3QgPSBfcHJvamVjdHNbaWRdO1xuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnc2VsZWN0ZWRQcm9qZWN0Q2hhbmdlZCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRQcm9qZWN0KCkge1xuICAgIHJldHVybiBzZWxlY3RlZFByb2plY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRUYXNrVG9TZWxlY3RlZCh0YXNrSW5mbykge1xuICAgIGlmIChzZWxlY3RlZFByb2plY3QgPT09IG51bGwpIHtcbiAgICAgIGFsZXJ0KCdubyBsaXN0IGhhcyBiZWVuIHNlbGVjdGVkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGVjdGVkUHJvamVjdC5hZGRUYXNrKHRhc2tJbmZvKTtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnc2VsZWN0ZWRQcm9qZWN0Q2hhbmdlZCcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVkaXRUYXNrKG1zZywgZGF0YSkge1xuICAgIGlmIChzZWxlY3RlZFByb2plY3QgPT09IG51bGwpIHtcbiAgICAgIGFsZXJ0KCdubyBsaXN0IGhhcyBiZWVuIHNlbGVjdGVkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlkID0gZGF0YVsxXTtcbiAgICAgIGNvbnN0IHRhc2tJbmZvID0gZGF0YVswXTtcbiAgICAgIHNlbGVjdGVkUHJvamVjdC5lZGl0VGFzayhpZCwgdGFza0luZm8pO1xuICAgICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdzZWxlY3RlZFByb2plY3RDaGFuZ2VkJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkZWxldGVQcm9qZWN0LFxuICAgIG1ha2VQcm9qZWN0LFxuICAgIGdldFByb2plY3RzLFxuICAgIGVkaXRQcm9qZWN0LFxuICAgIHNldFNlbGVjdGVkUHJvamVjdCxcbiAgICBnZXRTZWxlY3RlZFByb2plY3QsXG4gICAgYWRkVGFza1RvU2VsZWN0ZWQsXG4gIH07XG59XG5jb25zdCBtYXN0ZXIgPSBtYXN0ZXJQcm9qZWN0KCk7XG4vLyBtYXN0ZXIubWFrZVByb2plY3QoeyB0aXRsZTogJ21vbmRheScsIGRlc2M6ICd0b2RheSBpcyBtb25kYXknIH0pO1xuLy8gbWFzdGVyLm1ha2VQcm9qZWN0KHsgdGl0bGU6ICd0dWVzZGF5JywgZGVzYzogJ3RvZGF5IGlzIHR1ZXNkYXknIH0pO1xuLy8gbWFzdGVyLm1ha2VQcm9qZWN0KHsgdGl0bGU6ICd3ZWRuZXNkYXknLCBkZXNjOiAndG9kYXkgaXMgd2VkbmVzZGF5JyB9KTtcbi8vIG1hc3Rlci5zZXRTZWxlY3RlZFByb2plY3QoMCk7XG4vLyBjb25zdCBwcm9qZWN0ID0gbWFzdGVyLmdldFNlbGVjdGVkUHJvamVjdCgpO1xuLy8gcHJvamVjdC5hZGRUYXNrKHtcbi8vICAgdGl0bGU6ICd0YXNrIDEnLCBkZXNjOiAndGFzayAxIGRlc2NyaXB0aW9uJywgZHVlRGF0ZTogRGF0ZSgpLCBwcmlvcml0eTogJ25vcm1hbCcsXG4vLyB9KTtcbi8vIHByb2plY3QuYWRkVGFzayh7IHRpdGxlOiAndGFzayAyJywgZHVlRGF0ZTogRGF0ZSgpLCBwcmlvcml0eTogJ25vcm1hbCcgfSk7XG4vLyBwcm9qZWN0LmFkZFRhc2soeyB0aXRsZTogJ3Rhc2sgMycsIGR1ZURhdGU6IERhdGUoKSwgcHJpb3JpdHk6ICdub3JtYWwnIH0pO1xuLy8gcHJvamVjdC5hZGRUYXNrKHsgdGl0bGU6ICd0YXNrIDQnLCBkdWVEYXRlOiBEYXRlKCksIHByaW9yaXR5OiAnbm9ybWFsJyB9KTtcblxuZXhwb3J0IGRlZmF1bHQgbWFzdGVyO1xuIiwiaW1wb3J0IGNyZWF0ZVRhc2sgZnJvbSAnLi90YXNrJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlUHJvamVjdCh0aXRsZSwgZGVzYykge1xuICBsZXQgX3RpdGxlID0gdGl0bGU7XG4gIGxldCBfZGVzYyA9IGRlc2M7XG4gIGNvbnN0IF90YXNrcyA9IFtdO1xuXG4gIGZ1bmN0aW9uIGdldFRpdGxlKCkge1xuICAgIHJldHVybiBfdGl0bGU7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRUaXRsZShuZXdUaXRsZSkge1xuICAgIF90aXRsZSA9IG5ld1RpdGxlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RGVzYygpIHtcbiAgICByZXR1cm4gX2Rlc2M7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREZXNjKG5ld0Rlc2MpIHtcbiAgICBfZGVzYyA9IG5ld0Rlc2M7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRUYXNrKHRhc2tJbmZvKSB7XG4gICAgY29uc3QgbmV3VGFzayA9IGNyZWF0ZVRhc2sodGFza0luZm8udGl0bGUsIHRhc2tJbmZvLmRlc2MsIHRhc2tJbmZvLmR1ZURhdGUsIHRhc2tJbmZvLnByaW9yaXR5KTtcbiAgICBfdGFza3MucHVzaChuZXdUYXNrKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGV0ZVRhc2soaWQpIHtcbiAgICBfdGFza3Muc3BsaWNlKGlkLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVkaXRUYXNrKGlkLCB0YXNrSW5mbykge1xuICAgIF90YXNrc1tpZF0uc2V0VGl0bGUodGFza0luZm8udGl0bGUpO1xuICAgIF90YXNrc1tpZF0uc2V0RGVzYyh0YXNrSW5mby5kZXNjKTtcbiAgICBfdGFza3NbaWRdLnNldER1ZURhdGUodGFza0luZm8uZHVlRGF0ZSk7XG4gICAgX3Rhc2tzW2lkXS5zZXRQcmlvcml0eSh0YXNrSW5mby5wcmlvcml0eSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUYXNrcygpIHtcbiAgICByZXR1cm4gX3Rhc2tzO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnZXRUaXRsZSwgc2V0VGl0bGUsIGdldERlc2MsIHNldERlc2MsIGFkZFRhc2ssIGRlbGV0ZVRhc2ssIGVkaXRUYXNrLCBnZXRUYXNrcyxcbiAgfTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVRhc2sodGl0bGUsIGRlc2MsIGR1ZURhdGUsIHByaW9yaXR5KSB7XG4gIGxldCBfdGl0bGUgPSB0aXRsZTtcbiAgbGV0IF9kZXNjID0gZGVzYztcbiAgbGV0IF9kdWVEYXRlID0gZHVlRGF0ZTtcbiAgbGV0IF9wcmlvcml0eSA9IHByaW9yaXR5O1xuXG4gIGZ1bmN0aW9uIHNldFRpdGxlKG5ld1RpdGxlKSB7XG4gICAgX3RpdGxlID0gbmV3VGl0bGU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUaXRsZSgpIHtcbiAgICByZXR1cm4gX3RpdGxlO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0RGVzYyhuZXdEZXNjKSB7XG4gICAgX2Rlc2MgPSBuZXdEZXNjO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RGVzYygpIHtcbiAgICByZXR1cm4gX2Rlc2M7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREdWVEYXRlKG5ld0RhdGUpIHtcbiAgICBfZHVlRGF0ZSA9IG5ld0RhdGU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREdWVEYXRlKCkge1xuICAgIHJldHVybiBfZHVlRGF0ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFByaW9yaXR5KHByaW8pIHtcbiAgICBfcHJpb3JpdHkgPSBwcmlvO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIF9wcmlvcml0eTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2V0VGl0bGUsIGdldFRpdGxlLCBzZXREdWVEYXRlLCBnZXREdWVEYXRlLCBzZXREZXNjLCBnZXREZXNjLCBzZXRQcmlvcml0eSwgZ2V0UHJpb3JpdHksXG4gIH07XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHRsb2FkZWQ6IGZhbHNlLFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwiaW1wb3J0IGVsZW1lbnRMb2FkZXIgZnJvbSAnLi9lbGVtZW50TG9hZGVyJztcbmltcG9ydCBpbnB1dEhhbmRsZXIgZnJvbSAnLi9pbnB1dEhhbmRsZXInO1xuXG5lbGVtZW50TG9hZGVyLmxvYWRCYXIoKTtcbmVsZW1lbnRMb2FkZXIubG9hZENvbnRlbnQoKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==