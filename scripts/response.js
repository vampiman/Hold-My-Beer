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
  } else if (title && title.length > 15) {
    isValid = false;
    ErrorPopup.create(form, 0, i18n.responseTitleLong);
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
  } else if (file.size > 1024 * 1024 * 20) {
    isValid = false;
    ErrorPopup.create(form, 1, i18n.videoLarge);
  } else {
    ErrorPopup.remove(form, 1);
  }
  if (!isValid) return false;
  const data = new FormData();
  data.append('title', title);
  data.append('video', file);
  data.append('target', targetChallenge());
  $.ajax({
    xhr: () => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', event => {
        if (!event.lengthComputable) {
          console.error('Progress error?');
          alert(i18n.serverError);
        }
      }, false);
      return xhr;
    },
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
      console.error(err);
      ErrorPopup.createFull(form, i18n.serverValidation);
    }
  });
  return false;
});
