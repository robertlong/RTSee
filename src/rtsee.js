var extend = require('extend');

// Alias for vendor getUserMedia API
navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;

// Keeps the canvas from rendering at unessessary speeds
var FRAMERATE_CAP = 30;// fps

function RTSee (canvasEl, opts) {
  this.opts = extend({
    video: true,
    audio: true,
    width: 640,
    height: 480,
    micPlaybackMuted: false,
    filter: 'default',
    onError: function () {}
  }, opts);

  this.canvasEl = canvasEl;
  this.videoEl = document.createElement('video');
  this.backEl = document.createElement('canvas');

  this.backEl.width = this.canvasEl.width = this.opts.width;
  this.backEl.height = this.canvasEl.height = this.opts.height;

  this.canvasCtx = canvasEl.getContext('2d');
  this.backCtx = this.backEl.getContext('2d');

  this.videoEl.muted = this.opts.micPlaybackMuted;

  navigator.getUserMedia(
    {video: this.opts.video, audio: this.opts.audio}, 
    this._onMediaSuccess.bind(this), 
    this._onMediaError.bind(this));
}

extend(RTSee.prototype, {
  
  /**
   * Use the mediaStream returned from getUserMedia to render out to the videoEl.
   * Add an event listener to start rendering the canvas when 
   */
  _onMediaSuccess: function (mediaStream) {
    this.videoEl.src = window.URL.createObjectURL(mediaStream);
    this.videoEl.play();

    this.videoEl.addEventListener('playing', this._onPlaying.bind(this), false);
  },

  /**
   * If there was an error getting the user's mediastream. Log an error
   * and call the provided onError function.
   */
  _onMediaError: function (err) {
    console.error(err);
    this.opts.onError(err);
  },

  /**
   * Once the video has begun playing, render the video to the canvas at
   * FRAMERATE_CAP fps.
   */
  _onPlaying: function () {
    var video = this.videoEl;
    var canvas = this.canvasEl;
    var ctx = this.canvasCtx;
    var backCtx = this.backCtx;
    var back = this.backEl;
    var cw = this.opts.width;
    var ch = this.opts.height;
    var renderCanvas = this._renderCanvas.bind(this);

    var draw = function () {
        setTimeout(function() {
            requestAnimationFrame(draw);
            renderCanvas(video, ctx, backCtx, cw, ch, this.opts.filter); 
        }.bind(this), 1000 / FRAMERATE_CAP);
    }.bind(this);

    draw();
  },

  /**
   * Render the video stream to the canvas.
   * Apply any applicable filters.
   */ 
  _renderCanvas: function (v, c, bc, w, h, filter) {
    if(v.paused || v.ended) return false;

    // If there is no filter applied, draw the video directly to the canvas.
    if (filter === 'default') {
      c.drawImage(v, 0, 0, w, h);
      return;
    }

    // Draw the video into the backing canvas
    bc.drawImage(v, 0, 0, w, h);
    // Grab the pixel data from the backing canvas
    var idata = bc.getImageData(0,0,w,h);
    var data = idata.data;

    // Apply the filter to the pixel data
    switch (filter) {
      case 'greyscale':
        this._filterGreyscale(data);
        break;
      case 'sepia':
        this._filterSepia(data);
        break;
      case 'invert':
        this._filterInvert(data);
        break;
    }

    idata.data = data;

    // Draw the pixels onto the visible canvas
    c.putImageData(idata, 0, 0);
  },

  /**
   * Image data format:
   * data = [red(0,0), green(0,0), blue(0,0), alpha(0,0)]
   */

  // Make the image data greyscale.
  _filterGreyscale: function (data) {
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

  // Make the image data more orange.
  _filterSepia: function (data) {
    for(var i = 0; i < data.length; i+=4) {
      var or = data[i];
      var og = data[i + 1];
      var ob = data[i + 2];

      var r = (or * 0.393 + og * 0.769 + ob * 0.189);
      var g = (or * 0.349 + og * 0.686 + ob * 0.168);
      var b = (or * 0.272 + og * 0.534 + ob * 0.131);

      if (r < 0) r = 0;
      if (r > 255) r = 255;
      if (g < 0) g = 0;
      if (g > 255) g = 255;
      if (b < 0) b = 0;
      if (b > 255) b = 255;

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;  
    }
  },

  // Invert the colors in the image data.
  _filterInvert: function (data) {
    for(var i = 0; i < data.length; i += 4) {
      data[i] = Math.round(255 - data[i]); // Red
      data[i + 1] = Math.round(255 - data[i + 1]); // Green
      data[i + 2] = Math.round(255 - data[i + 2]); // Blue
    }
  },

  // Returns the image captured from the provided canvas element.
  captureScreenshot: function () {
    var canvas = this.canvasEl;
    var dataURL = canvas.toDataURL('image/png');
    
    var img = new Image();
    img.src = dataURL;

    return img;
  },

  /**
   * Mutes and unmutes the playback of the microphone.
   * Note: This doesn't keep the microphone from streaming.
   */
  toggleMicPlayback: function () {
    this.videoEl.muted = !this.videoEl.muted;
  }

});

module.exports = RTSee;