export enum MessageEnum {
    WELCOMING_MESSAGE = `
        Thank you for installing the App !

        Setting up the AI-driven assistant is quick and easy.Let's get your Server Guide AI Agent all set up.
        Please let me know how you'd like to configure the assistant, and I’ll guide you through it step by step.
    `,
    INSTRUCTION_TEXT = `
        Here are your options please select what you would like to do:

        1. **Create a welcome message** for new users.
        2. **Set up server rules and etiquette**.
        3. **Suggest channels** new users should check out.
        4. **Specify default channels** that users should automatically join.

        **Please remember**, I’m here to help you through this process! 🙌 Be as specific as possible with your responses, and I’ll make sure everything is configured just the way you want.
		Here’s a simple example :

        - Instead of saying "Say something nice," try **"Display: 'Welcome to Rocket.Chat! We’re excited to have you here!'"**
        - Instead of "Server rules," try **"Display: 'No spamming, Be kind, Follow the topic of each channel.'"**

        **A little tip**: The more specific you can be with your responses, the better I can help you! 😊`,
    APP_INSTALLED_TEXT = `Server Guide AI Agent Installed Successfully 🤖`,
    API_KEY_MISSING_TEXT = `API key is missing please configure from the settings`,
    MESSAGE_PROCESSING_ERROR = 'Sorry! I was unable to process your request.',
}
