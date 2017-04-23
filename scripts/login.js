'use strict';
const loginForm = $('form[action="/login"]');
loginForm.submit(() => {
  $.post($(loginForm).attr('action'), $(loginForm).serialize(), json => {
    location.assign('/');
  }, 'json').fail(response => {
    // FIXME handle auth errors
    console.error(response.responseJSON);
  });
  return false;
});
