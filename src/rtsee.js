var _ = require('lodash');

navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia; 

var AudioContext = window.webkitAudioContext || window.AudioContext;

function RTSee (canvasEl, opts) {
  this.canvasEl = canvasEl;
  this.videoEl = document.createElement('video');
  this.backEl = document.createElement('canvas');

  this.canvasCtx = canvasEl.getContext('2d');
  this.backCtx = this.backEl.getContext('2d');

  this.opts = _.extend({
    video: true,
    audio: true,
    width: 640,
    height: 480,
    micPlaybackMuted: false,
    filter: 'default'
  }, opts);

  this.videoEl.muted = this.opts.micPlaybackMuted;

  navigator.getUserMedia({video: this.opts.video, audio: this.opts.audio}, 
    this._onMediaSuccess.bind(this), 
    this._onMediaError.bind(this));
}

_.extend(RTSee.prototype, {
  
  _onMediaSuccess: function (mediaStream) {
    this.stream = mediaStream;
    
    this.videoEl.src = window.URL.createObjectURL(this.stream);
    this.videoEl.play();

    this.videoEl.addEventListener('playing', this._onPlaying.bind(this), false);
  },

  _onMediaError: function (err) {
    console.error(err);
  },

  _onPlaying: function () {
    var video = this.videoEl;
    var canvas = this.canvasEl;
    var ctx = this.canvasCtx;
    var backCtx = this.backCtx;
    var back = this.backEl;
    var cw = this.opts.width;
    var ch = this.opts.height;
    var renderCanvas = this._renderCanvas.bind(this);

    canvas.width = cw;
    canvas.height = ch;
    back.width = cw;
    back.height = ch;

    var fps = 30;
    var draw = function () {
        setTimeout(function() {
            requestAnimationFrame(draw);
            renderCanvas(video, ctx, backCtx, cw, ch, this.opts.filter); 
        }.bind(this), 1000 / fps);
    }.bind(this);

    draw();
  },

  _renderCanvas: function (v, c, bc, w, h, filter) {
    if(v.paused || v.ended) return false;

    // First, draw it into the backing canvas
    bc.drawImage(v,0,0,w,h);
    // Grab the pixel data from the backing canvas
    var idata = bc.getImageData(0,0,w,h);
    var data = idata.data;

    switch (filter) {
      case 'greyscale':
        this._filterGreyscale(data);
        break;
      case 'sepia':
        this._filterSepia(data, w, h);
        break;
      case 'invert':
        this._filterInvert(data, w, h);
        break;
    }

    idata.data = data;

    // Draw the pixels onto the visible canvas
    c.putImageData(idata, 0, 0);
  },

  _filterGreyscale: function (data) {
    // Loop through the pixels, turning them grayscale
    for(var i = 0; i < data.length; i+=4) {
      var r = data[i];
      var g = data[i+1];
      var b = data[i+2];
      var brightness = (3*r+4*g+b)>>>3;
      data[i] = brightness;
      data[i+1] = brightness;
      data[i+2] = brightness;
    }
  },

  _filterSepia: function (data, w, h) {
    var w4 = w * 4;
    var y = h;
    do {
      var offsetY = (y - 1) * w4;
      var x = w;
      do {
        var offset = offsetY + (x - 1) * 4;

        var or = data[offset];
        var og = data[offset + 1];
        var ob = data[offset + 2];

        var r = (or * 0.393 + og * 0.769 + ob * 0.189);
        var g = (or * 0.349 + og * 0.686 + ob * 0.168);
        var b = (or * 0.272 + og * 0.534 + ob * 0.131);

        if (r < 0) r = 0;
        if (r > 255) r = 255;
        if (g < 0) g = 0;
        if (g > 255) g = 255;
        if (b < 0) b = 0;
        if (b > 255) b = 255;

        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;

      } while (--x);
    } while (--y);
  },

  _filterInvert: function (data, w, h) {
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var pixel = (y * w + x) * 4;
        data[pixel] = Math.round(255 - data[pixel]);
        data[pixel + 1] = Math.round(255 - data[pixel + 1]);
        data[pixel + 2] = Math.round(255 - data[pixel + 2]);
        data[pixel + 3] = data[pixel + 3];
      }   
    }
  },

  captureScreenshot: function () {
    var canvas = this.canvasEl;
    var dataURL = canvas.toDataURL('image/png');
    
    var img = new Image();
    img.src = dataURL;

    return img;
  },

  toggleMicPlayback: function () {
    this.videoEl.muted = !this.videoEl.muted;
  }
  
});

module.exports = RTSee;