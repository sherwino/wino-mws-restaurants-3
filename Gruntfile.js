"user strict";

module.exports = function(grunt) {
  grunt.initConfig({
    responsive_images: {
        myTask: {
            options: {
              sizes: [
                {
                  name: "large",
                  width: 1024,
                //   suffix: "-large",
                  quality: 80
                },
                {
                  name: "medium",
                  width: 800,
                //   suffix: "-medium",
                  quality: 80
                },
                {
                  name: "small",
                  width: 320,
                //   suffix: "-small",
                  quality: 60
                }
              ]
            },
            files: [
              {
                expand: true,
                cwd: "./src/img",
                src: ["**.{jpg,gif,png}"],
                dest: "./src/img/"
              }
            ]
        }
    }
  });
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-responsive-images');

    // Default task(s).
    grunt.registerTask('default', ['responsive_images']);
};
