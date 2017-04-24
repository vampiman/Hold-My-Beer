'use strict';
const ErrorPopup = (function() {
  const errorPopups = {};
  const obj = {};
  // Remove stored popup from DOM and delete it from the map
  function deletePopup(formAction, whichInput) {
    errorPopups[formAction][whichInput].remove();
    delete errorPopups[formAction][whichInput];
  }
  obj.create = function (form, whichInput, text) {
    const popup = document.createElement('div');
    // 40px input height + 10px input margin
    popup.style.marginTop = `${whichInput * (40 + 10)}px`;
    popup.className = 'error-popup';
    popup.dataset.show = 'false';
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
  obj.remove = function (form, whichInput) {
    const formAction = $(form).attr('action');
    if (!errorPopups[formAction]) return;
    if (!errorPopups[formAction][whichInput]) return;
    deletePopup(formAction, whichInput);
  };
  return obj;
})();

// Show error UI elements to user
function showIssues(form, whichInput, errText) {
  $(form).find(':submit').addClass('validation-error');
  ErrorPopup.create(form, whichInput, errText);
}

// Returns true if form password is valid, false otherwise, shows err UI
function validatePassword(form, whichInput) {
  const passwordInput = form.find('input[name="password"]');
  if (passwordInput.val().length < 5) {
    showIssues(form, whichInput, i18n.passShort);
    return false;
  } else if (passwordInput.val().length > 500) {
    showIssues(form, whichInput, i18n.passLong);
    return false;
  }
  ErrorPopup.remove(form, whichInput);
  return true;
}

// Returns true if form email is valid, false otherwise, shows err UI
function validateEmail(form, whichInput) {
  const emailInput = form.find('input[name="email"]');
  if (/\S+@\S+\.\S+/.test(emailInput.val())) {
    ErrorPopup.remove(form, whichInput);
    return true;
  }
  showIssues(form, whichInput, i18n.notEmail);
  return false;
}

// Returns true if form username is valid, false otherwise, shows err UI
function validateUsername(form, whichInput) {
  const usernameInput = form.find('input[name="username"]');
  if (usernameInput.val().length < 4) {
    showIssues(form, whichInput, i18n.userShort);
    return false;
  } else if (usernameInput.val().length > 15) {
    showIssues(form, whichInput, i18n.userLong);
    return false;
  }
  ErrorPopup.remove(form, whichInput);
  return true;
}

function sendPost(form) {
  $.post($(form).attr('action'), $(form).serialize(), json => {
    location.assign('/');
  }, 'json').fail(response => {
    // FIXME handle auth errors
    console.error(response);
  });
}

const loginForm = $('form[action="/login"]');
loginForm.submit(event => {
  event.preventDefault();
  let isValid = true;
  isValid &= validateEmail(loginForm, 0);
  isValid &= validatePassword(loginForm, 1);
  if (!isValid) return false;
  sendPost(loginForm);
  return false;
});

const registerForm = $('form[action="/register"]');
registerForm.submit(event => {
  event.preventDefault(); // We do the sending ourselves
  let isValid = true;
  isValid &= validateEmail(registerForm, 0);
  isValid &= validateUsername(registerForm, 1);
  isValid &= validatePassword(registerForm, 2);
  isValid &= validatePassword(registerForm, 3);
  if (registerForm.find('input[name="password"]').val() !== $('#confirm-password').val()) {
    isValid &= false;
    showIssues(registerForm, 3, i18n.passNoMatch);
  } else {
    ErrorPopup.remove(registerForm, 3);
  }
  // Don't post if input is not valid
  if (!isValid) return false;
  sendPost(registerForm);
  return false;
});
