'use strict';
if ($('#navbar')[0].dataset.loggedin === 'false') $('.modal').modal('show');
$.get('/content/homepage', data => {
  $('main').append(data);
}, 'html').fail(response => {
  console.log(response);
  $('main')[0].dataset.error = 'true';
  $('aside.error-no-content')[0].dataset.show = 'true';
});
