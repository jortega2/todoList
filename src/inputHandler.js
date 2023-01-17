// new class to handle inputed data into new project/task
// add some dummy projects/tasks directly into master
// test the elementLoader
// add the highlight feature
// make new class to handle input

// const popups = [...document.getElementsByClassName('popup')];

// function toggle(event) {
//   popups.forEach((p) => {
//     if (p !== event) {
//       if (p.classList.contains('show')) {
//         p.classList.remove('show');
//       }
//     } else {
//       event.classList.toggle('show');
//     }
//   });
// }

// popups.forEach((p) => {
//   p.addEventListener('click', () => {
//     toggle(p);
//   });
// });

// window.addEventListener('click', ({ target }) => {
//   // need this to only trigger on elements that are not popup buttons or forms
//   if (target instanceof HTMLImageElement) {
//     if (target.parentNode.classList.contains('popup')) {
//       return;
//     }
//   }
//   if (target.parentNode instanceof HTMLFormElement || target instanceof HTMLFormElement) {
//     return;
//   }
//   popups.forEach((p) => p.classList.remove('show'));
// });// toggle the status button

// this is good for static buttons. but what about the dynamic ones to be loaded later?
// have elementLoader contain an array of popups.
// each time a new project/task created update the popups
// element loader will handle the event listeners
