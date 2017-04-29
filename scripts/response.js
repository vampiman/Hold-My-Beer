'use strict';

function targetChallenge() {
  return window.location.search
    .slice(1)
    .split('&')
    .map(s => s.split('='))
    .filter(kv => kv[0] === 'to')[0][1];
}

const form = $('form[action="/create/response"]');
form.submit(event => {
  event.preventDefault();
  let isValid = true;
  const title = form.find('input[name="title"]').val();
  if (!title) {
    isValid = false;
    ErrorPopup.create(form, 0, i18n.noTitle);
  } else if (title && title.length > 40) {
    isValid = false;
    ErrorPopup.create(form, 0, i18n.titleLong);
  } else {
    ErrorPopup.remove(form, 0);
  }
  const file = form.find('input[name="video"]')[0].files[0];
  if (!file) {
    isValid = false;
    ErrorPopup.create(form, 1, i18n.noVideo);
  } else if (file.type.indexOf('video') !== 0) {
    isValid = false;
    ErrorPopup.create(form, 1, i18n.notAVideo);
  } else {
    ErrorPopup.remove(form, 1);
  }
  if (!isValid) return false;
  const data = new FormData();
  data.append('title', title);
  data.append('video', file);
  data.append('target', targetChallenge());
  $.ajax({
    url: '/create/response',
    data,
    cache: false,
    contentType: false,
    processData: false,
    type: 'POST',
    success: data => {
      location.assign('/');
    },
    error: err => {
      ErrorPopup.createFull(form, i18n.serverValidation);
    }
  });
  return false;
});
