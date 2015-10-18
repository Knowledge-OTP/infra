// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-02-10 using
// generator-karma 0.9.0

module.exports = function (config) {
    'use strict';

    config.set({
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        usePolling: true,

        // base path, that will be used to resolve files and exclude
        basePath: '../',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            // bower:js
            'bower_components/jquery/dist/jquery.js',
            'bower_components/angular/angular.js',
            'bower_components/waypoints/waypoints.js',
            'bower_components/SHA-1/sha1.js',
            'bower_components/angulartics/src/angulartics.js',
            'bower_components/angulartics/src/angulartics-ga-cordova.js',
            'bower_components/angulartics/src/angulartics-segmentio.js',
            'bower_components/angulartics/src/angulartics-mixpanel.js',
            'bower_components/angular-animate/angular-animate.js',
            'bower_components/angular-sanitize/angular-sanitize.js',
            'bower_components/angular-ui-router/release/angular-ui-router.js',
            'bower_components/ionic/release/js/ionic.js',
            'bower_components/ionic/release/js/ionic-angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            // endbower

            //utility
            'test/utility/**/*.*',

            //mock
            'test/mock/**/*.*',
            //src files
            'src/scripts/core/*.*',
            'src/scripts/*.*',

            //tests
            'test/spec/**/*.test.js'
        ],

        // list of files / patterns to exclude
        exclude: [],

        // web server port
        port: 8080,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [
            'Chrome',
            'Safari'
        ],

        // Which plugins to enable
        plugins: [
            'karma-chrome-launcher',
            'karma-safari-launcher',
            'karma-jasmine',
            'karma-jasmine-html-reporter'
        ],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,

        colors: true,
        preprocessors: {},
        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,
        //html to js
        reporters: ['progress', 'html']
    });
};