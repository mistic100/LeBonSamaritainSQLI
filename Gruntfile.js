module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            dist: {
                files: {
                    'public/all.js': [
                        'public/assets/jquery/dist/jquery.js',
                        'public/assets/angular/angular.js',
                        'public/assets/angular-sanitize/angular-sanitize.js',
                        'public/assets/angular-strap/dist/angular-strap.js',
                        'public/assets/angular-strap/dist/angular-strap.tpl.js',
                        'public/assets/angular-socket-io/socket.min.js', // use already minified version
                        'public/assets/perfect-scrollbar/src/jquery.mousewheel.js',
                        'public/assets/perfect-scrollbar/src/perfect-scrollbar.js',
                        'public/assets/angular-perfect-scrollbar/src/angular-perfect-scrollbar.js',
                        'public/assets/angular-smilies/dist/angular-smilies.js',
                        'public/assets/moment/moment.js',
                        'public/assets/moment/lang/fr.js',
                        'public/assets/angular-moment/angular-moment.js',
                        'public/assets/d3/d3.js',
                        'public/js/graph.js',
                        'public/js/app.js',
                    ],
                    
                    'public/all.css': [
                        'public/assets/bootstrap/dist/css/bootstrap-theme.css',
                        'public/assets/perfect-scrollbar/src/perfect-scrollbar.css',
                        'public/assets/angular-smilies/dist/angular-smilies-embed.css',
                        'public/css/app.css',
                    ]
                }
            }
        },
        
        uglify: {
            dist: {
                files: {
                    'public/all.min.js': [
                      'public/all.js'
                    ]
                }
            }
        },

        cssmin: {
            options: {
                keepSpecialComments: 0
            },
            dist: {
                files: {
                    'public/all.min.css': [
                      'public/all.css'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', [
        'concat',
        'uglify',
        'cssmin'
    ]);
};