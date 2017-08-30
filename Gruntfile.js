module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        concat: {
            options: {
                separator: ';',
            },
            dist: {
                src: [
                    'src/widgets/tsdash-swimlanes.js',
                    'src/widgets/tsdash-sparklinetable.js'
                ],
                dest: 'build/tsdash-widgets.js',
            },
        },
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> */\n'
            },
            build: {
                files: [{
                    //'build/<%= pkg.name %>.min.js': ['src/<%= pkg.name %>.js'],
                    'build/<%= pkg.name %>-utils.min.js': ['src/<%= pkg.name %>-utils.js'],
                    'build/<%= pkg.name %>-widgets.min.js': ['build/<%= pkg.name %>-widgets.js']
                }]
            }
        },
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: ['*.css'],
                    dest: 'build',
                    ext: '.min.css'
                }]
            }
        },
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Default task(s).
    grunt.registerTask("default", ["concat", "uglify", "cssmin"]);

};
