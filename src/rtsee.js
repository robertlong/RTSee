var _ = require('lodash');

navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;

function RTSee (el, opts) {
  this.el = el;

  this.opts = _.extend({
    video: true,
    audio: true
  }, opts);  

  navigator.getUserMedia({video: this.opts.video, audio: this.opts.audio}, 
    this._onMediaSuccess.bind(this), 
    this._onMediaError.bind(this));
}

_.extend(RTSee.prototype, {
  
  _onMediaSuccess: function (mediaStream) {
    this.stream = mediaStream;
    this.el.src = window.URL.createObjectURL(this.stream);
    this.el.play();
  },

  _onMediaError: function (err) {
    console.error(err);
  },

  captureScreenshot: function () {
    var canvas = document.createElement('canvas');

    var context = canvas.getContext('2d');
    canvas.width = this.el.width;
    canvas.height = this.el.height;

    context.drawImage(this.el, 0, 0, canvas.width, canvas.height);
    
    var dataURL = canvas.toDataURL('image/png');
    
    var img = new Image();
    img.src = dataURL;

    return img;
  }

});

module.exports = RTSee;