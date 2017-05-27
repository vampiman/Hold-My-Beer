'use strict';

const errorPopups = {};
const fullErrPopups = {};
// Remove stored popup from DOM and delete it from the map
function deletePopup(formAction, whichInput) {
  errorPopups[formAction][whichInput].remove();
  delete errorPopups[formAction][whichInput];
}

const self = {};

self.create = function (form, whichInput, text, alterPopup = () => {}) {
  const popup = document.createElement('div');
  // 40px input height + 10px input margin
  popup.style.marginTop = `${whichInput * (40 + 10)}px`;
  popup.className = 'error-popup';
  popup.dataset.show = 'false';
  alterPopup(popup);
  popup.appendChild(document.createTextNode(text));
  $(form).append(popup);
  setTimeout(() => popup.dataset.show = 'true', 0);
  
  const formAction = $(form).attr('action');
  // Create popup map for this form, if it doesn't exist
  errorPopups[formAction] = errorPopups[formAction] || {};
  // Get rid of existing popup
  if (errorPopups[formAction][whichInput]) {
    deletePopup(formAction, whichInput);
  }
  // Store new popup in the map
  errorPopups[formAction][whichInput] = popup;
};

self.createFull = function (form, text) {
  self.create(form, 'full', text, popup => {
    popup.style.marginTop = '';
    popup.className = 'error-popup full';
  });
};

self.remove = function (form, whichInput) {
  const formAction = $(form).attr('action');
  if (!errorPopups[formAction]) return;
  if (!errorPopups[formAction][whichInput]) return;
  deletePopup(formAction, whichInput);
};

window.ErrorPopup = self;
