'use strict';

const username = $('nav > a[href="/account"]')[0].innerText;

attachLiveContent(`user/${username}/challenges`);

const getUserVideosURI = (function () {
  const startTime = new Date().toISOString();
  let postOffset = 0;
  return function () {
    const uri = `/content/user/${username}/videos?time=${encodeURIComponent(startTime)}&offset=${postOffset}`;
    postOffset += 5;
    return uri;
  };
})();

const getVideos = (function () {
  const userVideos = $('div.user-videos');
  const moreBtn = userVideos.find('.responses-more');
  const self = function () {
    $.get(getUserVideosURI(), (data, textStatus) => {
      if (textStatus === 'nocontent') {
        moreBtn.remove();
        return;
      }
      $(userVideos).find('.responses').append(data.rendered);
      $(userVideos).find('.no-responses').remove();
      attachResponseClicks();
    }).fail(response => {
      console.error(response);
    });
  };
  moreBtn.click(event => self());
  return self;
})();

getVideos();

$('#change-avatar').click(event => $('#avatar-file-input').click());
$('#avatar-file-input').on('change', event => {
  const avatar = $('#avatar-file-input')[0].files[0];
  if (avatar.size > 1024 * 1024 * 1) {
    // FIXME show avatar too big error
    return;
  }
  const data = new FormData();
  data.append('avatar', avatar);
  data.append('username', username);
  $.ajax({
    url: '/create/avatar',
    data,
    cache: false,
    contentType: false,
    processData: false,
    type: 'POST',
    success: data => {
      location.assign('/account');
    },
    error: err => {
      console.error(err);
      // FIXME show error somewhere
    }
  });
});
