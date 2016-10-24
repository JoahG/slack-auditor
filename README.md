#:police_car: Slack Auditor

Slack app to log all team member logins to a slack channel of your choosing, or export all access log data from the beginning of time. Requires that you are an **admin** of a **paid** Slack team.

![screenshot of slack](https://github.com/JoahG/slack-auditor/blob/master/public/img/screenshot.png)

---

##Contributing

You can contribute to Slack Auditor by [opening a pull request](https://github.com/JoahG/slack-auditor/compare), or [an issue](https://github.com/JoahG/slack-auditor/issues/new)

##Development

Download the repository, and run the following to set up Slack Auditor locally:

```
$ npm install
$ npm start
```

You will have to have `client_secret` and `client_id` variables defined in your environment. The `dotenv` npm package is loaded by default, so you can create a `.env` file in the directory with your variables like so:

```
client_id=<CLIENT ID>
client_secret=<CLIENT SECRET>
```

##Author

Slack Auditor is written and maintained by Joah Gerstenberg ([@joahg](https://github.com/JoahG/)), copyright 2016, licensed under MIT public license.