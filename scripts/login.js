'use strict';
function isEmailValid(email) {
  return /\S+@\S+\.\S+/.test(email);
}

const loginForm = $('form[action="/login"]');
loginForm.submit(() => {
  if (!isEmailValid($('form[action="/login"] input[name="email"]')[0].value)) {
    // FIXME show user something
    return false;
  }
  // FIXME validate password
  $.post($(loginForm).attr('action'), $(loginForm).serialize(), json => {
    location.assign('/');
  }, 'json').fail(response => {
    // FIXME handle auth errors
    console.error(response.responseJSON);
  });
  return false;
});

// FIXME validate register form
