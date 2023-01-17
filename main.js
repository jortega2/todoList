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
    editImg.src = '../images/archive-edit.png';

    editButton.appendChild(editImg);

    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('popupCreated', editButton);

    return editButton;
  }

  function createDescElement(desc) {
    const descElement = document.createElement('div');
    descElement.innerText = desc;
    descElement.classList.add('description');
    descElement.style.display = 'none';

    return descElement;
  }

  function createEditProjectForm() {
    const form = document.createElement('form');
    form.classList.add('form');

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

    form.appendChild(header);
    form.appendChild(titleLabel);
    form.appendChild(titleInput);
    form.appendChild(descLabel);
    form.appendChild(descInput);
    form.appendChild(subButton);

    return form;
  }

  function createEditTaskForm() {
    const form = document.createElement('form');
    form.classList.add('form');

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

    form.appendChild(header);
    form.appendChild(titleLabel);
    form.appendChild(titleInput);
    form.appendChild(descLabel);
    form.appendChild(descInput);
    form.appendChild(priorityLabel);
    form.appendChild(priorityInput);
    form.appendChild(dueDateLabel);
    form.appendChild(dueDateInput);
    form.appendChild(subButton);

    return form;
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
    const form = createEditProjectForm();
    form.addEventListener('submit', editProject);

    project.appendChild(editButton);
    project.appendChild(form);
    project.appendChild(delButton);
    project.appendChild(descElement);

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
    const projects = _master__WEBPACK_IMPORTED_MODULE_1__["default"].getProjects();

    for (let i = 0; i < projects.length; i += 1) {
      const newProjEle = _elementCreator__WEBPACK_IMPORTED_MODULE_2__["default"].createProjectElement(projects[i], i);
      bar.appendChild(newProjEle);
    }
    pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().publishSync('pageRefreshed');
  }

  function loadContent() {
    clearContent();
    const tasks = _master__WEBPACK_IMPORTED_MODULE_1__["default"].getSelectedProject().getTasks();

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

  pubsub_js__WEBPACK_IMPORTED_MODULE_0___default().subscribe('pageRefreshed', refreshPopup);

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



})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RXOEI7O0FBRS9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFNLDREQUFrQjtBQUN4QixLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBLE1BQU0sNERBQWtCO0FBQ3hCLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQSxJQUFJLDREQUFrQjs7QUFFdEI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFD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QUFhO1dBQzdEOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDSjRDO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90b2RvbGlzdC8uL25vZGVfbW9kdWxlcy9wdWJzdWItanMvc3JjL3B1YnN1Yi5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9lbGVtZW50Q3JlYXRvci5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9lbGVtZW50TG9hZGVyLmpzIiwid2VicGFjazovL3RvZG9saXN0Ly4vc3JjL2lucHV0SGFuZGxlci5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9tYXN0ZXIuanMiLCJ3ZWJwYWNrOi8vdG9kb2xpc3QvLi9zcmMvcHJvamVjdC5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy90YXNrLmpzIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90b2RvbGlzdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdG9kb2xpc3Qvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMCwyMDExLDIwMTIsMjAxMywyMDE0IE1vcmdhbiBSb2RlcmljayBodHRwOi8vcm9kZXJpY2suZGtcbiAqIExpY2Vuc2U6IE1JVCAtIGh0dHA6Ly9tcmducmRyY2subWl0LWxpY2Vuc2Uub3JnXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL21yb2Rlcmljay9QdWJTdWJKU1xuICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSl7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFB1YlN1YiA9IHt9O1xuXG4gICAgaWYgKHJvb3QuUHViU3ViKSB7XG4gICAgICAgIFB1YlN1YiA9IHJvb3QuUHViU3ViO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQdWJTdWIgYWxyZWFkeSBsb2FkZWQsIHVzaW5nIGV4aXN0aW5nIHZlcnNpb25cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5QdWJTdWIgPSBQdWJTdWI7XG4gICAgICAgIGZhY3RvcnkoUHViU3ViKTtcbiAgICB9XG4gICAgLy8gQ29tbW9uSlMgYW5kIE5vZGUuanMgbW9kdWxlIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKXtcbiAgICAgICAgaWYgKG1vZHVsZSAhPT0gdW5kZWZpbmVkICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBQdWJTdWI7IC8vIE5vZGUuanMgc3BlY2lmaWMgYG1vZHVsZS5leHBvcnRzYFxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuUHViU3ViID0gUHViU3ViOyAvLyBDb21tb25KUyBtb2R1bGUgMS4xLjEgc3BlY1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBQdWJTdWI7IC8vIENvbW1vbkpTXG4gICAgfVxuICAgIC8vIEFNRCBzdXBwb3J0XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpe1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBQdWJTdWI7IH0pO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZGVmICovXG4gICAgfVxuXG59KCggdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93ICkgfHwgdGhpcywgZnVuY3Rpb24gKFB1YlN1Yil7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG1lc3NhZ2VzID0ge30sXG4gICAgICAgIGxhc3RVaWQgPSAtMSxcbiAgICAgICAgQUxMX1NVQlNDUklCSU5HX01TRyA9ICcqJztcblxuICAgIGZ1bmN0aW9uIGhhc0tleXMob2JqKXtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBmb3IgKGtleSBpbiBvYmope1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHRocm93cyB0aGUgcGFzc2VkIGV4Y2VwdGlvbiwgZm9yIHVzZSBhcyBhcmd1bWVudCBmb3Igc2V0VGltZW91dFxuICAgICAqIEBhbGlhcyB0aHJvd0V4Y2VwdGlvblxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7IE9iamVjdCB9IGV4IEFuIEVycm9yIG9iamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRocm93RXhjZXB0aW9uKCBleCApe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcmVUaHJvd0V4Y2VwdGlvbigpe1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsbFN1YnNjcmliZXJXaXRoRGVsYXllZEV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN1YnNjcmliZXIoIG1lc3NhZ2UsIGRhdGEgKTtcbiAgICAgICAgfSBjYXRjaCggZXggKXtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIHRocm93RXhjZXB0aW9uKCBleCApLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgc3Vic2NyaWJlciggbWVzc2FnZSwgZGF0YSApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlbGl2ZXJNZXNzYWdlKCBvcmlnaW5hbE1lc3NhZ2UsIG1hdGNoZWRNZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHZhciBzdWJzY3JpYmVycyA9IG1lc3NhZ2VzW21hdGNoZWRNZXNzYWdlXSxcbiAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyID0gaW1tZWRpYXRlRXhjZXB0aW9ucyA/IGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMgOiBjYWxsU3Vic2NyaWJlcldpdGhEZWxheWVkRXhjZXB0aW9ucyxcbiAgICAgICAgICAgIHM7XG5cbiAgICAgICAgaWYgKCAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgbWF0Y2hlZE1lc3NhZ2UgKSApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAocyBpbiBzdWJzY3JpYmVycyl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzdWJzY3JpYmVycywgcykpe1xuICAgICAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyKCBzdWJzY3JpYmVyc1tzXSwgb3JpZ2luYWxNZXNzYWdlLCBkYXRhICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkZWxpdmVyTmFtZXNwYWNlZCgpe1xuICAgICAgICAgICAgdmFyIHRvcGljID0gU3RyaW5nKCBtZXNzYWdlICksXG4gICAgICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cbiAgICAgICAgICAgIC8vIGRlbGl2ZXIgdGhlIG1lc3NhZ2UgYXMgaXQgaXMgbm93XG4gICAgICAgICAgICBkZWxpdmVyTWVzc2FnZShtZXNzYWdlLCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zKTtcblxuICAgICAgICAgICAgLy8gdHJpbSB0aGUgaGllcmFyY2h5IGFuZCBkZWxpdmVyIG1lc3NhZ2UgdG8gZWFjaCBsZXZlbFxuICAgICAgICAgICAgd2hpbGUoIHBvc2l0aW9uICE9PSAtMSApe1xuICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgICAgICAgICAgICBkZWxpdmVyTWVzc2FnZSggbWVzc2FnZSwgdG9waWMsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UobWVzc2FnZSwgQUxMX1NVQlNDUklCSU5HX01TRywgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoIG1lc3NhZ2UgKSB7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBCb29sZWFuKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIHRvcGljICkgJiYgaGFzS2V5cyhtZXNzYWdlc1t0b3BpY10pKTtcblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVzc2FnZUhhc1N1YnNjcmliZXJzKCBtZXNzYWdlICl7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBoYXNEaXJlY3RTdWJzY3JpYmVyc0Zvcih0b3BpYykgfHwgaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoQUxMX1NVQlNDUklCSU5HX01TRyksXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCAnLicgKTtcblxuICAgICAgICB3aGlsZSAoICFmb3VuZCAmJiBwb3NpdGlvbiAhPT0gLTEgKXtcbiAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG4gICAgICAgICAgICBmb3VuZCA9IGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKHRvcGljKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBzeW5jLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIG1lc3NhZ2UgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzeW1ib2wnKSA/IG1lc3NhZ2UudG9TdHJpbmcoKSA6IG1lc3NhZ2U7XG5cbiAgICAgICAgdmFyIGRlbGl2ZXIgPSBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICksXG4gICAgICAgICAgICBoYXNTdWJzY3JpYmVycyA9IG1lc3NhZ2VIYXNTdWJzY3JpYmVycyggbWVzc2FnZSApO1xuXG4gICAgICAgIGlmICggIWhhc1N1YnNjcmliZXJzICl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN5bmMgPT09IHRydWUgKXtcbiAgICAgICAgICAgIGRlbGl2ZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIGRlbGl2ZXIsIDAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoZXMgdGhlIG1lc3NhZ2UsIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBwdWJsaXNoXG4gICAgICogQHBhcmFtIHt9IGRhdGEgVGhlIGRhdGEgdG8gcGFzcyB0byBzdWJzY3JpYmVyc1xuICAgICAqIEByZXR1cm4geyBCb29sZWFuIH1cbiAgICAgKi9cbiAgICBQdWJTdWIucHVibGlzaCA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHJldHVybiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBmYWxzZSwgUHViU3ViLmltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGlzaGVzIHRoZSBtZXNzYWdlIHN5bmNocm9ub3VzbHksIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoU3luY1xuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuICAgICAqIEBwYXJhbSB7fSBkYXRhIFRoZSBkYXRhIHRvIHBhc3MgdG8gc3Vic2NyaWJlcnNcbiAgICAgKiBAcmV0dXJuIHsgQm9vbGVhbiB9XG4gICAgICovXG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgcmV0dXJuIHB1Ymxpc2goIG1lc3NhZ2UsIGRhdGEsIHRydWUsIFB1YlN1Yi5pbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2UuIEV2ZXJ5IHJldHVybmVkIHRva2VuIGlzIHVuaXF1ZSBhbmQgc2hvdWxkIGJlIHN0b3JlZCBpZiB5b3UgbmVlZCB0byB1bnN1YnNjcmliZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbmV3IG1lc3NhZ2UgaXMgcHVibGlzaGVkXG4gICAgICogQHJldHVybiB7IFN0cmluZyB9XG4gICAgICovXG4gICAgUHViU3ViLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBmdW5jICl7XG4gICAgICAgIGlmICggdHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZSA9ICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N5bWJvbCcpID8gbWVzc2FnZS50b1N0cmluZygpIDogbWVzc2FnZTtcblxuICAgICAgICAvLyBtZXNzYWdlIGlzIG5vdCByZWdpc3RlcmVkIHlldFxuICAgICAgICBpZiAoICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCBtZXNzYWdlICkgKXtcbiAgICAgICAgICAgIG1lc3NhZ2VzW21lc3NhZ2VdID0ge307XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JjaW5nIHRva2VuIGFzIFN0cmluZywgdG8gYWxsb3cgZm9yIGZ1dHVyZSBleHBhbnNpb25zIHdpdGhvdXQgYnJlYWtpbmcgdXNhZ2VcbiAgICAgICAgLy8gYW5kIGFsbG93IGZvciBlYXN5IHVzZSBhcyBrZXkgbmFtZXMgZm9yIHRoZSAnbWVzc2FnZXMnIG9iamVjdFxuICAgICAgICB2YXIgdG9rZW4gPSAndWlkXycgKyBTdHJpbmcoKytsYXN0VWlkKTtcbiAgICAgICAgbWVzc2FnZXNbbWVzc2FnZV1bdG9rZW5dID0gZnVuYztcblxuICAgICAgICAvLyByZXR1cm4gdG9rZW4gZm9yIHVuc3Vic2NyaWJpbmdcbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH07XG5cbiAgICBQdWJTdWIuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oIGZ1bmMgKXtcbiAgICAgICAgcmV0dXJuIFB1YlN1Yi5zdWJzY3JpYmUoQUxMX1NVQlNDUklCSU5HX01TRywgZnVuYyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2Ugb25jZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcGFyYW0geyBGdW5jdGlvbiB9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBtZXNzYWdlIGlzIHB1Ymxpc2hlZFxuICAgICAqIEByZXR1cm4geyBQdWJTdWIgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5zdWJzY3JpYmVPbmNlID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGZ1bmMgKXtcbiAgICAgICAgdmFyIHRva2VuID0gUHViU3ViLnN1YnNjcmliZSggbWVzc2FnZSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGJlZm9yZSBmdW5jIGFwcGx5LCB1bnN1YnNjcmliZSBtZXNzYWdlXG4gICAgICAgICAgICBQdWJTdWIudW5zdWJzY3JpYmUoIHRva2VuICk7XG4gICAgICAgICAgICBmdW5jLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBQdWJTdWI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENsZWFycyBhbGwgc3Vic2NyaXB0aW9uc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyQWxsU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyQWxsU3Vic2NyaXB0aW9ucygpe1xuICAgICAgICBtZXNzYWdlcyA9IHt9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICogQHJldHVybiB7IGludCB9XG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyU3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpe1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgbSkgJiYgbS5pbmRleE9mKHRvcGljKSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VzW21dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAgIENvdW50IHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBjb3VudFN1YnNjcmlwdGlvbnNcbiAgICAgKiBAcmV0dXJuIHsgQXJyYXkgfVxuICAgICovXG4gICAgUHViU3ViLmNvdW50U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNvdW50U3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgdmFyIHRva2VuO1xuICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKHRva2VuIGluIG1lc3NhZ2VzW21dKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgICBHZXRzIHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBnZXRTdWJzY3JpcHRpb25zXG4gICAgKi9cbiAgICBQdWJTdWIuZ2V0U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGdldFN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgdmFyIGxpc3QgPSBbXTtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKXtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApe1xuICAgICAgICAgICAgICAgIGxpc3QucHVzaChtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBzdWJzY3JpcHRpb25zXG4gICAgICpcbiAgICAgKiAtIFdoZW4gcGFzc2VkIGEgdG9rZW4sIHJlbW92ZXMgYSBzcGVjaWZpYyBzdWJzY3JpcHRpb24uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIGZ1bmN0aW9uLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IGZ1bmN0aW9uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIHRvcGljLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IHRvcGljIChoaWVyYXJjaHkpXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIHwgRnVuY3Rpb24gfSB2YWx1ZSBBIHRva2VuLCBmdW5jdGlvbiBvciB0b3BpYyB0byB1bnN1YnNjcmliZSBmcm9tXG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyB3aXRoIGEgdG9rZW5cbiAgICAgKiB2YXIgdG9rZW4gPSBQdWJTdWIuc3Vic2NyaWJlKCdteXRvcGljJywgbXlGdW5jKTtcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUodG9rZW4pO1xuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgd2l0aCBhIGZ1bmN0aW9uXG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKG15RnVuYyk7XG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyBmcm9tIGEgdG9waWNcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUoJ215dG9waWMnKTtcbiAgICAgKi9cbiAgICBQdWJTdWIudW5zdWJzY3JpYmUgPSBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIHZhciBkZXNjZW5kYW50VG9waWNFeGlzdHMgPSBmdW5jdGlvbih0b3BpYykge1xuICAgICAgICAgICAgICAgIHZhciBtO1xuICAgICAgICAgICAgICAgIGZvciAoIG0gaW4gbWVzc2FnZXMgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgZGVzY2VuZGFudCBvZiB0aGUgdG9waWMgZXhpc3RzOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNUb3BpYyAgICA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIHZhbHVlKSB8fCBkZXNjZW5kYW50VG9waWNFeGlzdHModmFsdWUpICksXG4gICAgICAgICAgICBpc1Rva2VuICAgID0gIWlzVG9waWMgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyxcbiAgICAgICAgICAgIGlzRnVuY3Rpb24gPSB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicsXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZSxcbiAgICAgICAgICAgIG0sIG1lc3NhZ2UsIHQ7XG5cbiAgICAgICAgaWYgKGlzVG9waWMpe1xuICAgICAgICAgICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBtIGluIG1lc3NhZ2VzICl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIG0gKSApe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlc1ttXTtcblxuICAgICAgICAgICAgICAgIGlmICggaXNUb2tlbiAmJiBtZXNzYWdlW3ZhbHVlXSApe1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWVzc2FnZVt2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyB0b2tlbnMgYXJlIHVuaXF1ZSwgc28gd2UgY2FuIGp1c3Qgc3RvcCBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHQgaW4gbWVzc2FnZSApe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlLCB0KSAmJiBtZXNzYWdlW3RdID09PSB2YWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VbdF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbn0pKTtcbiIsImltcG9ydCBQdWJTdWIgZnJvbSAncHVic3ViLWpzJztcblxuZnVuY3Rpb24gZWxlbWVudENyZWF0b3JGYWN0b3J5KCkge1xuICBmdW5jdGlvbiBjcmVhdGVEZWxCdXR0b24oKSB7XG4gICAgY29uc3QgZGVsQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgZGVsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2ltYWdlQnV0dG9uJyk7XG4gICAgZGVsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2RlbEJ1dHRvbicpO1xuXG4gICAgY29uc3QgZGVsSW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgZGVsSW1nLnNyYyA9ICcuLi9pbWFnZXMvZGVsZXRlLnBuZyc7XG5cbiAgICBkZWxCdXR0b24uYXBwZW5kQ2hpbGQoZGVsSW1nKTtcblxuICAgIHJldHVybiBkZWxCdXR0b247XG4gIH1cblxuICBmdW5jdGlvbiBkZWxCdXR0b25Qcm9qZWN0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZGVsZXRlUHJvamVjdCcsIGlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbEJ1dHRvblRhc2t0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZGVsZXRlVGFzaycsIGlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGZ1bmN0aW9uIGVkaXRCdXR0b25Qcm9qZWN0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAvLyAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgLy8gICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZWRpdFByb2plY3QnLCBpZCk7XG4gIC8vICAgfSk7XG4gIC8vIH1cblxuICAvLyBmdW5jdGlvbiBlZGl0QnV0dG9uVGFza3RMaXN0ZW5lcihidXR0b24sIGlkKSB7XG4gIC8vICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAvLyAgICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdlZGl0VGFzaycsIGlkKTtcbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUVkaXRCdXR0b24oKSB7XG4gICAgY29uc3QgZWRpdEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGVkaXRCdXR0b24uY2xhc3NMaXN0LmFkZCgnaW1hZ2VCdXR0b24nKTtcbiAgICBlZGl0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2VkaXRCdXR0b24nKTtcbiAgICBlZGl0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3BvcHVwJyk7XG5cbiAgICBjb25zdCBlZGl0SW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgZWRpdEltZy5zcmMgPSAnLi4vaW1hZ2VzL2FyY2hpdmUtZWRpdC5wbmcnO1xuXG4gICAgZWRpdEJ1dHRvbi5hcHBlbmRDaGlsZChlZGl0SW1nKTtcblxuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygncG9wdXBDcmVhdGVkJywgZWRpdEJ1dHRvbik7XG5cbiAgICByZXR1cm4gZWRpdEJ1dHRvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZURlc2NFbGVtZW50KGRlc2MpIHtcbiAgICBjb25zdCBkZXNjRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRlc2NFbGVtZW50LmlubmVyVGV4dCA9IGRlc2M7XG4gICAgZGVzY0VsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZGVzY3JpcHRpb24nKTtcbiAgICBkZXNjRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgcmV0dXJuIGRlc2NFbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRWRpdFByb2plY3RGb3JtKCkge1xuICAgIGNvbnN0IGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gICAgZm9ybS5jbGFzc0xpc3QuYWRkKCdmb3JtJyk7XG5cbiAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGhlYWRlci50ZXh0Q29udGVudCA9ICdFZGl0IFByb2plY3QnO1xuXG4gICAgY29uc3QgdGl0bGVMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgdGl0bGVMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICd0aXRsZScpO1xuICAgIHRpdGxlTGFiZWwudGV4dENvbnRlbnQgPSAnVGl0bGUnO1xuXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgdGl0bGVJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIHRpdGxlSW5wdXQubmFtZSA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5pZCA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5yZXF1aXJlZCA9IHRydWU7XG5cbiAgICBjb25zdCBkZXNjTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgIGRlc2NMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdkZXNjJyk7XG4gICAgZGVzY0xhYmVsLnRleHRDb250ZW50ID0gJ0Rlc2NyaXB0aW9uJztcblxuICAgIGNvbnN0IGRlc2NJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgZGVzY0lucHV0Lm5hbWUgPSAnZGVzYyc7XG4gICAgZGVzY0lucHV0LmlkID0gJ2Rlc2MnO1xuICAgIGRlc2NJbnB1dC5zZXRBdHRyaWJ1dGUoJ2NvbHMnLCAnMTAnKTtcbiAgICBkZXNjSW5wdXQuc2V0QXR0cmlidXRlKCdyb3dzJywgJzEwJyk7XG5cbiAgICBjb25zdCBzdWJCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBzdWJCdXR0b24udGV4dENvbnRlbnQgPSAnU3VibWl0JztcbiAgICBzdWJCdXR0b24udHlwZSA9ICdzdWJtaXQnO1xuICAgIHN1YkJ1dHRvbi5pZCA9ICdzdWJtaXQnO1xuXG4gICAgZm9ybS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQodGl0bGVMYWJlbCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZCh0aXRsZUlucHV0KTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGRlc2NMYWJlbCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChkZXNjSW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoc3ViQnV0dG9uKTtcblxuICAgIHJldHVybiBmb3JtO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRWRpdFRhc2tGb3JtKCkge1xuICAgIGNvbnN0IGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gICAgZm9ybS5jbGFzc0xpc3QuYWRkKCdmb3JtJyk7XG5cbiAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGhlYWRlci50ZXh0Q29udGVudCA9ICdFZGl0IFRhc2snO1xuXG4gICAgY29uc3QgdGl0bGVMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgdGl0bGVMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICd0aXRsZScpO1xuICAgIHRpdGxlTGFiZWwudGV4dENvbnRlbnQgPSAnVGl0bGUnO1xuXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgdGl0bGVJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIHRpdGxlSW5wdXQubmFtZSA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5pZCA9ICd0aXRsZSc7XG4gICAgdGl0bGVJbnB1dC5yZXF1aXJlZCA9IHRydWU7XG5cbiAgICBjb25zdCBkZXNjTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgIGRlc2NMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdkZXNjJyk7XG4gICAgZGVzY0xhYmVsLnRleHRDb250ZW50ID0gJ0Rlc2NyaXB0aW9uJztcblxuICAgIGNvbnN0IGRlc2NJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgZGVzY0lucHV0Lm5hbWUgPSAnZGVzYyc7XG4gICAgZGVzY0lucHV0LmlkID0gJ2Rlc2MnO1xuICAgIGRlc2NJbnB1dC5zZXRBdHRyaWJ1dGUoJ2NvbHMnLCAnMTAnKTtcbiAgICBkZXNjSW5wdXQuc2V0QXR0cmlidXRlKCdyb3dzJywgJzEwJyk7XG5cbiAgICBjb25zdCBwcmlvcml0eUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICBwcmlvcml0eUxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgJ3ByaW9yaXR5Jyk7XG4gICAgcHJpb3JpdHlMYWJlbC50ZXh0Q29udGVudCA9ICdQcmlvcml0eSc7XG5cbiAgICBjb25zdCBwcmlvcml0eUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gICAgcHJpb3JpdHlJbnB1dC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAncHJpb3JpdHknKTtcbiAgICBwcmlvcml0eUlucHV0LnNldEF0dHJpYnV0ZSgnaWQnLCAncHJpb3JpdHknKTtcbiAgICBjb25zdCBub3JtYWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBub3JtYWwudmFsdWUgPSAnMCc7XG4gICAgbm9ybWFsLnRleHRDb250ZW50ID0gJ05vcm1hbCc7XG4gICAgY29uc3QgaGlnaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIGhpZ2gudmFsdWUgPSAnMSc7XG4gICAgaGlnaC50ZXh0Q29udGVudCA9ICdIaWdoJztcbiAgICBjb25zdCBoaWdoZXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgbm9ybWFsLnZhbHVlID0gJzInO1xuICAgIGhpZ2hlc3QudGV4dENvbnRlbnQgPSAnSGlnaGVzdCc7XG5cbiAgICBwcmlvcml0eUlucHV0LmFwcGVuZENoaWxkKG5vcm1hbCk7XG4gICAgcHJpb3JpdHlJbnB1dC5hcHBlbmRDaGlsZChoaWdoKTtcbiAgICBwcmlvcml0eUlucHV0LmFwcGVuZENoaWxkKGhpZ2hlc3QpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICBkdWVEYXRlTGFiZWwuc2V0QXR0cmlidXRlKCdmb3InLCAnZHVlRGF0ZScpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICBkdWVEYXRlSW5wdXQudHlwZSA9ICdkYXRlJztcbiAgICBkdWVEYXRlSW5wdXQubmFtZSA9ICdkdWVEYXRlJztcbiAgICBkdWVEYXRlSW5wdXQuaWQgPSAnZHVlRGF0ZSc7XG5cbiAgICBjb25zdCBzdWJCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBzdWJCdXR0b24udGV4dENvbnRlbnQgPSAnU3VibWl0JztcbiAgICBzdWJCdXR0b24udHlwZSA9ICdzdWJtaXQnO1xuICAgIHN1YkJ1dHRvbi5pZCA9ICdzdWJtaXQnO1xuXG4gICAgZm9ybS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQodGl0bGVMYWJlbCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZCh0aXRsZUlucHV0KTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGRlc2NMYWJlbCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChkZXNjSW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQocHJpb3JpdHlMYWJlbCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChwcmlvcml0eUlucHV0KTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGR1ZURhdGVMYWJlbCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChkdWVEYXRlSW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoc3ViQnV0dG9uKTtcblxuICAgIHJldHVybiBmb3JtO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RhdHVzQnV0dG9uKCkge1xuICAgIGNvbnN0IHN0YXR1c0J1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIHN0YXR1c0J1dHRvbi5jbGFzc0xpc3QuYWRkKCdpbWFnZUJ1dHRvbicpO1xuXG4gICAgY29uc3Qgc3RhdHVzSW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgc3RhdHVzSW1nLnNyYyA9ICcuLi9pbWFnZXMvY2lyY2xlLW91dGxpbmUucG5nJztcblxuICAgIHN0YXR1c0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIHN0YXR1c0ltZy5zcmMgPSAnLi4vaW1hZ2VzL2NpcmNsZS5wbmcnO1xuICAgIH0pO1xuXG4gICAgc3RhdHVzQnV0dG9uLmFwcGVuZENoaWxkKHN0YXR1c0ltZyk7XG5cbiAgICByZXR1cm4gc3RhdHVzQnV0dG9uO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRGF0ZUVsZW1lbnQoZGF0ZSkge1xuICAgIGNvbnN0IGRhdGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGF0ZUVsZW1lbnQuaW5uZXJUZXh0ID0gZGF0ZTtcblxuICAgIHJldHVybiBkYXRlRWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVkaXRQcm9qZWN0KGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpZCA9IHRoaXMucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdGlkJyk7XG4gICAgY29uc3QgbXlGb3JtRGF0YSA9IG5ldyBGb3JtRGF0YShldmVudC50YXJnZXQpO1xuICAgIGNvbnN0IHByb2plY3RJbmZvID0gT2JqZWN0LmZyb21FbnRyaWVzKG15Rm9ybURhdGEuZW50cmllcygpKTtcblxuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZWRpdFByb2plY3QnLCBbcHJvamVjdEluZm8sIGlkXSk7XG4gIH1cblxuICBmdW5jdGlvbiBlZGl0VGFzayhldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaWQgPSB0aGlzLnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXRhc2tpZCcpO1xuICAgIGNvbnN0IG15Rm9ybURhdGEgPSBuZXcgRm9ybURhdGEoZXZlbnQudGFyZ2V0KTtcbiAgICBjb25zdCB0YXNrSW5mbyA9IE9iamVjdC5mcm9tRW50cmllcyhteUZvcm1EYXRhLmVudHJpZXMoKSk7XG5cbiAgICBQdWJTdWIucHVibGlzaFN5bmMoJ2VkaXRUYXNrJywgW3Rhc2tJbmZvLCBpZF0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUHJvamVjdEVsZW1lbnQocHJvamVjdEluZm8sIGlkKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHByb2plY3QuY2xhc3NMaXN0LmFkZCgncHJvamVjdCcpO1xuICAgIHByb2plY3QuaW5uZXJUZXh0ID0gcHJvamVjdEluZm8uZ2V0VGl0bGUoKTtcbiAgICBwcm9qZWN0LnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0SUQnLCBpZCk7XG5cbiAgICBjb25zdCBkZXNjRWxlbWVudCA9IGNyZWF0ZURlc2NFbGVtZW50KHByb2plY3RJbmZvLmdldERlc2MoKSk7XG4gICAgY29uc3QgZGVsQnV0dG9uID0gY3JlYXRlRGVsQnV0dG9uKCk7XG4gICAgZGVsQnV0dG9uUHJvamVjdExpc3RlbmVyKGRlbEJ1dHRvbiwgaWQpO1xuICAgIGNvbnN0IGVkaXRCdXR0b24gPSBjcmVhdGVFZGl0QnV0dG9uKCk7XG4gICAgY29uc3QgZm9ybSA9IGNyZWF0ZUVkaXRQcm9qZWN0Rm9ybSgpO1xuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZWRpdFByb2plY3QpO1xuXG4gICAgcHJvamVjdC5hcHBlbmRDaGlsZChlZGl0QnV0dG9uKTtcbiAgICBwcm9qZWN0LmFwcGVuZENoaWxkKGZvcm0pO1xuICAgIHByb2plY3QuYXBwZW5kQ2hpbGQoZGVsQnV0dG9uKTtcbiAgICBwcm9qZWN0LmFwcGVuZENoaWxkKGRlc2NFbGVtZW50KTtcblxuICAgIHJldHVybiBwcm9qZWN0O1xuICB9XG5cbiAgLy8gY3JlYXRlIHRhc2tFbGVtZW50XG4gIGZ1bmN0aW9uIGNyZWF0ZVRhc2tFbGVtZW50KHRhc2tJbmZvLCBpZCkge1xuICAgIGNvbnN0IHRhc2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aXRsZUVsZW1lbnQuaW5uZXJUZXh0ID0gdGFza0luZm8uZ2V0VGl0bGUoKTtcbiAgICB0YXNrLmNsYXNzTGlzdC5hZGQoJ3Rhc2snKTtcbiAgICB0YXNrLnNldEF0dHJpYnV0ZSgnZGF0YS10YXNrSUQnLCBpZCk7XG5cbiAgICAvLyBwcmlvcml0eVxuICAgIGlmICh0YXNrSW5mby5nZXRQcmlvcml0eSgpID09PSAnMCcpIHtcbiAgICAgIHRhc2suY2xhc3NMaXN0LmFkZCgnbm9ybWFsJyk7XG4gICAgfSBlbHNlIGlmICh0YXNrSW5mby5nZXRQcmlvcml0eSgpID09PSAnMScpIHtcbiAgICAgIHRhc2suY2xhc3NMaXN0LmFkZCgnaGlnaCcpO1xuICAgIH0gZWxzZSBpZiAodGFza0luZm8uZ2V0UHJpb3JpdHkoKSA9PT0gJzInKSB7XG4gICAgICB0YXNrLmNsYXNzTGlzdC5hZGQoJ2hpZ2hlc3QnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0dXNCdXR0b24gPSBjcmVhdGVTdGF0dXNCdXR0b24oKTtcbiAgICBjb25zdCBkYXRlRWxlbWVudCA9IGNyZWF0ZURhdGVFbGVtZW50KHRhc2tJbmZvLmdldER1ZURhdGUoKSk7XG4gICAgY29uc3QgZGVsQnV0dG9uID0gY3JlYXRlRGVsQnV0dG9uKGlkKTtcbiAgICBkZWxCdXR0b25UYXNrdExpc3RlbmVyKGRlbEJ1dHRvbiwgaWQpO1xuICAgIGNvbnN0IGVkaXRCdXR0b24gPSBjcmVhdGVFZGl0QnV0dG9uKCk7XG4gICAgY29uc3QgZGVzY0VsZW1lbnQgPSBjcmVhdGVEZXNjRWxlbWVudCh0YXNrSW5mby5nZXREZXNjKCkpO1xuICAgIGNvbnN0IGZvcm1FbGVtZW50ID0gY3JlYXRlRWRpdFRhc2tGb3JtKCk7XG4gICAgZm9ybUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZWRpdFRhc2spO1xuXG4gICAgdGFzay5hcHBlbmRDaGlsZChzdGF0dXNCdXR0b24pO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQodGl0bGVFbGVtZW50KTtcbiAgICB0YXNrLmFwcGVuZENoaWxkKGRhdGVFbGVtZW50KTtcbiAgICB0YXNrLmFwcGVuZENoaWxkKGVkaXRCdXR0b24pO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZm9ybUVsZW1lbnQpO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZGVsQnV0dG9uKTtcbiAgICB0YXNrLmFwcGVuZENoaWxkKGRlc2NFbGVtZW50KTtcblxuICAgIHJldHVybiB0YXNrO1xuICB9XG5cbiAgcmV0dXJuIHsgY3JlYXRlUHJvamVjdEVsZW1lbnQsIGNyZWF0ZVRhc2tFbGVtZW50IH07XG59XG5cbmNvbnN0IGVsZW1lbnRDcmVhdG9yID0gZWxlbWVudENyZWF0b3JGYWN0b3J5KCk7XG5leHBvcnQgZGVmYXVsdCBlbGVtZW50Q3JlYXRvcjtcbiIsImltcG9ydCBQdWJTdWIsIHsgcHVibGlzaCB9IGZyb20gJ3B1YnN1Yi1qcyc7XG5pbXBvcnQgbWFzdGVyIGZyb20gJy4vbWFzdGVyJztcbmltcG9ydCBlbGVtZW50Q3JlYXRvciBmcm9tICcuL2VsZW1lbnRDcmVhdG9yJztcblxuZnVuY3Rpb24gZWxlbWVudExvYWRlckZhY3RvcnkoKSB7XG4gIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY29udGVudEJhcicpO1xuICBjb25zdCBiYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHJvamVjdHNCYXInKTtcbiAgUHViU3ViLnN1YnNjcmliZSgnbWFzdGVyQ2hhbmdlZCcsIGxvYWRCYXIpO1xuICBQdWJTdWIuc3Vic2NyaWJlKCdzZWxlY3RlZFByb2plY3RDaGFuZ2VkJywgbG9hZENvbnRlbnQpO1xuICBsb2FkQmFyKCk7XG4gIGxvYWRDb250ZW50KCk7XG5cbiAgZnVuY3Rpb24gY2xlYXJCYXIoKSB7XG4gICAgYmFyLmlubmVyVGV4dCA9ICcnO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJDb250ZW50KCkge1xuICAgIGNvbnRlbnQuaW5uZXJUZXh0ID0gJyc7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkQmFyKCkge1xuICAgIGNsZWFyQmFyKCk7XG4gICAgY29uc3QgcHJvamVjdHMgPSBtYXN0ZXIuZ2V0UHJvamVjdHMoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvamVjdHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IG5ld1Byb2pFbGUgPSBlbGVtZW50Q3JlYXRvci5jcmVhdGVQcm9qZWN0RWxlbWVudChwcm9qZWN0c1tpXSwgaSk7XG4gICAgICBiYXIuYXBwZW5kQ2hpbGQobmV3UHJvakVsZSk7XG4gICAgfVxuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygncGFnZVJlZnJlc2hlZCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZENvbnRlbnQoKSB7XG4gICAgY2xlYXJDb250ZW50KCk7XG4gICAgY29uc3QgdGFza3MgPSBtYXN0ZXIuZ2V0U2VsZWN0ZWRQcm9qZWN0KCkuZ2V0VGFza3MoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFza3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IG5ld1Rhc2sgPSBlbGVtZW50Q3JlYXRvci5jcmVhdGVUYXNrRWxlbWVudCh0YXNrc1tpXSwgaSk7XG4gICAgICBjb250ZW50LmFwcGVuZChuZXdUYXNrKTtcbiAgICB9XG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdwYWdlUmVmcmVzaGVkJyk7XG4gIH1cbiAgcmV0dXJuIHsgbG9hZEJhciwgbG9hZENvbnRlbnQgfTtcbn1cblxuY29uc3QgZWxlbWVudExvYWRlciA9IGVsZW1lbnRMb2FkZXJGYWN0b3J5KCk7XG5leHBvcnQgZGVmYXVsdCBlbGVtZW50TG9hZGVyO1xuIiwiaW1wb3J0IFB1YlN1YiBmcm9tICdwdWJzdWItanMnO1xuaW1wb3J0IG1hc3RlciBmcm9tICcuL21hc3Rlcic7XG5cbmZ1bmN0aW9uIGlucHV0SGFuZGxlckZhY3RvcnkoKSB7XG4gIGxldCBwb3B1cHMgPSBbLi4uZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncG9wdXAnKV07XG4gIHBvcHVwcy5mb3JFYWNoKChwKSA9PiB7XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZSk7XG4gIH0pO1xuXG4gIGNvbnN0IGNyZWF0ZVByb2plY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHJvamVjdEZvcm0nKTtcbiAgY3JlYXRlUHJvamVjdC5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBuZXdQcm9qZWN0KTtcblxuICBjb25zdCBjcmVhdGVUYXNrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRhc2tGb3JtJyk7XG4gIGNyZWF0ZVRhc2suYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgbmV3VGFzayk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKHsgdGFyZ2V0IH0pID0+IHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgaWYgKHRhcmdldC5wYXJlbnROb2RlLmNsYXNzTGlzdC5jb250YWlucygncG9wdXAnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YXJnZXQucGFyZW50Tm9kZSBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCB8fCB0YXJnZXQgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcG9wdXBzLmZvckVhY2goKHApID0+IHAuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpKTtcbiAgfSk7XG5cbiAgUHViU3ViLnN1YnNjcmliZSgncGFnZVJlZnJlc2hlZCcsIHJlZnJlc2hQb3B1cCk7XG5cbiAgZnVuY3Rpb24gcmVmcmVzaFBvcHVwKG1zZykge1xuICAgIHBvcHVwcyA9IFsuLi5kb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdwb3B1cCcpXTtcbiAgICBwb3B1cHMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgcC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGUoZXZlbnQpIHtcbiAgICBjb25zdCB7IHBhcmVudE5vZGUgfSA9IGV2ZW50LnRhcmdldDtcbiAgICBwb3B1cHMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgaWYgKHAgIT09IHBhcmVudE5vZGUpIHtcbiAgICAgICAgaWYgKHAuY2xhc3NMaXN0LmNvbnRhaW5zKCdzaG93JykpIHtcbiAgICAgICAgICBwLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcC5jbGFzc0xpc3QudG9nZ2xlKCdzaG93Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBuZXdQcm9qZWN0KGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBteUZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGV2ZW50LnRhcmdldCk7XG4gICAgY29uc3QgcHJvamVjdEluZm8gPSBPYmplY3QuZnJvbUVudHJpZXMobXlGb3JtRGF0YS5lbnRyaWVzKCkpO1xuICAgIG1hc3Rlci5tYWtlUHJvamVjdChwcm9qZWN0SW5mbyk7XG4gIH1cblxuICBmdW5jdGlvbiBuZXdUYXNrKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBteUZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGV2ZW50LnRhcmdldCk7XG4gICAgY29uc3QgdGFza0luZm8gPSBPYmplY3QuZnJvbUVudHJpZXMobXlGb3JtRGF0YS5lbnRyaWVzKCkpO1xuICAgIG1hc3Rlci5hZGRUYXNrVG9TZWxlY3RlZCh0YXNrSW5mbyk7XG4gIH1cbn1cblxuY29uc3QgaW5wdXRIYW5kbGVyID0gaW5wdXRIYW5kbGVyRmFjdG9yeSgpO1xuZXhwb3J0IGRlZmF1bHQgaW5wdXRIYW5kbGVyO1xuIiwiaW1wb3J0IFB1YlN1YiBmcm9tICdwdWJzdWItanMnO1xuaW1wb3J0IGNyZWF0ZVByb2plY3QgZnJvbSAnLi9wcm9qZWN0JztcblxuZnVuY3Rpb24gbWFzdGVyUHJvamVjdCgpIHtcbiAgY29uc3QgX3Byb2plY3RzID0gW107XG4gIGxldCBzZWxlY3RlZFByb2plY3QgPSBudWxsO1xuICBQdWJTdWIuc3Vic2NyaWJlKCdkZWxldGVQcm9qZWN0JywgZGVsZXRlUHJvamVjdCk7XG4gIFB1YlN1Yi5zdWJzY3JpYmUoJ2VkaXRQcm9qZWN0JywgZWRpdFByb2plY3QpO1xuICBQdWJTdWIuc3Vic2NyaWJlKCdlZGl0VGFzaycsIGVkaXRUYXNrKTtcblxuICBmdW5jdGlvbiBkZWxldGVQcm9qZWN0KGRhdGEsIGlkKSB7XG4gICAgX3Byb2plY3RzLnNwbGljZShpZCwgMSk7XG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdtYXN0ZXJDaGFuZ2VkJyk7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlUHJvamVjdChwcm9qZWN0SW5mbykge1xuICAgIGNvbnN0IG5ld1Byb2plY3QgPSBjcmVhdGVQcm9qZWN0KHByb2plY3RJbmZvLnRpdGxlLCBwcm9qZWN0SW5mby5kZXNjKTtcbiAgICBfcHJvamVjdHMucHVzaChuZXdQcm9qZWN0KTtcbiAgICBQdWJTdWIucHVibGlzaFN5bmMoJ21hc3RlckNoYW5nZWQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVkaXRQcm9qZWN0KG1zZywgZGF0YSkge1xuICAgIGNvbnN0IHByb2plY3RJbmZvID0gZGF0YVswXTtcbiAgICBjb25zdCBpZCA9IGRhdGFbMV07XG4gICAgX3Byb2plY3RzW2lkXS5zZXRUaXRsZShwcm9qZWN0SW5mby50aXRsZSk7XG4gICAgX3Byb2plY3RzW2lkXS5zZXREZXNjKHByb2plY3RJbmZvLmRlc2MpO1xuICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnbWFzdGVyQ2hhbmdlZCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UHJvamVjdHMoKSB7XG4gICAgcmV0dXJuIF9wcm9qZWN0cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFNlbGVjdGVkUHJvamVjdChpZCkge1xuICAgIHNlbGVjdGVkUHJvamVjdCA9IF9wcm9qZWN0c1tpZF07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRTZWxlY3RlZFByb2plY3QoKSB7XG4gICAgcmV0dXJuIHNlbGVjdGVkUHJvamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFRhc2tUb1NlbGVjdGVkKHRhc2tJbmZvKSB7XG4gICAgaWYgKHNlbGVjdGVkUHJvamVjdCA9PT0gbnVsbCkge1xuICAgICAgYWxlcnQoJ25vIGxpc3QgaGFzIGJlZW4gc2VsZWN0ZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZWN0ZWRQcm9qZWN0LmFkZFRhc2sodGFza0luZm8pO1xuICAgICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdzZWxlY3RlZFByb2plY3RDaGFuZ2VkJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZWRpdFRhc2sobXNnLCBkYXRhKSB7XG4gICAgaWYgKHNlbGVjdGVkUHJvamVjdCA9PT0gbnVsbCkge1xuICAgICAgYWxlcnQoJ25vIGxpc3QgaGFzIGJlZW4gc2VsZWN0ZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaWQgPSBkYXRhWzFdO1xuICAgICAgY29uc3QgdGFza0luZm8gPSBkYXRhWzBdO1xuICAgICAgc2VsZWN0ZWRQcm9qZWN0LmVkaXRUYXNrKGlkLCB0YXNrSW5mbyk7XG4gICAgICBQdWJTdWIucHVibGlzaFN5bmMoJ3NlbGVjdGVkUHJvamVjdENoYW5nZWQnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRlbGV0ZVByb2plY3QsXG4gICAgbWFrZVByb2plY3QsXG4gICAgZ2V0UHJvamVjdHMsXG4gICAgZWRpdFByb2plY3QsXG4gICAgc2V0U2VsZWN0ZWRQcm9qZWN0LFxuICAgIGdldFNlbGVjdGVkUHJvamVjdCxcbiAgICBhZGRUYXNrVG9TZWxlY3RlZCxcbiAgfTtcbn1cbmNvbnN0IG1hc3RlciA9IG1hc3RlclByb2plY3QoKTtcbm1hc3Rlci5tYWtlUHJvamVjdCh7IHRpdGxlOiAnbW9uZGF5JywgZGVzYzogJ3RvZGF5IGlzIG1vbmRheScgfSk7XG5tYXN0ZXIubWFrZVByb2plY3QoeyB0aXRsZTogJ3R1ZXNkYXknLCBkZXNjOiAndG9kYXkgaXMgdHVlc2RheScgfSk7XG5tYXN0ZXIubWFrZVByb2plY3QoeyB0aXRsZTogJ3dlZG5lc2RheScsIGRlc2M6ICd0b2RheSBpcyB3ZWRuZXNkYXknIH0pO1xubWFzdGVyLnNldFNlbGVjdGVkUHJvamVjdCgwKTtcbmNvbnN0IHByb2plY3QgPSBtYXN0ZXIuZ2V0U2VsZWN0ZWRQcm9qZWN0KCk7XG5wcm9qZWN0LmFkZFRhc2soe1xuICB0aXRsZTogJ3Rhc2sgMScsIGRlc2M6ICd0YXNrIDEgZGVzY3JpcHRpb24nLCBkdWVEYXRlOiBEYXRlKCksIHByaW9yaXR5OiAnbm9ybWFsJyxcbn0pO1xucHJvamVjdC5hZGRUYXNrKHsgdGl0bGU6ICd0YXNrIDInLCBkdWVEYXRlOiBEYXRlKCksIHByaW9yaXR5OiAnbm9ybWFsJyB9KTtcbnByb2plY3QuYWRkVGFzayh7IHRpdGxlOiAndGFzayAzJywgZHVlRGF0ZTogRGF0ZSgpLCBwcmlvcml0eTogJ25vcm1hbCcgfSk7XG5wcm9qZWN0LmFkZFRhc2soeyB0aXRsZTogJ3Rhc2sgNCcsIGR1ZURhdGU6IERhdGUoKSwgcHJpb3JpdHk6ICdub3JtYWwnIH0pO1xuXG5leHBvcnQgZGVmYXVsdCBtYXN0ZXI7XG4iLCJpbXBvcnQgY3JlYXRlVGFzayBmcm9tICcuL3Rhc2snO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVQcm9qZWN0KHRpdGxlLCBkZXNjKSB7XG4gIGxldCBfdGl0bGUgPSB0aXRsZTtcbiAgbGV0IF9kZXNjID0gZGVzYztcbiAgY29uc3QgX3Rhc2tzID0gW107XG5cbiAgZnVuY3Rpb24gZ2V0VGl0bGUoKSB7XG4gICAgcmV0dXJuIF90aXRsZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFRpdGxlKG5ld1RpdGxlKSB7XG4gICAgX3RpdGxlID0gbmV3VGl0bGU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREZXNjKCkge1xuICAgIHJldHVybiBfZGVzYztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldERlc2MobmV3RGVzYykge1xuICAgIF9kZXNjID0gbmV3RGVzYztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFRhc2sodGFza0luZm8pIHtcbiAgICBjb25zdCBuZXdUYXNrID0gY3JlYXRlVGFzayh0YXNrSW5mby50aXRsZSwgdGFza0luZm8uZGVzYywgdGFza0luZm8uZHVlRGF0ZSwgdGFza0luZm8ucHJpb3JpdHkpO1xuICAgIF90YXNrcy5wdXNoKG5ld1Rhc2spO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVsZXRlVGFzayhpZCkge1xuICAgIF90YXNrcy5zcGxpY2UoaWQsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gZWRpdFRhc2soaWQsIHRhc2tJbmZvKSB7XG4gICAgX3Rhc2tzW2lkXS5zZXRUaXRsZSh0YXNrSW5mby50aXRsZSk7XG4gICAgX3Rhc2tzW2lkXS5zZXREZXNjKHRhc2tJbmZvLmRlc2MpO1xuICAgIF90YXNrc1tpZF0uc2V0RHVlRGF0ZSh0YXNrSW5mby5kdWVEYXRlKTtcbiAgICBfdGFza3NbaWRdLnNldFByaW9yaXR5KHRhc2tJbmZvLnByaW9yaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRhc2tzKCkge1xuICAgIHJldHVybiBfdGFza3M7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldFRpdGxlLCBzZXRUaXRsZSwgZ2V0RGVzYywgc2V0RGVzYywgYWRkVGFzaywgZGVsZXRlVGFzaywgZWRpdFRhc2ssIGdldFRhc2tzLFxuICB9O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlVGFzayh0aXRsZSwgZGVzYywgZHVlRGF0ZSwgcHJpb3JpdHkpIHtcbiAgbGV0IF90aXRsZSA9IHRpdGxlO1xuICBsZXQgX2Rlc2MgPSBkZXNjO1xuICBsZXQgX2R1ZURhdGUgPSBkdWVEYXRlO1xuICBsZXQgX3ByaW9yaXR5ID0gcHJpb3JpdHk7XG5cbiAgZnVuY3Rpb24gc2V0VGl0bGUobmV3VGl0bGUpIHtcbiAgICBfdGl0bGUgPSBuZXdUaXRsZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRpdGxlKCkge1xuICAgIHJldHVybiBfdGl0bGU7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREZXNjKG5ld0Rlc2MpIHtcbiAgICBfZGVzYyA9IG5ld0Rlc2M7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREZXNjKCkge1xuICAgIHJldHVybiBfZGVzYztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldER1ZURhdGUobmV3RGF0ZSkge1xuICAgIF9kdWVEYXRlID0gbmV3RGF0ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldER1ZURhdGUoKSB7XG4gICAgcmV0dXJuIF9kdWVEYXRlO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJpb3JpdHkocHJpbykge1xuICAgIF9wcmlvcml0eSA9IHByaW87XG4gIH1cblxuICBmdW5jdGlvbiBnZXRQcmlvcml0eSgpIHtcbiAgICByZXR1cm4gX3ByaW9yaXR5O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXRUaXRsZSwgZ2V0VGl0bGUsIHNldER1ZURhdGUsIGdldER1ZURhdGUsIHNldERlc2MsIGdldERlc2MsIHNldFByaW9yaXR5LCBnZXRQcmlvcml0eSxcbiAgfTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuXHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUucGF0aHMgPSBbXTtcblx0aWYgKCFtb2R1bGUuY2hpbGRyZW4pIG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xuXHRyZXR1cm4gbW9kdWxlO1xufTsiLCJpbXBvcnQgZWxlbWVudExvYWRlciBmcm9tICcuL2VsZW1lbnRMb2FkZXInO1xuaW1wb3J0IGlucHV0SGFuZGxlciBmcm9tICcuL2lucHV0SGFuZGxlcic7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=