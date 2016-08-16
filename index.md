# Weighin!

Get information about the minified/gzipped "weight" of your front-end project.

Weighin offers a badge you can add to you `README.md` file which will show an
always up to date report of the minified/gzipped size of your build.

## How it works

Weighin consists of a small reporter command line tool which you run as part of
your TravisCI tests. This tool will report the weight of your package to our
server, enabling us to show the current weight of your master branch's build.

## Getting started

First install `weighin-cli` for your project:

    npm install --save-dev weighin-cli

Then add to your `package.json`:

    {
        "scripts": {
            "report-weight": "weighin < path/to/your/build.js"
        }

Then add to your `.travis.yml`:

    after_script: "npm run report-weight"

Finally, add the following to your project's `README.md` (being sure to replace
`<username>` and `<repository_name>` with your project's GitHub
username/repository:

    ![Current Weight](https://weighin.jordaneldredge.com/<username>/<repository_name>.svg)

The next time you update your `master` branch, you will see your project's
current weight reported at the top of your Readme!

## Example

For a working example, see:

https://github.com/captbaritone/weighin-test/
