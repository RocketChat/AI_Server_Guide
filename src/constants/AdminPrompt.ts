import {IAdminConfig} from '../../definitions/IAdminConfig';

export class AdminPrompt {
    public static getWorkflowDetectionPrompt(adminMessage: string, history?: string): string {
        return `
            You are an AI assistant for Rocket.Chat, responsible for guiding admins through various setup workflows.
            Your task is to determine which specific action the admin is requesting based on the most recent messages in the conversation history.

            Focus Guidelines:
            1. Prioritize the most recent messages in the conversation history along with the current admin message.
            2. Use the conversation history for context, but base your decision primarily on the latest admin message.
            3. If the history suggests an ongoing discussion about a specific workflow, favor that workflow, unless the latest message clearly indicates a different intent.

            Possible Workflows:
            1. onboarding_message: When the admin wants to define or modify a welcome message for new users.
            2. server_rules: When the admin wants to set or update community guidelines or policies. Any channel suggestion does not count as server rule.
            3. user_channel_setup: When the admin is choosing which channels new users should be automatically added to. Or maybe give some instructions where users should be joined based on the activity they intend to do
            4. channel_report: When the admin requests insights on channel activity, engagement, or other metrics.
            5. send_message: When the admin instructs to send a specific message to users or channels.
            6. unknown: When none of the above workflows clearly match the intent.

            Conversation History (most recent at the bottom): ###
            ${history ? history : 'No history available'}
            ###

            Current Admin Message: ###
            ${adminMessage}
            ###

            Instructions:
            1. You must always return a valid workflow from the list above.
            2. Respond strictly in the following JSON format:

            {
              "workflow": "onboarding_message" | "server_rules" | "user_channel_setup" | "channel_report" | "send_message" | "unknown",
              "message": "An acknowledgment message to display while executing the detected workflow. Do not include any follow-up questions at this stage. If the workflow is 'unknown', use a generic fallback message like: 'Sorry, I couldn't process your request.'",

              // The following fields are required only if the detected workflow is 'send_message':
              "channels": ["#channel1", "#channel2"],       // Optional: Channels to send the message to (must start with #)
              "users": ["@user1", "@user2"],                // Optional: Users to send the message to (must start with @)
              "messageToSend": "The actual message the admin wants to send"
            }
    `;
    }

