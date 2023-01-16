import elementCreator from './elementCreator';
import master from './master';

const projectsBar = document.querySelector('.projectsBar');

projectsBar.appendChild(elementCreator.createProjectElement('monday', 'today is monday', 0));
projectsBar.appendChild(elementCreator.createProjectElement('teusday', 'today is teusday', 1));
projectsBar.appendChild(elementCreator.createProjectElement('wednesday', 'today is wednesday', 2));
projectsBar.appendChild(elementCreator.createProjectElement('thursday', 'today is thursday', 3));
projectsBar.appendChild(elementCreator.createProjectElement('friday', 'today is friday', 4));
projectsBar.appendChild(elementCreator.createProjectElement('saturday', 'today is saturday', 5));
projectsBar.appendChild(elementCreator.createProjectElement('sunday', 'today is sunday', 6));

const popups = [...document.getElementsByClassName('popup')];
console.log(popups);
// this is good for static buttons. but what about the dynamic ones to be loaded later?
// have elementCreator create a editProject form for each project.
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
});
