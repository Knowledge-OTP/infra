// Generated on 2015-08-18 using generator-angular 0.12.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Automatically load required Grunt tasks
    require('jit-grunt')(grunt, {
        useminPrepare: 'grunt-usemin',
        ngtemplates: 'grunt-angular-templates',
        cdnify: 'grunt-google-cdn'
    });

    // Configurable paths for the application
    var appConfig = {
        src: 'src',
        dist: 'dist',
        appName: 'znk.infra'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: appConfig,
        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.src %>/**/*.js'
                ]
            },
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Automatically inject Bower components into the app
        wiredep: {
            demo:{
                src: 'demo/**/index.html'
            },
            test: {
                devDependencies: true,
                src: '<%= karma.unit.configFile %>',
                ignorePath: /\.\.\//,
                fileTypes: {
                    js: {
                        block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
                        detect: {
                            js: /'(.*\.js)'/gi
                        },
                        replace: {
                            js: '\'{{filePath}}\','
                        }
                    }
                }
            }
        },
        concat: {
            dist: {
                src: ['<%= yeoman.src %>/core/*.js', '<%= yeoman.src %>/components/**/module.js', '<%= yeoman.src %>/components/**/*.js','.tmp/*.js'],
                dest: '<%= yeoman.dist %>/<%= yeoman.appName %>.js'
            }
        },
        uglify: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/<%= yeoman.appName %>.min.js': '<%= yeoman.dist %>/<%= yeoman.appName %>.js'
                }
            }
        },
        // ng-annotate tries to make the code safe for minification automatically
        // by using the Angular long form for dependency injection.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: '*.js',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },
        // Test settings
        karma: {
            unit: {
                browsers: [
                    'Chrome',
                    'Safari'
                ],
                configFile: 'test/karma-unit.conf.js'
            },
            ci: {
                configFile: 'test/karma-unit.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            },
            build: {
                configFile: 'test/karma-unit.conf.js',
                singleRun: true,
                browsers: [
                    'Chrome'

                ]
            }
        },
        connect: {
            options: {
                base: ['src','bower_components','.tmp'],
                open: true,
                livereload: 35730
            },
            serve: {
                options: {
                    port: 9001
                }
            }
        },
        watch: {
            options: {
                livereload: '<%= connect.options.livereload %>'
            },
            sourceJS: {
                files: [
                    'src/**/*.js'
                ]
            },
            demo: {
                files: [
                    'demo/**/*.*'
                ]
            },
            sass: {
                files:[
                    'src/**/*.scss',
                ],
                tasks: ['sass']
            }
        },
        sass: {
            options: {
                sourceMap: true
            },
            dist: {
                files: {
                    '.tmp/main.css': 'src/core/scss/main.scss'
                }
            }
        },
        copy: {
            dist: {
                src: '.tmp/main.css',
                dest: 'dist/znk-infra-main.css'
            }
        },
        html2js: {
            options:{
                module: 'znk.infra',
                singleModule: true,
                existingModule: true
            },
            main: {
                src: ['src/**/*.html','src/**/*.svg'],
                dest: '.tmp/templates.js'
            }
        }
    });

    grunt.registerTask('test', [
        'wiredep',
        'karma:unit'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'jshint:all',
        'karma:build',
        'sass',
        'html2js',
        'copy:dist',
        'concat:dist',
        'ngAnnotate:dist',
        'uglify:dist'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);

    grunt.registerTask('ci',function(){
      grunt.task.run([
        'jshint:all',
        'karma:ci'
      ]);
  });

    grunt.registerTask('serve', function (component) {
        if (component) {
            var additionalBase = 'demo/' + component;
            console.log('serving also from', additionalBase);
            var connectConfig = grunt.config('connect');
            connectConfig.options.base.push(additionalBase);
            grunt.config('connect', connectConfig);
        }
        console.log('serving from', grunt.config('connect').options.base);
        grunt.task.run([
            'sass',
            'connect:serve',
            'watch'
        ]);
    });
};
