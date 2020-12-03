define([
    'faceApi',
    'jquery',
    'underscore',
    'domReady!'
], function jsAuth(
    faceApi,
    jQuery,
    _
) {

    'use strict';

    window.faceApp = {
        running: false,
        faceDetected: false,
        base64Image: null,
        config: {}
    }
    var video = document.getElementById('main-video');

    var Utils = {
        makeCallToApi: function makeCallToApi() {
            var settings = {
                "async": true,
                "crossDomain": true,
                "dataType": "json",
                "url": window.faceApp.config.luxandApiUrl,
                "method": "POST",
                "headers": {
                    "token": window.faceApp.config.luxandToken
                },
                "data": {"photo": window.faceApp.base64Image }
            }
            jQuery('#person-image').attr('src', 'data:image/png;base64,' + window.faceApp.base64Image)
            jQuery.ajax(settings)
                .done(function(response) {
                    Utils.handleResponseApi(response);
                })
                .error(function (error) {
                    Utils.showError();
                })
                .then(function () {
                    window.faceApp.faceDetected = false;
                    jQuery('#video-header-card').text('Video');
                });
        },

        showPerson: function showPerson(person) {
            try {
                var data = JSON.parse(person.name);
                jQuery('#person-name').html(data.name);
                jQuery('#person-ci').html(data.ci);
                jQuery('#person-email').html(data.email);
            } catch (e) {
                console.log(e)
            }
            return null;
        },

        handleResponseApi: function handleResponseApi(response) {
            var person;
            var personArray;
            if (Array.isArray(response)) {
                personArray = response.filter(person => person.probability > 0.9);
                if (personArray) {
                    person = personArray && personArray[0];
                    if (person) {
                        return Utils.showPerson(person);
                    }
                }
            }
            jQuery('#video-header-card').text('Hubo un problema con el reconocimiento...');
        },
        showError: function showError(error) {
            console.error(error);
        },

        getImageFromVideo: function getImageFromVideo() {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')
                .drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL().replace('data:image/png;base64,', '');
        },

        initListeners: function initListeners() {
            jQuery('[data-action="toggleRecognition"]').click(_.bind(Utils.toggleRecognition, Utils));
        },

        toggleRecognition: function toggleRecognition() {
            if (!window.faceApp.running) {
                window.faceApp.running = true;
                this.initFaceDetection()
            }
        },

        initFaceDetection: async function initFaceDetection() {
            const canvas = faceApi.createCanvasFromMedia(video);
            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            var detections = null;
            var resizedDetections;

            faceApi.matchDimensions(canvas, displaySize);
            while (!window.faceApp.faceDetected) {
                jQuery('#video-header-card').text('Detectando...');
                detections = await faceApi.detectSingleFace(video, new faceApi.TinyFaceDetectorOptions());
                if (detections) {
                    resizedDetections = faceApi.resizeResults(detections, displaySize);
                    if (detections.score > 0.8) {
                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        faceApi.draw.drawDetections(canvas, resizedDetections);

                        window.faceApp.faceDetected = true;
                        window.faceApp.running = false;
                        window.faceApp.base64Image = Utils.getImageFromVideo();
                        jQuery('#video-header-card').text('Identificando...');
                        Utils.makeCallToApi();
                    }
                }
                setTimeout(function () {
                }, 100);
            }
        },

        initVideo: function initVideo(video) {
            navigator.getUserMedia(
                { video: {} },
                function (stream) {
                    video.srcObject = stream;
                    Utils.initListeners();
                },
                err => console.error(err)
            );
        },

        initApp: function initApp(config) {
            return Promise.all([
                faceApi.nets.tinyFaceDetector.loadFromUri(config.assetBaseUrl + '/models'),
                faceApi.nets.faceLandmark68Net.loadFromUri(config.assetBaseUrl + '/models'),
                faceApi.nets.faceRecognitionNet.loadFromUri(config.assetBaseUrl + '/models')
            ]).then(function () {
                Utils.initVideo(video);
            });
        }
    };

    return function (config) {
        window.faceApp.config = config;
        Utils.initApp(config);
    };

})
