'use strict';

const username = $('nav > a[href="/account"]')[0].innerText;

attachLiveContent(`user/${username}/challenges`);
