'use strict';

$('#navbar .close-btn').on('click',
  () => $('.overlay')[0].style.height = '0%');

$('#navbar .open-btn').on('click',
  () => $('.overlay')[0].style.height = '100%');
