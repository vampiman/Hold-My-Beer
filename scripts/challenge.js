'use strict';

const form = $('form[action="/create/challenge"]');
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
  const desc = form.find('textarea[name="desc"]').val();
  if (!desc) {
    isValid = false;
    ErrorPopup.create(form, 1, i18n.noDesc);
  } else if (desc && desc.length > 250) {
    isValid = false;
    ErrorPopup.create(form, 1, i18n.descLong);
  } else {
    ErrorPopup.remove(form, 1);
  }
  if (!isValid) return false;
  $.post($(form).attr('action'), $(form).serialize(), json => {
    location.assign('/');
  }, 'json').fail(response => {
    ErrorPopup.createFull(form, i18n.serverValidation);
  });
  return false;
});
