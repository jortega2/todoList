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

    return project;
  }

  // create taskElement
  function createTaskElement(title, desc, dueDate, priority, id) {
    const task = document.createElement('div');
    const titleElement = document.createElement('div');
    titleElement.innerText = title;
    task.classList.add('task');
    task.setAttribute('data-taskID', id);

    const statusButton = createStatusButton();
    const dateElement = createDateElement(dueDate);
    const delButton = createDelButton(id);
    delButtonTasktListener(delButton, id);
    const editButton = createEditButton();
    const descElement = createDescElement(desc);
    const formElement = createEditTaskForm();

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
  function deleteProject(data, id) {
    _projects.splice(id, 1);
  }

  function makeProject(projectInfo) {
    const newProject = (0,_project__WEBPACK_IMPORTED_MODULE_1__["default"])(projectInfo.title, projectInfo.desc);
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
/* harmony import */ var _elementCreator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./elementCreator */ "./src/elementCreator.js");
/* harmony import */ var _master__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./master */ "./src/master.js");



const projectsBar = document.querySelector('.projectsBar');
const content = document.querySelector('.contentBar');

projectsBar.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createProjectElement('monday', 'today is monday', 0));
projectsBar.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createProjectElement('teusday', 'today is teusday', 1));
projectsBar.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createProjectElement('wednesday', 'today is wednesday', 2));
projectsBar.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createProjectElement('thursday', 'today is thursday', 3));
projectsBar.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createProjectElement('friday', 'today is friday', 4));
projectsBar.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createProjectElement('saturday', 'today is saturday', 5));
projectsBar.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createProjectElement('sunday', 'today is sunday', 6));

content.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createTaskElement('Walk the dog', 'Need to walk lil timmy', Date(), 'high', 0));
content.appendChild(_elementCreator__WEBPACK_IMPORTED_MODULE_0__["default"].createTaskElement('Go to the gym', 'Gains', Date(), 'high', 1));

const popups = [...document.getElementsByClassName('popup')];
// this is good for static buttons. but what about the dynamic ones to be loaded later?
// have elementLoader contain an array of poups.
// each time a new project/task created update the popups
// element loader will handle the event listeners
function toggle(event) {
  popups.forEach((p) => {
    if (p !== event) {
      if (p.classList.contains('show')) {
        p.classList.remove('show');
      }
    } else {
      event.classList.toggle('show');
    }
  });
}

popups.forEach((p) => {
  p.addEventListener('click', () => {
    toggle(p);
  });
});

