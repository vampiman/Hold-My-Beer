'use strict';

const VideoViewer = window.VideoViewer = (function () {
  const self = {};
  const videoviewer = $('.videoviewer')[0];
  const video = $(videoviewer).find('video')[0];

  self.hide = () => {
    $(video).find('source').remove();
    video.pause();
    videoviewer.dataset.show = 'false';
  };

  self.show = videoId => {
    $(video).find('source').remove();
    const source = document.createElement('source');
    source.src = `/content/video/${videoId}`;
    $(video).append(source);
    video.load();
    videoviewer.dataset.show = 'true';
  };

  $(videoviewer).click(self.hide);
  return self;
})();

window.attachResponseClicks = function () {
  $('.responselink').each((idx, element) => {
    $(element).off('click'); // Ensure we only have one click event
    $(element).click(event => {
      VideoViewer.show(element.dataset.id);
    });
  });
  function triggerVoteAction(element, upOrDown) {
    const chName = $(element).closest('section.challenge')[0].dataset.challengeName;
    $(element).toggleClass('active');
    $.ajax({
      type: 'PUT',
      url: `/vote/challenge/${upOrDown}?challenge=${chName}`,
      success: data => {
        const countElement = $(element).parent().find('.vote-count')[0];
        countElement.innerText = Number(countElement.innerText) + (upOrDown === 'up' ? 1 : -1);
      },
      error: err => {
        $(element).toggleClass('active');
        console.error(err);
        alert(i18n.failedVote);
      }
    });
  }
  if ($('#navbar')[0].dataset.loggedin === 'false') return;
  $('.upvote').each((idx, element) => {
    $(element).off('click');
    $(element).click(event => {
      triggerVoteAction(element, 'up');
    });
  });
  $('.downvote').each((idx, element) => {
    $(element).off('click');
    $(element).click(event => {
      triggerVoteAction(element, 'down');
    });
  });
};

setInterval(attachResponseClicks, 1000);

window.attachLiveContent = function (path) {
  const startTime = encodeURIComponent(new Date().toISOString());

  const getRequestURI = (function () {
    let postOffset = 0;
    return function (path) {
      const uri = `/content/${path}?time=${startTime}&offset=${postOffset}`;
      postOffset += 5;
      return uri;
    };
  })();

  const getResponseListURI = (function () {
    const offsetMap = {};
    return function (challenge) {
      if (offsetMap[challenge] === undefined) offsetMap[challenge] = 0;
      const encChallenge = encodeURIComponent(challenge);
      const uri = `/content/responselist?challenge=${encChallenge}&time=${startTime}&offset=${offsetMap[challenge]}`;
      offsetMap[challenge] += 5;
      return uri;
    };
  })();

  function getVideos(challengeElement, moreElement) {
    $.get(getResponseListURI(challengeElement.dataset.challengeName), (data, textStatus) => {
      attachResponseClicks();
      if (textStatus === 'nocontent') {
        $(moreElement).remove();
        return;
      }
      $(challengeElement).find('.responses').append(data.rendered);
      $(challengeElement).find('.no-responses').remove();
    }).fail(response => {
      attachResponseClicks();
      console.error(response);
    });
  }

  let lastIdx = 0;
  function appendContent(renderedHtml) {
    $('main').append(renderedHtml);
    $('main').find('section').each((idx, challengeElement) => {
      // Make sure that we do not run init code again for sections we already processed
      if (idx < lastIdx) return;
      const moreElement = $(challengeElement).find('.responses-more');
      getVideos(challengeElement, moreElement);
      $(moreElement).click(event => getVideos(challengeElement, moreElement));
      lastIdx = idx;
    });
    attachResponseClicks();
    $('main').append(`<section class="loading">${i18n.loadingMore}</section>`);
  }

  $.get(getRequestURI(path), data => {
    appendContent(data.rendered);
    if ($('main')[0].children.length < 6) {
      $('section.loading')[0].innerHTML = i18n.noMoreContent;
    }
  }, 'json').fail(response => {
    console.error(response);
    $('main')[0].dataset.error = 'true';
    $('div.error-no-content')[0].dataset.show = 'true';
  });

  function isLoadingVisible() {
    const loader = $('section.loading')[0];
    return loader.getBoundingClientRect().top >= 0 &&
      loader.getBoundingClientRect().bottom <= window.innerHeight;
  }

  let noContent = false;
  $('main')[0].addEventListener('scroll', () => {
    if (noContent) return;
    if (!isLoadingVisible()) return;
    $.get(getRequestURI(path), (data, textStatus) => {
      if (textStatus === 'nocontent') {
        noContent = true;
        $('section.loading')[0].innerHTML = i18n.noMoreContent;
        return;
      }
      $('section.loading').remove();
      appendContent(data.rendered);
    }, 'json').fail(response => {
      console.error(response);
      $('section.loading')[0].innerHtml = i18n.loadingMoreFail;
    });
  }, {
    passive: true
  });
};
