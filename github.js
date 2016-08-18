var GitHub = require('github-api');

function comment(owner, repo, pull, message) {
    // token auth
    var gh = new GitHub({
        token: process.env.GITHUB_TOKEN
    });
    gh.getIssues(owner, repo).createIssueComment(pull, message);
}

module.exports = {
    comment: comment
};
