# Steps to complete the project
You will be provided code for a Node development server and a README for getting the server up and running locally on your computer. The README will also contain the API you will need to make JSON requests to the server. Once you have the server up, you will begin the work of improving your [Stage One](https://github.com/sherwino/wino-mws-restaurants) project code.

The core functionality of the application will not change for this stage. Only the source of the data will change. You will use the fetch() API to make requests to the server to populate the content of your Restaurant Reviews app.
Requirements

Use server data instead of local memory In the first version of the application, all of the data for the restaurants was stored in the local application. You will need to change this behavior so that you are pulling all of your data from the server instead, and using the response data to generate the restaurant information on the main page and the detail page.

Use IndexedDB to cache JSON responses In order to maintain offline use with the development server you will need to update the service worker to store the JSON received by your requests using the IndexedDB API. As with [Stage One](https://github.com/sherwino/wino-mws-restaurants), any page that has been visited by the user should be available offline, with data pulled from the shell database.

Meet the minimum performance requirements Once you have your app working with the server and working in offline mode, you’ll need to measure your site performance using [Lighthouse](https://developers.google.com/web/tools/lighthouse/).

[Lighthouse](https://developers.google.com/web/tools/lighthouse/) measures performance in four areas, but your review will focus on three:

    Progressive Web App score should be at 90 or better.
    Performance score should be at 70 or better.
    Accessibility score should be at 90 or better.

You can audit your site's performance with [Lighthouse](https://developers.google.com/web/tools/lighthouse/) by using the Audit tab of Chrome Dev Tools.

## Before Submitting

Make sure your code adheres to our HTML, CSS, JavaScript, and Git style guidelines.

- [Udacity's HTML Style Guide](//udacity.github.io/frontend-nanodegree-styleguide/index.html)
- [Udacity's CSS Style Guide](//udacity.github.io/frontend-nanodegree-styleguide/css.html)
- [Udacity's JavaScript Style Guide](//udacity.github.io/frontend-nanodegree-styleguide/javascript.html)
- [Udacity's Git Style Guide](./GIT.md)

We recommend using Git from the very beginning. Make sure to commit often and to use well-formatted commit messages that conform to our guidelines.

## How will this project be evaluated?

Your project will be evaluated by a Udacity Code Reviewer according to the [rubric](https://review.udacity.com/#!/rubrics/1090/view). Be sure to review it thoroughly before you submit. All criteria must "meet specifications" in order to pass.

The project rubric is your source of truth while building this project. Save it to your browser bookmarks so you can access it easily!
Task List

## Submission Instructions

1. Push your project to GitHub, making sure to push the master branch.
1. On the project submission page choose the option 'Submit with GitHub'
1. Select the repository for this project (you may need to connect your GitHub account first).

## Stuck? Got Questions?

If you are having any problems submitting your project or wish to check on the status of your submission, please email us at **support@udacity.com**.
