define([
    'faceApi',
    'jquery',
    'vue',
    'domReady!'
], function jsAuth(
    faceApi,
    jQuery,
    Vue
) {

    'use strict';


    return function (config) {
        const vueApp = new Vue({
            el: '#appvue',
            mounted: function mounted() {
                const self = this;
                this.video = document.getElementById('main-video');
                this.isLoadinLibraries = true;
                return Promise.all([
                    faceApi.nets.tinyFaceDetector.loadFromUri(self.config.assetBaseUrl + '/models'),
                    faceApi.nets.faceLandmark68Net.loadFromUri(self.config.assetBaseUrl + '/models'),
                    faceApi.nets.faceRecognitionNet.loadFromUri(self.config.assetBaseUrl + '/models')
                ]).then(function () {
                    self.isLoadinLibraries = false;
                    self.initVideo();
                });
            },
            data: {
                isLoadinLibraries: false,
                config: config,
                video: null,
                isDetecting: false,
                isIdentifying: false,
                isRegistering: false,
                faceDetected: null,
                identifiedPerson: null,
                isSucessfullyRegister: null,
                info: { msg: 'Bienvenido', type: 'primary' }
            },
            computed: {
                isProcessing: function  isProcessing () {
                    return this.isLoadinLibraries || 
                            this.isDetecting ||
                            this.isIdentifying ||
                            this.isRegistering;
                },
                isSucessfullyIdentify: function isSucessfullyIdentify() {
                    return !this.isProcessing && 
                            this.identifiedPerson;
                }
            },
            watch: {
                isDetecting: function faceDetected(newValue) {
                   this.info = Object.assign({}, {
                        msg: 'Detectando...', 
                        type: 'warning' ,
                        showSpinner: true
                   }) 
                },
                isIdentifying: function isIdentifying() {
                    this.info = Object.assign({}, {
                        msg: 'Identificando...', 
                        type: 'warning',
                        showSpinner: true
                    }) 
                },
                isRegistering: function isRegistering() {
                    this.info = Object.assign({}, {
                        msg: 'Registrando el acceso...', 
                        type: 'warning',
                        showSpinner: true
                    });
                },
                isSucessfullyIdentify: function isSucessfullyIdentify() {
                    if (this.isSucessfullyIdentify) {
                        this.info = Object.assign({}, {
                            msg: 'Bienvenido ' + this.identifiedPerson.name , 
                            type: 'success' 
                        });
                    }
                },
                isSucessfullyRegister: function isSucessfullyRegister(newValue) {
                    if (newValue === false) {
                        this.info = Object.assign({}, {
                            msg: 'Error registrando el usuario intente nuevamente.', 
                            type: 'danger' 
                        });
                    }
                    if (newValue === true) {
                        this.info = Object.assign({}, {
                            msg: 'Registro de acceso exitoso.', 
                            type: 'success' 
                        });
                    }
                },
                identifiedPerson: function identifiedPerson(newValue) {
                    if (newValue === false) {
                        this.info = Object.assign({}, {
                            msg: 'No se pudo identificar al usuario, intente nuevamente.', 
                            type: 'danger' 
                        });
                    }
                }
                
            },
            
            methods: {
                resetValues: function resetValues() {
                    this.isDetecting = false;
                    this.isIdentifying = false;
                    this.isRegistering = false;
                    this.faceDetected = null;
                    this.identifiedPerson = null;
                    this.info = { msg: 'Bienvenido', type: 'primary' };
                    return null;
                },

                initFaceDetection: async function initFaceDetection() {
                    const canvas = faceApi.createCanvasFromMedia(this.video);
                    const displaySize = { 
                        width: this.video.videoWidth, 
                        height: this.video.videoHeight 
                    };
                    const self = this;
                    var detections = null;
                    var resizedDetections;
                    

                    this.isDetecting = true;
                    this.isIdentifying = false;
                    this.isRegistering = false;
                    this.faceDetected = null;
                    this.identifiedPerson = null;
        
                    faceApi.matchDimensions(canvas, displaySize);
                    while (!self.faceDetected) {
                        
                        detections = await faceApi.detectSingleFace(this.video, new faceApi.TinyFaceDetectorOptions());
                        
                        if (detections) {
                            resizedDetections = faceApi.resizeResults(detections, displaySize);
                            if (detections.score > 0.9) {
                                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                                faceApi.draw.drawDetections(canvas, resizedDetections);
                                self.faceDetected = self.getImageFromVideo();
                                self.isDetecting = false;
                                self.isIdentifying = true;
                                self.checkFaceWithLuxand();
                            }
                        }
                        setTimeout(function () {
                        }, 100);
                    }
                },
                initVideo: function initVideo() {
                    var self = this; 
                    return navigator.getUserMedia(
                        { video: {} },
                        function (stream) {
                            self.video.srcObject = stream;
                        },
                        err => console.error(err)
                    );
                },
                getImageFromVideo: function getImageFromVideo() {
                    const canvas = document.createElement('canvas');
                    canvas.width = this.video.videoWidth;
                    canvas.height = this.video.videoHeight;
                    canvas.getContext('2d')
                        .drawImage(this.video, 0, 0, canvas.width, canvas.height);
                    return canvas.toDataURL().replace('data:image/png;base64,', '');
                },
                checkFaceWithLuxand: function checkFaceWithLuxand() {
                    const self = this;
                    var settings = {
                        "async": true,
                        "crossDomain": true,
                        "dataType": "json",
                        "url": this.config.luxandApiUrl,
                        "method": "POST",
                        "headers": {
                            "token": this.config.luxandToken
                        },
                        "data": {"photo": this.faceDetected }
                    }
                    return jQuery.ajax(settings)
                        .done(function(response) {
                            self.identifiedPerson = self.handleResponseApi(response);
                            self.isIdentifying = false;
                        })
                        .always(function() {
                            self.isIdentifying = false;
                        });
                },
                handleResponseApi: function handleResponseApi(response) {
                    var personArray;
                    var person;
                    try {
                        if (Array.isArray(response)) {
                            personArray = response.filter(person => person.probability > 0.9);
                            if (personArray) {
                                person = personArray && personArray[0] && JSON.parse(personArray[0].name);
                                person.image64 = this.faceDetected;
                                return person;
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                    return false;
                },
                accessRegister: function accessRegister() {
                    const settings = {
                        "async": true,
                        "dataType": "json",
                        "url": this.config.registerUrl,
                        "method": "POST",
                        "data": { "customer_id": this.identifiedPerson.id }
                    }
                    const self = this;
                    this.isRegistering = true;
                    return jQuery.ajax(settings)
                        .done(function (response) {
                            self.isSucessfullyRegister = response && response.success;
                        })
                        .fail(function () {
                            self.isSucessfullyRegister = false;
                        })
                        .always(function() {
                            self.isRegistering = false;
                        })
                }
            }
         });
    };

})
