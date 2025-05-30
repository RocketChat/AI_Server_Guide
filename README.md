<div align="center">
  <img width=30% src="https://github.com/user-attachments/assets/a92f27b9-5101-4725-8311-a0e6ada0edc7">
</div>

<h1 align="center">AI Server Guide Agent</h1>
New users end up in a Rocket.Chat server without guidance. A passive landing page simply doesn't work anymore , it's too easy to overlook, generic, and separate from user intent. That's where the AI Server Guide Agent enters the picture.
This smart Rocket.Chat app starts a tailored conversation with every new user, sorts their persona type (e.g. admin, end-user), and directs them to the most appropriate channels, resources, and communities in real-time.

<h2>🚀 Features</h2> <ul> <h2>🛠️ Admin Capabilities</h2>
Admins can configure the AI Guide Agent to deliver a streamlined onboarding and guidance experience. The following features are supported via conversational commands:

<ul> <li>🎉 <strong>Create a Welcome Message</strong> – Designate a welcoming, customizable message to be sent when new members join.</li> <li>📜 <strong>Set Server Rules & Etiquette</strong> – Present behavioral expectations and usage guidelines explicitly.</li> <li>📢 <strong>Suggest Recommended Channels</strong> – Set a list of public channels to be recommended to new users based on their persona.</li> <li>🔁 <strong>Assign Default Channels</strong> –  Auto-join users to default channels after classification or user confirmation.</li> <li>📚 <strong>Provide App & Feature Guides</strong> – Offer quick-start assistance for major Rocket.Chat apps and productivity tools.</li> <li>📊 <strong>Monitor Channel Activity</strong> –  Obtain a snapshot report of channels to assist admins in managing community flow.</li> </ul>
<h2>💬 What Users Can Ask</h2>
The AI Guide Agent responds to natural language queries like:

- “What should I do first?”

- “Show me the rules.”

- “Which channels should I join?”

- “Can you help me set up apps?”

- “Where do I report bugs?”


<h2 >⚙️ Installation </h2>

<ol>
  <li>Have a Rocket.Chat server ready. If you don't have a server, see this <a href="https://developer.rocket.chat/v1/docs/server-environment-setup">guide</a>.</li> 
  <li>Install the Rocket.Chat Apps Engline CLI. 

  ``` 
    npm install -g @rocket.chat/apps-cli
  ```

Verify if the CLI has been installed

  ```
  rc-apps -v
# @rocket.chat/apps-cli/1.4.0 darwin-x64 node-v10.15.3
  ```
  </li>
  <li>Clone the GitHub Repository</li>

 ```
    git clone https://github.com/RocketChat/AI_Server_Guide.git
 ```
  <li>Navigate to the repository</li>

 ```
    cd AI_Server_Guide
 ```

  <li>Install app dependencies</li>

  ```
     npm install
  ```

  <li>To install private Rocket.Chat Apps on your server, it must be in development mode. Enable Apps development mode by navigating to <i>Administration > General > Apps</i> and turn on "Enable development mode".</li>

  <li>Deploy the app to the server </li>

  ```
  rc-apps deploy --url <server_url> --username <username> --password <password>
  ```

- If you are running server locally, `server_url` is http://localhost:3000. If you are running in another port, change the 3000 to the appropriate port.
- `username` is the username of your admin user.
- `password` is the password of your admin user.

  <li> Open the App, by navigating to <i>Administration > Marketplace > Private Apps</i>. You should see the app listed there. Click on the App name to open the app.</li>

</ol>

## 🧑‍💻 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue.
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: adds some amazing feature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

## 📚 Resources

Here are some links to examples and documentation:

- [Rocket.Chat Apps TypeScript Definitions Documentation](https://rocketchat.github.io/Rocket.Chat.Apps-engine/)
- [Rocket.Chat Apps TypeScript Definitions Repository](https://github.com/RocketChat/Rocket.Chat.Apps-engine)
- Demo Apps
    - [DemoApp](https://github.com/RocketChat/Rocket.Chat.Demo.App)
    - [GithubApp](https://github.com/RocketChat/Apps.Github22)
- Community Forums
    - [App Requests](https://forums.rocket.chat/c/rocket-chat-apps/requests)
    - [App Guides](https://forums.rocket.chat/c/rocket-chat-apps/guides)
    - [#rocketchat-apps on Open.Rocket.Chat](https://open.rocket.chat/channel/rocketchat-apps)
