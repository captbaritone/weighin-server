var GitHub = require('github-api');

function comment(owner, repo, pull, message) {
    // token auth
    var gh = new GitHub({
        token: process.env.GITHUB_TOKEN
    });
    console.log('commenting:', owner, repo, pull, message);
    gh.getIssues(owner, repo).createIssueComment(pull, message, function(error, result, request) {
        // TODO: Handle errors
    });
}

module.exports = {
    comment: comment
};
