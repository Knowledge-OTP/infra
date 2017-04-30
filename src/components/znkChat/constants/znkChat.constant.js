(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').constant('ZNK_CHAT', {
        MAX_NUM_UNSEEN_MESSAGES: 10,
        SUPPORT_EMAIL: 'support@zinkerz.com',
        STUDENT_STORAGE: 0,
        TEACHER_STORAGE: 1,
        SOUND_PATH: '/assets/sounds/'
    });
})(angular);
