var assert = require('assert');

describe('Promise-enabled WebDriver', function () {

  describe('injected browser executing a Google Search', function () {

    it('performs as expected', function (done) {
      var video;
      var browser = this.browser;
      browser.get('http://localhost:8080')
        .then(function () {
          return browser.elementById('video');
        })
        .then(function (el) {
          video = el;
          return searchBox.getAttribute('muted');
        })
        .then(function (val) {
          return assert.equal(val, false);
        })
        .then(done, done);
    });
  });
});