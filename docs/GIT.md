# Udacity Git Commit Message Style Guide

Main points to keep in mind, add a prefix to the commit message with the type.

### The Type

- feat: a new feature
- fix: a bug fix
- docs: changes to documentation
- style: formatting, missing semi colonds, etc (no code change)
- refactor: refactoring of production code
- test: adding tests, refactoring test. (no production code change)
- chore: updating build tasks, package manager configs, etc. (no production code change)

### Example Commit Message

```
feat: Summarize changes in around 50 characters or less

More detailed explanatory text, if necessary. Wrap it to about 72
characters or so. In some contexts, the first line is treated as the
subject of the commit and the rest of the text as the body. The
blank line separating the summary from the body is critical (unless
you omit the body entirely); various tools like `log`, `shortlog`
and `rebase` can get confused if you run the two together.

Explain the problem that this commit is solving. Focus on why you
are making this change as opposed to how (the code explains that).
Are there side effects or other unintuitive consequenses of this
change? Here's the place to explain them.

Further paragraphs come after blank lines.

 - Bullet points are okay, too

 - Typically a hyphen or asterisk is used for the bullet, preceded
   by a single space, with blank lines in between, but conventions
   vary here

If you use an issue tracker, put references to them at the bottom,
like this:

Resolves: #123
See also: #456, #789
```
