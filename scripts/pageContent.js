'use strict';

function attachLiveContent(path) {
  function isLoadingVisible() {
    const loader = $('section.loading')[0];
    return loader.getBoundingClientRect().top >= 0 &&
      loader.getBoundingClientRect().bottom <= window.innerHeight;
  }

  function appendLoading() {
    $('main').append(`<section class="loading">${i18n.loadingMore}</section>`);
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
  
  $.get(getRequestURI(path), data => {
    $('main').append(data.rendered);
    appendLoading();
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
      $('main').append(data.rendered);
      appendLoading();
    }, 'json').fail(response => {
      console.error(response);
      $('section.loading')[0].innerHtml = i18n.loadingMoreFail;
    });
  });
}

window.attachLiveContent = attachLiveContent;