window.addEventListener('click', ({ target }) => {
  // need this to only trigger on elements that are not popup buttons or forms
  if (target instanceof HTMLImageElement) {
    if (target.parentNode.classList.contains('popup')) {
      return;
    }
  }
  if (target.parentNode instanceof HTMLFormElement || target instanceof HTMLFormElement) {
    return;
  }
  popups.forEach((p) => p.classList.remove('show'));
});// toggle the status button

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RXOEI7O0FBRS9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFNLDREQUFrQjtBQUN4QixLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBLE1BQU0sNERBQWtCO0FBQ3hCLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLEVBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90b2RvbGlzdC8uL25vZGVfbW9kdWxlcy9wdWJzdWItanMvc3JjL3B1YnN1Yi5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9lbGVtZW50Q3JlYXRvci5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9tYXN0ZXIuanMiLCJ3ZWJwYWNrOi8vdG9kb2xpc3QvLi9zcmMvcHJvamVjdC5qcyIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy90YXNrLmpzIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90b2RvbGlzdC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3RvZG9saXN0L3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdG9kb2xpc3Qvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly90b2RvbGlzdC8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMCwyMDExLDIwMTIsMjAxMywyMDE0IE1vcmdhbiBSb2RlcmljayBodHRwOi8vcm9kZXJpY2suZGtcbiAqIExpY2Vuc2U6IE1JVCAtIGh0dHA6Ly9tcmducmRyY2subWl0LWxpY2Vuc2Uub3JnXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL21yb2Rlcmljay9QdWJTdWJKU1xuICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSl7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFB1YlN1YiA9IHt9O1xuXG4gICAgaWYgKHJvb3QuUHViU3ViKSB7XG4gICAgICAgIFB1YlN1YiA9IHJvb3QuUHViU3ViO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQdWJTdWIgYWxyZWFkeSBsb2FkZWQsIHVzaW5nIGV4aXN0aW5nIHZlcnNpb25cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5QdWJTdWIgPSBQdWJTdWI7XG4gICAgICAgIGZhY3RvcnkoUHViU3ViKTtcbiAgICB9XG4gICAgLy8gQ29tbW9uSlMgYW5kIE5vZGUuanMgbW9kdWxlIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKXtcbiAgICAgICAgaWYgKG1vZHVsZSAhPT0gdW5kZWZpbmVkICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBQdWJTdWI7IC8vIE5vZGUuanMgc3BlY2lmaWMgYG1vZHVsZS5leHBvcnRzYFxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuUHViU3ViID0gUHViU3ViOyAvLyBDb21tb25KUyBtb2R1bGUgMS4xLjEgc3BlY1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBQdWJTdWI7IC8vIENvbW1vbkpTXG4gICAgfVxuICAgIC8vIEFNRCBzdXBwb3J0XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpe1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBQdWJTdWI7IH0pO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZGVmICovXG4gICAgfVxuXG59KCggdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93ICkgfHwgdGhpcywgZnVuY3Rpb24gKFB1YlN1Yil7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG1lc3NhZ2VzID0ge30sXG4gICAgICAgIGxhc3RVaWQgPSAtMSxcbiAgICAgICAgQUxMX1NVQlNDUklCSU5HX01TRyA9ICcqJztcblxuICAgIGZ1bmN0aW9uIGhhc0tleXMob2JqKXtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBmb3IgKGtleSBpbiBvYmope1xuICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHRocm93cyB0aGUgcGFzc2VkIGV4Y2VwdGlvbiwgZm9yIHVzZSBhcyBhcmd1bWVudCBmb3Igc2V0VGltZW91dFxuICAgICAqIEBhbGlhcyB0aHJvd0V4Y2VwdGlvblxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7IE9iamVjdCB9IGV4IEFuIEVycm9yIG9iamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRocm93RXhjZXB0aW9uKCBleCApe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcmVUaHJvd0V4Y2VwdGlvbigpe1xuICAgICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsbFN1YnNjcmliZXJXaXRoRGVsYXllZEV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN1YnNjcmliZXIoIG1lc3NhZ2UsIGRhdGEgKTtcbiAgICAgICAgfSBjYXRjaCggZXggKXtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIHRocm93RXhjZXB0aW9uKCBleCApLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMoIHN1YnNjcmliZXIsIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgc3Vic2NyaWJlciggbWVzc2FnZSwgZGF0YSApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlbGl2ZXJNZXNzYWdlKCBvcmlnaW5hbE1lc3NhZ2UsIG1hdGNoZWRNZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHZhciBzdWJzY3JpYmVycyA9IG1lc3NhZ2VzW21hdGNoZWRNZXNzYWdlXSxcbiAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyID0gaW1tZWRpYXRlRXhjZXB0aW9ucyA/IGNhbGxTdWJzY3JpYmVyV2l0aEltbWVkaWF0ZUV4Y2VwdGlvbnMgOiBjYWxsU3Vic2NyaWJlcldpdGhEZWxheWVkRXhjZXB0aW9ucyxcbiAgICAgICAgICAgIHM7XG5cbiAgICAgICAgaWYgKCAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBtZXNzYWdlcywgbWF0Y2hlZE1lc3NhZ2UgKSApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAocyBpbiBzdWJzY3JpYmVycyl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzdWJzY3JpYmVycywgcykpe1xuICAgICAgICAgICAgICAgIGNhbGxTdWJzY3JpYmVyKCBzdWJzY3JpYmVyc1tzXSwgb3JpZ2luYWxNZXNzYWdlLCBkYXRhICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkZWxpdmVyTmFtZXNwYWNlZCgpe1xuICAgICAgICAgICAgdmFyIHRvcGljID0gU3RyaW5nKCBtZXNzYWdlICksXG4gICAgICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG5cbiAgICAgICAgICAgIC8vIGRlbGl2ZXIgdGhlIG1lc3NhZ2UgYXMgaXQgaXMgbm93XG4gICAgICAgICAgICBkZWxpdmVyTWVzc2FnZShtZXNzYWdlLCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zKTtcblxuICAgICAgICAgICAgLy8gdHJpbSB0aGUgaGllcmFyY2h5IGFuZCBkZWxpdmVyIG1lc3NhZ2UgdG8gZWFjaCBsZXZlbFxuICAgICAgICAgICAgd2hpbGUoIHBvc2l0aW9uICE9PSAtMSApe1xuICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdG9waWMubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgICAgICAgICAgICBkZWxpdmVyTWVzc2FnZSggbWVzc2FnZSwgdG9waWMsIGRhdGEsIGltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsaXZlck1lc3NhZ2UobWVzc2FnZSwgQUxMX1NVQlNDUklCSU5HX01TRywgZGF0YSwgaW1tZWRpYXRlRXhjZXB0aW9ucyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoIG1lc3NhZ2UgKSB7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBCb29sZWFuKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIHRvcGljICkgJiYgaGFzS2V5cyhtZXNzYWdlc1t0b3BpY10pKTtcblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWVzc2FnZUhhc1N1YnNjcmliZXJzKCBtZXNzYWdlICl7XG4gICAgICAgIHZhciB0b3BpYyA9IFN0cmluZyggbWVzc2FnZSApLFxuICAgICAgICAgICAgZm91bmQgPSBoYXNEaXJlY3RTdWJzY3JpYmVyc0Zvcih0b3BpYykgfHwgaGFzRGlyZWN0U3Vic2NyaWJlcnNGb3IoQUxMX1NVQlNDUklCSU5HX01TRyksXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRvcGljLmxhc3RJbmRleE9mKCAnLicgKTtcblxuICAgICAgICB3aGlsZSAoICFmb3VuZCAmJiBwb3NpdGlvbiAhPT0gLTEgKXtcbiAgICAgICAgICAgIHRvcGljID0gdG9waWMuc3Vic3RyKCAwLCBwb3NpdGlvbiApO1xuICAgICAgICAgICAgcG9zaXRpb24gPSB0b3BpYy5sYXN0SW5kZXhPZiggJy4nICk7XG4gICAgICAgICAgICBmb3VuZCA9IGhhc0RpcmVjdFN1YnNjcmliZXJzRm9yKHRvcGljKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBzeW5jLCBpbW1lZGlhdGVFeGNlcHRpb25zICl7XG4gICAgICAgIG1lc3NhZ2UgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzeW1ib2wnKSA/IG1lc3NhZ2UudG9TdHJpbmcoKSA6IG1lc3NhZ2U7XG5cbiAgICAgICAgdmFyIGRlbGl2ZXIgPSBjcmVhdGVEZWxpdmVyeUZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhLCBpbW1lZGlhdGVFeGNlcHRpb25zICksXG4gICAgICAgICAgICBoYXNTdWJzY3JpYmVycyA9IG1lc3NhZ2VIYXNTdWJzY3JpYmVycyggbWVzc2FnZSApO1xuXG4gICAgICAgIGlmICggIWhhc1N1YnNjcmliZXJzICl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHN5bmMgPT09IHRydWUgKXtcbiAgICAgICAgICAgIGRlbGl2ZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIGRlbGl2ZXIsIDAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoZXMgdGhlIG1lc3NhZ2UsIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBwdWJsaXNoXG4gICAgICogQHBhcmFtIHt9IGRhdGEgVGhlIGRhdGEgdG8gcGFzcyB0byBzdWJzY3JpYmVyc1xuICAgICAqIEByZXR1cm4geyBCb29sZWFuIH1cbiAgICAgKi9cbiAgICBQdWJTdWIucHVibGlzaCA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBkYXRhICl7XG4gICAgICAgIHJldHVybiBwdWJsaXNoKCBtZXNzYWdlLCBkYXRhLCBmYWxzZSwgUHViU3ViLmltbWVkaWF0ZUV4Y2VwdGlvbnMgKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGlzaGVzIHRoZSBtZXNzYWdlIHN5bmNocm9ub3VzbHksIHBhc3NpbmcgdGhlIGRhdGEgdG8gaXQncyBzdWJzY3JpYmVyc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBwdWJsaXNoU3luY1xuICAgICAqIEBwYXJhbSB7IFN0cmluZyB9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gcHVibGlzaFxuICAgICAqIEBwYXJhbSB7fSBkYXRhIFRoZSBkYXRhIHRvIHBhc3MgdG8gc3Vic2NyaWJlcnNcbiAgICAgKiBAcmV0dXJuIHsgQm9vbGVhbiB9XG4gICAgICovXG4gICAgUHViU3ViLnB1Ymxpc2hTeW5jID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGRhdGEgKXtcbiAgICAgICAgcmV0dXJuIHB1Ymxpc2goIG1lc3NhZ2UsIGRhdGEsIHRydWUsIFB1YlN1Yi5pbW1lZGlhdGVFeGNlcHRpb25zICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2UuIEV2ZXJ5IHJldHVybmVkIHRva2VuIGlzIHVuaXF1ZSBhbmQgc2hvdWxkIGJlIHN0b3JlZCBpZiB5b3UgbmVlZCB0byB1bnN1YnNjcmliZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVcbiAgICAgKiBAcGFyYW0geyBTdHJpbmcgfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbmV3IG1lc3NhZ2UgaXMgcHVibGlzaGVkXG4gICAgICogQHJldHVybiB7IFN0cmluZyB9XG4gICAgICovXG4gICAgUHViU3ViLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBmdW5jICl7XG4gICAgICAgIGlmICggdHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZSA9ICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N5bWJvbCcpID8gbWVzc2FnZS50b1N0cmluZygpIDogbWVzc2FnZTtcblxuICAgICAgICAvLyBtZXNzYWdlIGlzIG5vdCByZWdpc3RlcmVkIHlldFxuICAgICAgICBpZiAoICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG1lc3NhZ2VzLCBtZXNzYWdlICkgKXtcbiAgICAgICAgICAgIG1lc3NhZ2VzW21lc3NhZ2VdID0ge307XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JjaW5nIHRva2VuIGFzIFN0cmluZywgdG8gYWxsb3cgZm9yIGZ1dHVyZSBleHBhbnNpb25zIHdpdGhvdXQgYnJlYWtpbmcgdXNhZ2VcbiAgICAgICAgLy8gYW5kIGFsbG93IGZvciBlYXN5IHVzZSBhcyBrZXkgbmFtZXMgZm9yIHRoZSAnbWVzc2FnZXMnIG9iamVjdFxuICAgICAgICB2YXIgdG9rZW4gPSAndWlkXycgKyBTdHJpbmcoKytsYXN0VWlkKTtcbiAgICAgICAgbWVzc2FnZXNbbWVzc2FnZV1bdG9rZW5dID0gZnVuYztcblxuICAgICAgICAvLyByZXR1cm4gdG9rZW4gZm9yIHVuc3Vic2NyaWJpbmdcbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH07XG5cbiAgICBQdWJTdWIuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24oIGZ1bmMgKXtcbiAgICAgICAgcmV0dXJuIFB1YlN1Yi5zdWJzY3JpYmUoQUxMX1NVQlNDUklCSU5HX01TRywgZnVuYyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdGhlIHBhc3NlZCBmdW5jdGlvbiB0byB0aGUgcGFzc2VkIG1lc3NhZ2Ugb25jZVxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcGFyYW0geyBGdW5jdGlvbiB9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBtZXNzYWdlIGlzIHB1Ymxpc2hlZFxuICAgICAqIEByZXR1cm4geyBQdWJTdWIgfVxuICAgICAqL1xuICAgIFB1YlN1Yi5zdWJzY3JpYmVPbmNlID0gZnVuY3Rpb24oIG1lc3NhZ2UsIGZ1bmMgKXtcbiAgICAgICAgdmFyIHRva2VuID0gUHViU3ViLnN1YnNjcmliZSggbWVzc2FnZSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGJlZm9yZSBmdW5jIGFwcGx5LCB1bnN1YnNjcmliZSBtZXNzYWdlXG4gICAgICAgICAgICBQdWJTdWIudW5zdWJzY3JpYmUoIHRva2VuICk7XG4gICAgICAgICAgICBmdW5jLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBQdWJTdWI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENsZWFycyBhbGwgc3Vic2NyaXB0aW9uc1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyQWxsU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyQWxsU3Vic2NyaXB0aW9ucygpe1xuICAgICAgICBtZXNzYWdlcyA9IHt9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBzdWJzY3JpcHRpb25zIGJ5IHRoZSB0b3BpY1xuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAYWxpYXMgY2xlYXJBbGxTdWJzY3JpcHRpb25zXG4gICAgICogQHJldHVybiB7IGludCB9XG4gICAgICovXG4gICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNsZWFyU3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpe1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlcywgbSkgJiYgbS5pbmRleE9mKHRvcGljKSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VzW21dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAgIENvdW50IHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBjb3VudFN1YnNjcmlwdGlvbnNcbiAgICAgKiBAcmV0dXJuIHsgQXJyYXkgfVxuICAgICovXG4gICAgUHViU3ViLmNvdW50U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGNvdW50U3Vic2NyaXB0aW9ucyh0b3BpYyl7XG4gICAgICAgIHZhciBtO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgdmFyIHRva2VuO1xuICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICBmb3IgKG0gaW4gbWVzc2FnZXMpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKHRva2VuIGluIG1lc3NhZ2VzW21dKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgICBHZXRzIHN1YnNjcmlwdGlvbnMgYnkgdGhlIHRvcGljXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBnZXRTdWJzY3JpcHRpb25zXG4gICAgKi9cbiAgICBQdWJTdWIuZ2V0U3Vic2NyaXB0aW9ucyA9IGZ1bmN0aW9uIGdldFN1YnNjcmlwdGlvbnModG9waWMpe1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgdmFyIGxpc3QgPSBbXTtcbiAgICAgICAgZm9yIChtIGluIG1lc3NhZ2VzKXtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDApe1xuICAgICAgICAgICAgICAgIGxpc3QucHVzaChtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBzdWJzY3JpcHRpb25zXG4gICAgICpcbiAgICAgKiAtIFdoZW4gcGFzc2VkIGEgdG9rZW4sIHJlbW92ZXMgYSBzcGVjaWZpYyBzdWJzY3JpcHRpb24uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIGZ1bmN0aW9uLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IGZ1bmN0aW9uXG4gICAgICpcblx0ICogLSBXaGVuIHBhc3NlZCBhIHRvcGljLCByZW1vdmVzIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGF0IHRvcGljIChoaWVyYXJjaHkpXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBhbGlhcyBzdWJzY3JpYmVPbmNlXG4gICAgICogQHBhcmFtIHsgU3RyaW5nIHwgRnVuY3Rpb24gfSB2YWx1ZSBBIHRva2VuLCBmdW5jdGlvbiBvciB0b3BpYyB0byB1bnN1YnNjcmliZSBmcm9tXG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyB3aXRoIGEgdG9rZW5cbiAgICAgKiB2YXIgdG9rZW4gPSBQdWJTdWIuc3Vic2NyaWJlKCdteXRvcGljJywgbXlGdW5jKTtcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUodG9rZW4pO1xuICAgICAqIEBleGFtcGxlIC8vIFVuc3Vic2NyaWJpbmcgd2l0aCBhIGZ1bmN0aW9uXG4gICAgICogUHViU3ViLnVuc3Vic2NyaWJlKG15RnVuYyk7XG4gICAgICogQGV4YW1wbGUgLy8gVW5zdWJzY3JpYmluZyBmcm9tIGEgdG9waWNcbiAgICAgKiBQdWJTdWIudW5zdWJzY3JpYmUoJ215dG9waWMnKTtcbiAgICAgKi9cbiAgICBQdWJTdWIudW5zdWJzY3JpYmUgPSBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIHZhciBkZXNjZW5kYW50VG9waWNFeGlzdHMgPSBmdW5jdGlvbih0b3BpYykge1xuICAgICAgICAgICAgICAgIHZhciBtO1xuICAgICAgICAgICAgICAgIGZvciAoIG0gaW4gbWVzc2FnZXMgKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIG0pICYmIG0uaW5kZXhPZih0b3BpYykgPT09IDAgKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgZGVzY2VuZGFudCBvZiB0aGUgdG9waWMgZXhpc3RzOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNUb3BpYyAgICA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVzc2FnZXMsIHZhbHVlKSB8fCBkZXNjZW5kYW50VG9waWNFeGlzdHModmFsdWUpICksXG4gICAgICAgICAgICBpc1Rva2VuICAgID0gIWlzVG9waWMgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyxcbiAgICAgICAgICAgIGlzRnVuY3Rpb24gPSB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicsXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZSxcbiAgICAgICAgICAgIG0sIG1lc3NhZ2UsIHQ7XG5cbiAgICAgICAgaWYgKGlzVG9waWMpe1xuICAgICAgICAgICAgUHViU3ViLmNsZWFyU3Vic2NyaXB0aW9ucyh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKCBtIGluIG1lc3NhZ2VzICl7XG4gICAgICAgICAgICBpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggbWVzc2FnZXMsIG0gKSApe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlc1ttXTtcblxuICAgICAgICAgICAgICAgIGlmICggaXNUb2tlbiAmJiBtZXNzYWdlW3ZhbHVlXSApe1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWVzc2FnZVt2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyB0b2tlbnMgYXJlIHVuaXF1ZSwgc28gd2UgY2FuIGp1c3Qgc3RvcCBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHQgaW4gbWVzc2FnZSApe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZXNzYWdlLCB0KSAmJiBtZXNzYWdlW3RdID09PSB2YWx1ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1lc3NhZ2VbdF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbn0pKTtcbiIsImltcG9ydCBQdWJTdWIgZnJvbSAncHVic3ViLWpzJztcblxuZnVuY3Rpb24gZWxlbWVudENyZWF0b3JGYWN0b3J5KCkge1xuICBmdW5jdGlvbiBjcmVhdGVEZWxCdXR0b24oKSB7XG4gICAgY29uc3QgZGVsQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgZGVsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2ltYWdlQnV0dG9uJyk7XG4gICAgZGVsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2RlbEJ1dHRvbicpO1xuXG4gICAgY29uc3QgZGVsSW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgZGVsSW1nLnNyYyA9ICcuLi9pbWFnZXMvZGVsZXRlLnBuZyc7XG5cbiAgICBkZWxCdXR0b24uYXBwZW5kQ2hpbGQoZGVsSW1nKTtcblxuICAgIHJldHVybiBkZWxCdXR0b247XG4gIH1cblxuICBmdW5jdGlvbiBkZWxCdXR0b25Qcm9qZWN0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZGVsZXRlUHJvamVjdCcsIGlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbEJ1dHRvblRhc2t0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZGVsZXRlVGFzaycsIGlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGZ1bmN0aW9uIGVkaXRCdXR0b25Qcm9qZWN0TGlzdGVuZXIoYnV0dG9uLCBpZCkge1xuICAvLyAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgLy8gICAgIFB1YlN1Yi5wdWJsaXNoU3luYygnZWRpdFByb2plY3QnLCBpZCk7XG4gIC8vICAgfSk7XG4gIC8vIH1cblxuICAvLyBmdW5jdGlvbiBlZGl0QnV0dG9uVGFza3RMaXN0ZW5lcihidXR0b24sIGlkKSB7XG4gIC8vICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAvLyAgICAgUHViU3ViLnB1Ymxpc2hTeW5jKCdlZGl0VGFzaycsIGlkKTtcbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUVkaXRCdXR0b24oKSB7XG4gICAgY29uc3QgZWRpdEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGVkaXRCdXR0b24uY2xhc3NMaXN0LmFkZCgnaW1hZ2VCdXR0b24nKTtcbiAgICBlZGl0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2VkaXRCdXR0b24nKTtcbiAgICBlZGl0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3BvcHVwJyk7XG5cbiAgICBjb25zdCBlZGl0SW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgZWRpdEltZy5zcmMgPSAnLi4vaW1hZ2VzL2FyY2hpdmUtZWRpdC5wbmcnO1xuXG4gICAgZWRpdEJ1dHRvbi5hcHBlbmRDaGlsZChlZGl0SW1nKTtcblxuICAgIHJldHVybiBlZGl0QnV0dG9uO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRGVzY0VsZW1lbnQoZGVzYykge1xuICAgIGNvbnN0IGRlc2NFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGVzY0VsZW1lbnQuaW5uZXJUZXh0ID0gZGVzYztcbiAgICBkZXNjRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdwcm9qZWN0RGVzYycpO1xuICAgIGRlc2NFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICByZXR1cm4gZGVzY0VsZW1lbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVFZGl0UHJvamVjdEZvcm0oKSB7XG4gICAgY29uc3QgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICBmb3JtLmNsYXNzTGlzdC5hZGQoJ2Zvcm0nKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XG4gICAgaGVhZGVyLnRleHRDb250ZW50ID0gJ0VkaXQgUHJvamVjdCc7XG5cbiAgICBjb25zdCB0aXRsZUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICB0aXRsZUxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgJ3RpdGxlJyk7XG4gICAgdGl0bGVMYWJlbC50ZXh0Q29udGVudCA9ICdUaXRsZSc7XG5cbiAgICBjb25zdCB0aXRsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICB0aXRsZUlucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgdGl0bGVJbnB1dC5uYW1lID0gJ3RpdGxlJztcbiAgICB0aXRsZUlucHV0LmlkID0gJ3RpdGxlJztcbiAgICB0aXRsZUlucHV0LnJlcXVpcmVkID0gdHJ1ZTtcblxuICAgIGNvbnN0IGRlc2NMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgZGVzY0xhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgJ2Rlc2MnKTtcbiAgICBkZXNjTGFiZWwudGV4dENvbnRlbnQgPSAnRGVzY3JpcHRpb24nO1xuXG4gICAgY29uc3QgZGVzY0lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICBkZXNjSW5wdXQubmFtZSA9ICdkZXNjJztcbiAgICBkZXNjSW5wdXQuaWQgPSAnZGVzYyc7XG4gICAgZGVzY0lucHV0LnNldEF0dHJpYnV0ZSgnY29scycsICcxMCcpO1xuICAgIGRlc2NJbnB1dC5zZXRBdHRyaWJ1dGUoJ3Jvd3MnLCAnMTAnKTtcblxuICAgIGNvbnN0IHN1YkJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIHN1YkJ1dHRvbi50ZXh0Q29udGVudCA9ICdTdWJtaXQnO1xuICAgIHN1YkJ1dHRvbi50eXBlID0gJ3N1Ym1pdCc7XG4gICAgc3ViQnV0dG9uLmlkID0gJ3N1Ym1pdCc7XG5cbiAgICBmb3JtLmFwcGVuZENoaWxkKGhlYWRlcik7XG4gICAgZm9ybS5hcHBlbmRDaGlsZCh0aXRsZUxhYmVsKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKHRpdGxlSW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoZGVzY0xhYmVsKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGRlc2NJbnB1dCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChzdWJCdXR0b24pO1xuXG4gICAgcmV0dXJuIGZvcm07XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVFZGl0VGFza0Zvcm0oKSB7XG4gICAgY29uc3QgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICBmb3JtLmNsYXNzTGlzdC5hZGQoJ2Zvcm0nKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XG4gICAgaGVhZGVyLnRleHRDb250ZW50ID0gJ0VkaXQgVGFzayc7XG5cbiAgICBjb25zdCB0aXRsZUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICB0aXRsZUxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgJ3RpdGxlJyk7XG4gICAgdGl0bGVMYWJlbC50ZXh0Q29udGVudCA9ICdUaXRsZSc7XG5cbiAgICBjb25zdCB0aXRsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICB0aXRsZUlucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgdGl0bGVJbnB1dC5uYW1lID0gJ3RpdGxlJztcbiAgICB0aXRsZUlucHV0LmlkID0gJ3RpdGxlJztcbiAgICB0aXRsZUlucHV0LnJlcXVpcmVkID0gdHJ1ZTtcblxuICAgIGNvbnN0IGRlc2NMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgZGVzY0xhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgJ2Rlc2MnKTtcbiAgICBkZXNjTGFiZWwudGV4dENvbnRlbnQgPSAnRGVzY3JpcHRpb24nO1xuXG4gICAgY29uc3QgZGVzY0lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICBkZXNjSW5wdXQubmFtZSA9ICdkZXNjJztcbiAgICBkZXNjSW5wdXQuaWQgPSAnZGVzYyc7XG4gICAgZGVzY0lucHV0LnNldEF0dHJpYnV0ZSgnY29scycsICcxMCcpO1xuICAgIGRlc2NJbnB1dC5zZXRBdHRyaWJ1dGUoJ3Jvd3MnLCAnMTAnKTtcblxuICAgIGNvbnN0IHByaW9yaXR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgIHByaW9yaXR5TGFiZWwuc2V0QXR0cmlidXRlKCdmb3InLCAncHJpb3JpdHknKTtcbiAgICBwcmlvcml0eUxhYmVsLnRleHRDb250ZW50ID0gJ1ByaW9yaXR5JztcblxuICAgIGNvbnN0IHByaW9yaXR5SW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgICBwcmlvcml0eUlucHV0LnNldEF0dHJpYnV0ZSgnbmFtZScsICdwcmlvcml0eScpO1xuICAgIHByaW9yaXR5SW5wdXQuc2V0QXR0cmlidXRlKCdpZCcsICdwcmlvcml0eScpO1xuICAgIGNvbnN0IG5vcm1hbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIG5vcm1hbC52YWx1ZSA9ICcwJztcbiAgICBub3JtYWwudGV4dENvbnRlbnQgPSAnTm9ybWFsJztcbiAgICBjb25zdCBoaWdoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgaGlnaC52YWx1ZSA9ICcxJztcbiAgICBoaWdoLnRleHRDb250ZW50ID0gJ0hpZ2gnO1xuICAgIGNvbnN0IGhpZ2hlc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBub3JtYWwudmFsdWUgPSAnMic7XG4gICAgaGlnaGVzdC50ZXh0Q29udGVudCA9ICdIaWdoZXN0JztcblxuICAgIHByaW9yaXR5SW5wdXQuYXBwZW5kQ2hpbGQobm9ybWFsKTtcbiAgICBwcmlvcml0eUlucHV0LmFwcGVuZENoaWxkKGhpZ2gpO1xuICAgIHByaW9yaXR5SW5wdXQuYXBwZW5kQ2hpbGQoaGlnaGVzdCk7XG5cbiAgICBjb25zdCBkdWVEYXRlTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgIGR1ZURhdGVMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdkdWVEYXRlJyk7XG5cbiAgICBjb25zdCBkdWVEYXRlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIGR1ZURhdGVJbnB1dC50eXBlID0gJ2RhdGUnO1xuICAgIGR1ZURhdGVJbnB1dC5uYW1lID0gJ2R1ZURhdGUnO1xuICAgIGR1ZURhdGVJbnB1dC5pZCA9ICdkdWVEYXRlJztcblxuICAgIGNvbnN0IHN1YkJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIHN1YkJ1dHRvbi50ZXh0Q29udGVudCA9ICdTdWJtaXQnO1xuICAgIHN1YkJ1dHRvbi50eXBlID0gJ3N1Ym1pdCc7XG4gICAgc3ViQnV0dG9uLmlkID0gJ3N1Ym1pdCc7XG5cbiAgICBmb3JtLmFwcGVuZENoaWxkKGhlYWRlcik7XG4gICAgZm9ybS5hcHBlbmRDaGlsZCh0aXRsZUxhYmVsKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKHRpdGxlSW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoZGVzY0xhYmVsKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGRlc2NJbnB1dCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChwcmlvcml0eUxhYmVsKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKHByaW9yaXR5SW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoZHVlRGF0ZUxhYmVsKTtcbiAgICBmb3JtLmFwcGVuZENoaWxkKGR1ZURhdGVJbnB1dCk7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChzdWJCdXR0b24pO1xuXG4gICAgcmV0dXJuIGZvcm07XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTdGF0dXNCdXR0b24oKSB7XG4gICAgY29uc3Qgc3RhdHVzQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgc3RhdHVzQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2ltYWdlQnV0dG9uJyk7XG5cbiAgICBjb25zdCBzdGF0dXNJbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICBzdGF0dXNJbWcuc3JjID0gJy4uL2ltYWdlcy9jaXJjbGUtb3V0bGluZS5wbmcnO1xuXG4gICAgc3RhdHVzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgc3RhdHVzSW1nLnNyYyA9ICcuLi9pbWFnZXMvY2lyY2xlLnBuZyc7XG4gICAgfSk7XG5cbiAgICBzdGF0dXNCdXR0b24uYXBwZW5kQ2hpbGQoc3RhdHVzSW1nKTtcblxuICAgIHJldHVybiBzdGF0dXNCdXR0b247XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVEYXRlRWxlbWVudChkYXRlKSB7XG4gICAgY29uc3QgZGF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkYXRlRWxlbWVudC5pbm5lclRleHQgPSBkYXRlO1xuXG4gICAgcmV0dXJuIGRhdGVFbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUHJvamVjdEVsZW1lbnQodGl0bGUsIGRlc2MsIGlkKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHByb2plY3QuY2xhc3NMaXN0LmFkZCgncHJvamVjdCcpO1xuICAgIHByb2plY3QuaW5uZXJUZXh0ID0gdGl0bGU7XG4gICAgcHJvamVjdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdElEJywgaWQpO1xuXG4gICAgY29uc3QgZGVzY0VsZW1lbnQgPSBjcmVhdGVEZXNjRWxlbWVudChkZXNjKTtcbiAgICBjb25zdCBkZWxCdXR0b24gPSBjcmVhdGVEZWxCdXR0b24oKTtcbiAgICBkZWxCdXR0b25Qcm9qZWN0TGlzdGVuZXIoZGVsQnV0dG9uLCBpZCk7XG4gICAgY29uc3QgZWRpdEJ1dHRvbiA9IGNyZWF0ZUVkaXRCdXR0b24oKTtcbiAgICBjb25zdCBmb3JtID0gY3JlYXRlRWRpdFByb2plY3RGb3JtKCk7XG5cbiAgICBwcm9qZWN0LmFwcGVuZENoaWxkKGVkaXRCdXR0b24pO1xuICAgIHByb2plY3QuYXBwZW5kQ2hpbGQoZm9ybSk7XG4gICAgcHJvamVjdC5hcHBlbmRDaGlsZChkZWxCdXR0b24pO1xuICAgIHByb2plY3QuYXBwZW5kQ2hpbGQoZGVzY0VsZW1lbnQpO1xuXG4gICAgcmV0dXJuIHByb2plY3Q7XG4gIH1cblxuICAvLyBjcmVhdGUgdGFza0VsZW1lbnRcbiAgZnVuY3Rpb24gY3JlYXRlVGFza0VsZW1lbnQodGl0bGUsIGRlc2MsIGR1ZURhdGUsIHByaW9yaXR5LCBpZCkge1xuICAgIGNvbnN0IHRhc2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aXRsZUVsZW1lbnQuaW5uZXJUZXh0ID0gdGl0bGU7XG4gICAgdGFzay5jbGFzc0xpc3QuYWRkKCd0YXNrJyk7XG4gICAgdGFzay5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGFza0lEJywgaWQpO1xuXG4gICAgY29uc3Qgc3RhdHVzQnV0dG9uID0gY3JlYXRlU3RhdHVzQnV0dG9uKCk7XG4gICAgY29uc3QgZGF0ZUVsZW1lbnQgPSBjcmVhdGVEYXRlRWxlbWVudChkdWVEYXRlKTtcbiAgICBjb25zdCBkZWxCdXR0b24gPSBjcmVhdGVEZWxCdXR0b24oaWQpO1xuICAgIGRlbEJ1dHRvblRhc2t0TGlzdGVuZXIoZGVsQnV0dG9uLCBpZCk7XG4gICAgY29uc3QgZWRpdEJ1dHRvbiA9IGNyZWF0ZUVkaXRCdXR0b24oKTtcbiAgICBjb25zdCBkZXNjRWxlbWVudCA9IGNyZWF0ZURlc2NFbGVtZW50KGRlc2MpO1xuICAgIGNvbnN0IGZvcm1FbGVtZW50ID0gY3JlYXRlRWRpdFRhc2tGb3JtKCk7XG5cbiAgICB0YXNrLmFwcGVuZENoaWxkKHN0YXR1c0J1dHRvbik7XG4gICAgdGFzay5hcHBlbmRDaGlsZCh0aXRsZUVsZW1lbnQpO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZGF0ZUVsZW1lbnQpO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZWRpdEJ1dHRvbik7XG4gICAgdGFzay5hcHBlbmRDaGlsZChmb3JtRWxlbWVudCk7XG4gICAgdGFzay5hcHBlbmRDaGlsZChkZWxCdXR0b24pO1xuICAgIHRhc2suYXBwZW5kQ2hpbGQoZGVzY0VsZW1lbnQpO1xuXG4gICAgcmV0dXJuIHRhc2s7XG4gIH1cblxuICByZXR1cm4geyBjcmVhdGVQcm9qZWN0RWxlbWVudCwgY3JlYXRlVGFza0VsZW1lbnQgfTtcbn1cblxuY29uc3QgZWxlbWVudENyZWF0b3IgPSBlbGVtZW50Q3JlYXRvckZhY3RvcnkoKTtcbmV4cG9ydCBkZWZhdWx0IGVsZW1lbnRDcmVhdG9yO1xuIiwiaW1wb3J0IFB1YlN1YiBmcm9tICdwdWJzdWItanMnO1xuaW1wb3J0IGNyZWF0ZVByb2plY3QgZnJvbSAnLi9wcm9qZWN0JztcblxuZnVuY3Rpb24gbWFzdGVyUHJvamVjdCgpIHtcbiAgY29uc3QgX3Byb2plY3RzID0gW107XG4gIGxldCBzZWxlY3RlZFByb2plY3QgPSBudWxsO1xuICBQdWJTdWIuc3Vic2NyaWJlKCdkZWxldGVQcm9qZWN0JywgZGVsZXRlUHJvamVjdCk7XG4gIFB1YlN1Yi5zdWJzY3JpYmUoJ2VkaXRQcm9qZWN0JywgZWRpdFByb2plY3QpO1xuICBmdW5jdGlvbiBkZWxldGVQcm9qZWN0KGRhdGEsIGlkKSB7XG4gICAgX3Byb2plY3RzLnNwbGljZShpZCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlUHJvamVjdChwcm9qZWN0SW5mbykge1xuICAgIGNvbnN0IG5ld1Byb2plY3QgPSBjcmVhdGVQcm9qZWN0KHByb2plY3RJbmZvLnRpdGxlLCBwcm9qZWN0SW5mby5kZXNjKTtcbiAgICBfcHJvamVjdHMucHVzaChuZXdQcm9qZWN0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVkaXRQcm9qZWN0KGlkLCBwcm9qZWN0SW5mbykge1xuICAgIF9wcm9qZWN0c1tpZF0uc2V0VGl0bGUocHJvamVjdEluZm8udGl0bGUpO1xuICAgIF9wcm9qZWN0c1tpZF0uc2V0RGVzYyhwcm9qZWN0SW5mby5kZXNjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFByb2plY3RzKCkge1xuICAgIHJldHVybiBfcHJvamVjdHM7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRTZWxlY3RlZFByb2plY3QoaWQpIHtcbiAgICBzZWxlY3RlZFByb2plY3QgPSBfcHJvamVjdHNbaWRdO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRQcm9qZWN0KCkge1xuICAgIHJldHVybiBzZWxlY3RlZFByb2plY3Q7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRlbGV0ZVByb2plY3QsXG4gICAgbWFrZVByb2plY3QsXG4gICAgZ2V0UHJvamVjdHMsXG4gICAgZWRpdFByb2plY3QsXG4gICAgc2V0U2VsZWN0ZWRQcm9qZWN0LFxuICAgIGdldFNlbGVjdGVkUHJvamVjdCxcbiAgICBfcHJvamVjdHMsXG4gIH07XG59XG5jb25zdCBtYXN0ZXIgPSBtYXN0ZXJQcm9qZWN0KCk7XG5leHBvcnQgZGVmYXVsdCBtYXN0ZXI7XG4iLCJpbXBvcnQgY3JlYXRlVGFzayBmcm9tICcuL3Rhc2snO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVQcm9qZWN0KHRpdGxlLCBkZXNjKSB7XG4gIGxldCBfdGl0bGUgPSB0aXRsZTtcbiAgbGV0IF9kZXNjID0gZGVzYztcbiAgY29uc3QgX3Rhc2tzID0gW107XG5cbiAgZnVuY3Rpb24gZ2V0VGl0bGUoKSB7XG4gICAgcmV0dXJuIF90aXRsZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFRpdGxlKG5ld1RpdGxlKSB7XG4gICAgX3RpdGxlID0gbmV3VGl0bGU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREZXNjKCkge1xuICAgIHJldHVybiBfZGVzYztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldERlc2MobmV3RGVzYykge1xuICAgIF9kZXNjID0gbmV3RGVzYztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFRhc2sodGFza0luZm8pIHtcbiAgICBjb25zdCBuZXdUYXNrID0gY3JlYXRlVGFzayh0YXNrSW5mby50aXRsZSwgdGFza0luZm8uZGVzYywgdGFza0luZm8uZHVlRGF0ZSwgdGFza0luZm8ucHJpb3JpdHkpO1xuICAgIF90YXNrcy5wdXNoKG5ld1Rhc2spO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVsZXRlVGFzayhpZCkge1xuICAgIF90YXNrcy5zcGxpY2UoaWQsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gZWRpdFRhc2soaWQsIHRhc2tJbmZvKSB7XG4gICAgX3Rhc2tzW2lkXS5zZXRUaXRsZSh0YXNrSW5mby50aXRsZSk7XG4gICAgX3Rhc2tzW2lkXS5zZXREZXNjKHRhc2tJbmZvLmRlc2MpO1xuICAgIF90YXNrc1tpZF0uc2V0RHVlRGF0ZSh0YXNrSW5mby5kdWVEYXRlKTtcbiAgICBfdGFza3NbaWRdLnNldFByaW9yaXR5KHRhc2tJbmZvLnByaW9yaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRhc2tzKCkge1xuICAgIHJldHVybiBfdGFza3M7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldFRpdGxlLCBzZXRUaXRsZSwgZ2V0RGVzYywgc2V0RGVzYywgYWRkVGFzaywgZGVsZXRlVGFzaywgZWRpdFRhc2ssIGdldFRhc2tzLFxuICB9O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlVGFzayh0aXRsZSwgZGVzYywgZHVlRGF0ZSwgcHJpb3JpdHkpIHtcbiAgbGV0IF90aXRsZSA9IHRpdGxlO1xuICBsZXQgX2Rlc2MgPSBkZXNjO1xuICBsZXQgX2R1ZURhdGUgPSBkdWVEYXRlO1xuICBsZXQgX3ByaW9yaXR5ID0gcHJpb3JpdHk7XG5cbiAgZnVuY3Rpb24gc2V0VGl0bGUobmV3VGl0bGUpIHtcbiAgICBfdGl0bGUgPSBuZXdUaXRsZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRpdGxlKCkge1xuICAgIHJldHVybiBfdGl0bGU7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREZXNjKG5ld0Rlc2MpIHtcbiAgICBfZGVzYyA9IG5ld0Rlc2M7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREZXNjKCkge1xuICAgIHJldHVybiBfZGVzYztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldER1ZURhdGUobmV3RGF0ZSkge1xuICAgIF9kdWVEYXRlID0gbmV3RGF0ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldER1ZURhdGUoKSB7XG4gICAgcmV0dXJuIF9kdWVEYXRlO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJpb3JpdHkocHJpbykge1xuICAgIF9wcmlvcml0eSA9IHByaW87XG4gIH1cblxuICBmdW5jdGlvbiBnZXRQcmlvcml0eSgpIHtcbiAgICByZXR1cm4gX3ByaW9yaXR5O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXRUaXRsZSwgZ2V0VGl0bGUsIHNldER1ZURhdGUsIGdldER1ZURhdGUsIHNldERlc2MsIGdldERlc2MsIHNldFByaW9yaXR5LCBnZXRQcmlvcml0eSxcbiAgfTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuXHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUucGF0aHMgPSBbXTtcblx0aWYgKCFtb2R1bGUuY2hpbGRyZW4pIG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xuXHRyZXR1cm4gbW9kdWxlO1xufTsiLCJpbXBvcnQgZWxlbWVudENyZWF0b3IgZnJvbSAnLi9lbGVtZW50Q3JlYXRvcic7XG5pbXBvcnQgbWFzdGVyIGZyb20gJy4vbWFzdGVyJztcblxuY29uc3QgcHJvamVjdHNCYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHJvamVjdHNCYXInKTtcbmNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY29udGVudEJhcicpO1xuXG5wcm9qZWN0c0Jhci5hcHBlbmRDaGlsZChlbGVtZW50Q3JlYXRvci5jcmVhdGVQcm9qZWN0RWxlbWVudCgnbW9uZGF5JywgJ3RvZGF5IGlzIG1vbmRheScsIDApKTtcbnByb2plY3RzQmFyLmFwcGVuZENoaWxkKGVsZW1lbnRDcmVhdG9yLmNyZWF0ZVByb2plY3RFbGVtZW50KCd0ZXVzZGF5JywgJ3RvZGF5IGlzIHRldXNkYXknLCAxKSk7XG5wcm9qZWN0c0Jhci5hcHBlbmRDaGlsZChlbGVtZW50Q3JlYXRvci5jcmVhdGVQcm9qZWN0RWxlbWVudCgnd2VkbmVzZGF5JywgJ3RvZGF5IGlzIHdlZG5lc2RheScsIDIpKTtcbnByb2plY3RzQmFyLmFwcGVuZENoaWxkKGVsZW1lbnRDcmVhdG9yLmNyZWF0ZVByb2plY3RFbGVtZW50KCd0aHVyc2RheScsICd0b2RheSBpcyB0aHVyc2RheScsIDMpKTtcbnByb2plY3RzQmFyLmFwcGVuZENoaWxkKGVsZW1lbnRDcmVhdG9yLmNyZWF0ZVByb2plY3RFbGVtZW50KCdmcmlkYXknLCAndG9kYXkgaXMgZnJpZGF5JywgNCkpO1xucHJvamVjdHNCYXIuYXBwZW5kQ2hpbGQoZWxlbWVudENyZWF0b3IuY3JlYXRlUHJvamVjdEVsZW1lbnQoJ3NhdHVyZGF5JywgJ3RvZGF5IGlzIHNhdHVyZGF5JywgNSkpO1xucHJvamVjdHNCYXIuYXBwZW5kQ2hpbGQoZWxlbWVudENyZWF0b3IuY3JlYXRlUHJvamVjdEVsZW1lbnQoJ3N1bmRheScsICd0b2RheSBpcyBzdW5kYXknLCA2KSk7XG5cbmNvbnRlbnQuYXBwZW5kQ2hpbGQoZWxlbWVudENyZWF0b3IuY3JlYXRlVGFza0VsZW1lbnQoJ1dhbGsgdGhlIGRvZycsICdOZWVkIHRvIHdhbGsgbGlsIHRpbW15JywgRGF0ZSgpLCAnaGlnaCcsIDApKTtcbmNvbnRlbnQuYXBwZW5kQ2hpbGQoZWxlbWVudENyZWF0b3IuY3JlYXRlVGFza0VsZW1lbnQoJ0dvIHRvIHRoZSBneW0nLCAnR2FpbnMnLCBEYXRlKCksICdoaWdoJywgMSkpO1xuXG5jb25zdCBwb3B1cHMgPSBbLi4uZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncG9wdXAnKV07XG4vLyB0aGlzIGlzIGdvb2QgZm9yIHN0YXRpYyBidXR0b25zLiBidXQgd2hhdCBhYm91dCB0aGUgZHluYW1pYyBvbmVzIHRvIGJlIGxvYWRlZCBsYXRlcj9cbi8vIGhhdmUgZWxlbWVudExvYWRlciBjb250YWluIGFuIGFycmF5IG9mIHBvdXBzLlxuLy8gZWFjaCB0aW1lIGEgbmV3IHByb2plY3QvdGFzayBjcmVhdGVkIHVwZGF0ZSB0aGUgcG9wdXBzXG4vLyBlbGVtZW50IGxvYWRlciB3aWxsIGhhbmRsZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG5mdW5jdGlvbiB0b2dnbGUoZXZlbnQpIHtcbiAgcG9wdXBzLmZvckVhY2goKHApID0+IHtcbiAgICBpZiAocCAhPT0gZXZlbnQpIHtcbiAgICAgIGlmIChwLmNsYXNzTGlzdC5jb250YWlucygnc2hvdycpKSB7XG4gICAgICAgIHAuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBldmVudC5jbGFzc0xpc3QudG9nZ2xlKCdzaG93Jyk7XG4gICAgfVxuICB9KTtcbn1cblxucG9wdXBzLmZvckVhY2goKHApID0+IHtcbiAgcC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICB0b2dnbGUocCk7XG4gIH0pO1xufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICh7IHRhcmdldCB9KSA9PiB7XG4gIC8vIG5lZWQgdGhpcyB0byBvbmx5IHRyaWdnZXIgb24gZWxlbWVudHMgdGhhdCBhcmUgbm90IHBvcHVwIGJ1dHRvbnMgb3IgZm9ybXNcbiAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHtcbiAgICBpZiAodGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdwb3B1cCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIGlmICh0YXJnZXQucGFyZW50Tm9kZSBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCB8fCB0YXJnZXQgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcG9wdXBzLmZvckVhY2goKHApID0+IHAuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpKTtcbn0pOy8vIHRvZ2dsZSB0aGUgc3RhdHVzIGJ1dHRvblxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9