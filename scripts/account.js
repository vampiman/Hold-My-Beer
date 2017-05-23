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
