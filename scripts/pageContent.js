'use strict';

function attachLiveContent(path) {
  function isLoadingVisible() {
    const loader = $('section.loading')[0];
    return loader.getBoundingClientRect().top >= 0 &&
      loader.getBoundingClientRect().bottom <= window.innerHeight;
  }
  
  const getRequestURI = (function () {
    const startTime = new Date().toISOString();
    let postOffset = 0;
    return function (path) {
      const uri = `/content/${path}?time=${encodeURIComponent(startTime)}&offset=${postOffset}`;
      postOffset += 5;
      return uri;
    };
  })();
  
  const getVideoURI = (function () {
    const startTime = new Date().toISOString();
    const offsetMap = {};
    return function (challenge) {
      if (offsetMap[challenge] === undefined) offsetMap[challenge] = 0;
      const uri = `/content/responselist?challenge=${encodeURIComponent(challenge)}&time=${encodeURIComponent(startTime)}&offset=${offsetMap[challenge]}`;
      offsetMap[challenge] += 5;
      return uri;
    };
  })();
  
  const videoviewer = $('.videoviewer')[0];
  $(videoviewer).click(event => {
    $(video).find('source').remove();
    videoviewer.dataset.show = 'false';
  });
  const video = $(videoviewer).find('video')[0];
  function attachResponseClicks() {
    $('.responselink').each((idx, element) => {
      $(element).off('click'); // Ensure we only have one click event
      $(element).click(event => {
        $(video).find('source').remove();
        const source = document.createElement('source');
        source.src = `/content/video/${element.dataset.id}`;
        $(video).append(source);
        videoviewer.dataset.show = 'true';
      });
    });
  }
  
  function getVideos(challengeElement, moreElement) {
    $.get(getVideoURI(challengeElement.dataset.challengeName), (data, textStatus) => {
      if (textStatus === 'nocontent') {
        $(moreElement).remove();
        return;
      }
      $(challengeElement).find('.responses').append(data.rendered);
      $(challengeElement).find('.no-responses').remove();
      attachResponseClicks();
    }).fail(response => {
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
    $('main').append(`<section class="loading">${i18n.loadingMore}</section>`);
  }

  $.get(getRequestURI(path), data => {
    appendContent(data.rendered);
  }, 'json').fail(response => {
    console.error(response);
    $('main')[0].dataset.error = 'true';
    $('div.error-no-content')[0].dataset.show = 'true';
  });

  let noContent = false;
  $('main').scroll(() => {
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
  });
}

window.attachLiveContent = attachLiveContent;