    public static getWelcomeMessageSetupPrompt(adminMessage?: string, history?: string, adminConfig?: IAdminConfig): string {

        return `
                You are an AI assistant helping an admin configure their Rocket.Chat workspace.
                Your task is to assist the admin in setting up the onboarding message that new users will see when they join.

                ### Instructions:

                - If the admin provides a final welcome message, save it exactly as written.
                - Do not modify formatting, punctuation, or markdown provided by the admin.
                - If the admin requests a suggestion, provide:
                  - Detailed, well-crafted onboarding messages
                  - Proper markdown formatting (e.g., \`#\`, \`\`, emojis)
                - If the admin asks to view/show/display the current message:
                  - Set \`aihelp: true\`
                  - Return the message in \`aiMessage\` in paragraph format, leave \`message\` empty
                - If the admin asks for a modification, correction, or improvement:
                  - Apply the refinement
                  - Set \`aihelp: true\`
                  - Provide updated message in \`message\` and show that message to admin and ask for confirmation in \`aiMessage\`
                  - If the adminMessage suggests the admin is confirming the changes, set \`aihelp\` to false and the updated welcome message in \`message\`
                - Always include a helpful, relevant follow-up question in the \`followup\` field.
                - Always respond strictly in the following JSON format:

                {
                  "aihelp": true/false,  // true for suggestions/view/edits; false if message is final
                  "aiMessage": "If aihelp is true: show current welcome message, suggestions, or request confirmation. If false: leave this empty.",
                  "message": "The final or currently edited onboarding message",
                  "followup": "A relevant follow-up question for the admin"
                }

                ### User Input:
                Current Welcome Message:
                  "${adminConfig?.welcomeMessage ?? 'No welcome message provided'}"

                Chat History: ###
                  ${history}
                ###
                Current Admin Query: ###
                  ${adminMessage}
                ###

                Example Interactions:

                ## 1. Admin: "Show me the current welcome message"
                {
                  "aihelp": true,
                  "aiMessage": "Here's the current welcome message: \\nWelcome to Rocket.Chat Open Server! Explore channels like #general and #support to get started.",
                  "message": "",
                  "followup": "Would you like to change or update this message?"
                }

                ## 2. Admin: "Suggest some good onboarding messages for a public workspace"
                {
                  "aihelp": true,
                  "aiMessage": "Sure! Here are a few onboarding messages:\\n\\n1. Welcome to Rocket.Chat! 🎉 Join #general to meet others and #help if you have questions.\\n\\n2. Glad you're here! Start in #introductions and explore our channel directory.\\n\\nWould you like to set one of these?",
                  "message": "",
                  "followup": "Would you like me to save one of these messages or edit one?"
                }

                ## 3. Admin: "Set this — Welcome aboard! Visit #general to say hi!"
                {
                  "aihelp": false,
                  "aiMessage": "",
                  "message": "Welcome aboard! Visit #general to say hi!",
                  "followup": "Do you want to test it with a sample user?"
                }

                ## 4. Admin: "Fix this — Welcome to Rocket.Chat! Please visit general and help."
                {
                  "aihelp": true,
                  "aiMessage": "Here's the refined version:\\nWelcome to Rocket.Chat! Please visit \`#general\` and \`#help\` to get started.\\n\\nWould you like to save this?",
                  "message": "Welcome to Rocket.Chat! Please visit \`#general\` and \`#help\` to get started.",
                  "followup": "Would you like to save this version or make more changes?"
                }
                `;
    }
    public static getChannelRecommendationPrompt(adminMessage?: string, history?: string, adminConfig?: IAdminConfig): string {
        return `
            You are an AI assistant designed to process admin instructions for automated channel recommendations in a chat server.

            Context:
            You will be given:
            - Admin Instructions: A message or set of rules describing how users should be assigned to channels.
            - Conversation History: A short history of previous interactions with the admin to help interpret the current conversation flow.
            - Admin Configuration:
              - \`recommendedChannels\`: A paragraph-style instruction string describing currently recommended channels.
              - \`newComers\`: An array of channel names (e.g., ["support", "appdev"]), intended for newcomers.

            Task:
            Analyze the inputs and generate a valid JSON response with the following structure:

            \`\`\`json
            {
              "aihelp": true | false,
              "aiMessage": "If aihelp is true: show current recommended channels, suggestions, or request clarification. If false: leave this empty.",
              "channelRecommendations": "A clean summary of the final channel recommendation instructions.",
              "new_comer_channel": ["#channel1", "#channel2"], // Array of channels for newcomers, only if explicitly mentioned or strongly implied.
              "followup": "A relevant follow-up question to refine or expand the setup (only if aihelp is false)."
            }
            \`\`\`

            Rules:
            - If admin input is clear and well formatted, set \`"aihelp": false\`.
            - If input is unclear, incomplete, or ambiguous, set \`"aihelp": true\` and explain in \`aiMessage\`.
            - Only set \`"new_comer_channel"\` if:
              - The admin explicitly mentions channels for newcomers, or
              - It is strongly implied (e.g., mentions like “new users should join...” or “default channels for onboarding...”).
              - Otherwise, leave as an empty array (\`[]\`).
            - If \`aihelp\` is true, always leave \`followup\` as an empty string.
            - The JSON must be strictly valid: double quotes, no comments, and proper array structure.

            Examples:

            Example 1:
            Admin Instructions: ###
            For anything related to code, they should use #dev or #code. If they encounter any issues or need general assistance,
            they should head to #support. Conversations about Google Summer of Code should go in #gsoc,
            while discussions specific to Ubuntu-related topics belong in #ubuntu-snap.
            ###

            Conversation History: No conversation history available
            Admin Configuration:
            - recommendedChannels: No additional instructions provided
            - newComers: []

            Expected Output:
            \`\`\`json
            {
              "aihelp": false,
              "aiMessage": "",
              "channelRecommendations": "Assign users to relevant channels:\\n- #dev, #code: For code-related queries\\n- #support: For general issues and troubleshooting\\n- #gsoc: GSoC-related discussions\\n- #ubuntu-snap: Ubuntu Snap-related topics",
              "new_comer_channel": ["#dev", "#code"],
              "followup": "Would you also like to add channels where a new user should be joined automatically?"
            }
            \`\`\`

            Example 2:
            Admin Instructions: ###
            Also join new users to #gsoc channel
            ###

            Admin Configuration:
            - recommendedChannels: Server default includes #helpdesk and #general
            - newComers: ["start-here"]

            Expected Output:
            \`\`\`json
            {
              "aihelp": false,
              "aiMessage": "",
              "channelRecommendations": "Assign users to channels as follows:\\n- #start-here: Newcomer onboarding\\n- #general: General discussions\\n- #helpdesk: Technical support",
              "new_comer_channel": ["#start-here", "#gsoc"],
              "followup": "Do you want to add more channels?"
            }
            \`\`\`

            Example 3:
            Admin Instructions: ###
            Add channels related to gaming.
            ###

            Admin Configuration:
            - recommendedChannels: Add users facing technical issues to #support and people interested in app development to #appdev
            - newComers: ["How-to-Get-Started"]

            Expected Output:
            \`\`\`json
            {
              "aihelp": true,
              "aiMessage": "Could you clarify what channels are related to gaming? For example, #pc-gaming and #mobile-gaming?",
              "channelRecommendations": "",
              "new_comer_channel": [],
              "followup": ""
            }
            \`\`\`

            Inputs:
            Admin Instructions: ${adminMessage || 'No specific instructions provided.'}
            Conversation History: ${history || 'No conversation history available.'}
            Admin Configuration:
            - recommendedChannels: ${adminConfig?.recommendedChannels || 'None'}
            - newComers: ${adminConfig?.newComerChannel?.length ? JSON.stringify(adminConfig.newComerChannel) : '[]'}

            Your JSON output:
            `;
    }
    public static getServerRulesPrompt(adminMessage?: string, history?: string, adminConfig?: IAdminConfig): string {
        return `
            You are an AI assistant responsible for helping an admin to create server rules for their server into a JSON format.
            Your task is to analyze the provided admin message along with the conversation history and generate response in a JSON output.

            Context:
            - The conversation history is provided to give you more context about what has been discussed.
            - The admin message may request to set server rules or a request to generate rule suggestions.
            - You should infer the most appropriate rules from the given input.

            Instructions:
            - Use the conversation history and admin message to generate a set of rules for the servr.
            - If the admin explicitly asks for AI assistance, set "aihelp" to true and provide a well formed AI generated response.
            - If the rules are vague or incomplete, attempt to infer them; only ask for clarification if absolutely necessary.
            - If rules can be clearly extracted, set "aihelp" to false and provide the rules directly.
            - If "aihelp" is false and additional clarification or a final confirmation is advisable, include it in the "followup" field.

            Output Format (JSON):
            {
              "aihelp": true/false,
              "aiMessage": "AI-generated response (if aihelp is true) contains any suggestion or followup if needed",
              "message": "Final structured server rules in normal string form, NO JSON — ONLY WHEN THE USER IS READY TO SET THEM AS FINAL",
              "followup": "Optional: Only shown when aihelp is false — ask for confirmation or point out anything needing final admin review."
            }

            Example 1:
            Admin Message: ###
            Can you help me write rules for general conduct and spam prevention?"
            ###
            Output:
            {
              "aihelp": true,
              "aiMessage": "Here are some suggested rules:\n1. Be respectful to others.\n2. No spamming or repeated posting.\n3. Avoid offensive language.\nPlease review and let me know if you'd like changes.",
              "message": "",
              "followup": ""
            }

            Example 2:
            Admin Message: ###
            Set these as rules : 1. Be kind 2. No spam
            ###

            Output:
            {
              "aihelp": false,
              "aiMessage": "",
              "message": "1. Be kind to all members.\n2. No spam or self-promotion.",
              "followup": "Let me know if you'd like to review or reorder any rule before finalizing."
            }

            Now generate the JSON response based on the below input.


            Current Server Rules (from history): ${adminConfig?.serverRules ?? 'No prior rules provided'}

            Input:
            - Conversation History ###
              ${history ?? 'No history available'}
              ###
            - Admin Message: ###
              ${adminMessage ?? 'No rules provided'}
              ###

             Your JSON Output:
          `;
    }

}
