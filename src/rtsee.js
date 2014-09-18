var _ = require('lodash');

navigator.getUserMedia = navigator.getUserMedia ||
                   navigator.webkitGetUserMedia ||
                   navigator.mozGetUserMedia ||
                   navigator.msGetUserMedia;

var AudioContext = window.webkitAudioContext || window.AudioContext;

function RTSee (videoEl, opts) {
  this.videoEl = videoEl;

  this.opts = _.extend({
    video: true,
    audio: true,
    micPlaybackMuted: false
  }, opts);

  this.videoEl.muted = this.opts.micPlaybackMuted;

  this.audioContext = new AudioContext();

  navigator.getUserMedia({video: this.opts.video, audio: this.opts.audio}, 
    this._onMediaSuccess.bind(this), 
    this._onMediaError.bind(this));
}

_.extend(RTSee.prototype, {
  
  _onMediaSuccess: function (mediaStream) {
    this.stream = mediaStream;
    this.videoEl.src = window.URL.createObjectURL(this.stream);
    this.videoEl.play();
  },

  _onMediaError: function (err) {
    console.error(err);
  },

  captureScreenshot: function () {
    var canvas = document.createElement('canvas');

    var context = canvas.getContext('2d');
    canvas.width = this.videoEl.width;
    canvas.height = this.videoEl.height;

    context.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);
    
    var dataURL = canvas.toDataURL('image/png');
    
    var img = new Image();
    img.src = dataURL;

    return img;
  },

  toggleMicPlayback: function () {
    this.videoEl.muted = !this.videoEl.muted;
  },

  audioEffect: function () {
    var microphone = this.audioContext.createMediaStreamSource(this.stream);
    var analyser = this.audioContext.createAnalyser();
    microphone.connect(analyser);

    function process(){
        setInterval(function(){
            FFTData = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(FFTData);
            
            if (FFTData[0] > -90) {
              console.log(FFTData[0]);
            }
            
        },10);
    }

    process();
  }

});

module.exports = RTSee;