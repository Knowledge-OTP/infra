(function (angular) {
    'use strict';

    var mockENVServiceName = 'ENV';

    angular.module('env.mock', [])
        .service(mockENVServiceName, function () {
            return {
                "appName": "sat-app-web",
                "firebaseAppScopeName": "sat_app",
                "firebaseDashboardAppScopeName": "sat_dashboard",
                "fbGlobalEndPoint": "https://znk-dev.firebaseio.com/",
                "fbDataEndPoint": "https://sat-dev.firebaseio.com/",
                "gaTrackingId": "",
                "mixpanelId": "e458b332bfcffeb0c4a83612a061c2e0",
                "atatusApiKey": "78d05e58d63c4a959fc94dcc482af9ed",
                "enableAtatusLog": true,
                "debug": true,
                "enableAnalytics": false,
                "segment_io_key": "",
                "backendEndpoint": "https://znk-web-backend-dev.azurewebsites.net/",
                "dataAuthSecret": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoicmFjY29vbnMifQ.mqdcwRt0W5v5QqfzVUBfUcQarD0IojEFNisP-SNIFLM",
                "promiseTimeOut": 15000,
                "dreamSchoolJsonUrl": "/assets/json/dreamSchools.json",
                "facebookAppId": "1624086287830120",
                "googleAppId": "1008364992567-hpchkt4nuo4eosjfrbpqrm1ruamg62nj.apps.googleusercontent.com",
                "doorbellApiKey": "44D4VA8hGpMjLAXnqLFDdtIRxqRFZkesEp8jwZ5WgCm9W5UCZ9kmZeVtHHp0KF8D",
                "doorbellId": "3084",
                "doorBellSubmitURL": "https://doorbell.io/api/applications/3084/submit?key=44D4VA8hGpMjLAXnqLFDdtIRxqRFZkesEp8jwZ5WgCm9W5UCZ9kmZeVtHHp0KF8D",
                "purchasePaypalParams": {
                    "formAction": "https://www.sandbox.paypal.com/cgi-bin/webscr",
                    "hostedButtonId": "J2J2GMDNZCMBU",
                    "btnImgSrc": "https://www.sandbox.paypal.com/en_US/i/btn/btn_buynow_LG.gif",
                    "pixelGifSrc": "https://www.sandbox.paypal.com/en_US/i/scr/pixel.gif"
                },
                "zinkerzWebsiteBaseUrl": "//dev.zinkerz.com/",
                "zinkezWebsiteUrl": "//dev.zinkerz.com/sat",
                "actDashboardWebSiteUrl": "//dev.zinkerz.com/sat-educator/",
                "videosEndPoint": "//dfz02hjbsqn5e.cloudfront.net/sat_app",
                "enforceZinkerzDomainSignup": true,
                "redirectLogout": "//dev.zinkerz.com/sat",
                "redirectLogin": "//dev.zinkerz.com/sat/web-app",
                "redirectSignup": "//dev.zinkerz.com/sat/web-app",
                "welcomeBackHintInDays": 5,
                "dashboardFeatureEnabled": true,
                "version": "1.0.0",
                "appContext": "student",
                "studentAppName": "sat_app",
                "dashboardAppName": "sat_dashboard",
                "userIdleTime": 300,
                "idleTimeout": 0,
                "idleKeepalive": 2,
                "teachworksDataUrl": "teachworks",
                "plivoUsername": "ZinkerzDev160731091034",
                "plivoPassword": "zinkerz$9999",
                "mediaEndpoint": "//dfz02hjbsqn5e.cloudfront.net",
                "supportEmail": "support@zinkerz.com",
                "baseUrl": "//d3jxtcmovrviy3.cloudfront.net",
                "liveSession": {
                    "sessionLength": 45,
                    "sessionExtendTime": 15,
                    "sessionEndAlertTime": 5
                }
            };
        });
})(angular);
