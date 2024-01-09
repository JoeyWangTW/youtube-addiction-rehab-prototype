# YouTube Addiction Rehab Extension

This Chrome extension, named "YouTube Addiction Rehab," is designed to assist users in managing their YouTube consumption in alignment with their personal goals and preferences. It utilizes OpenAI's GPT model to evaluate video content, offering real-time feedback to help users stick to their objectives and avoid distractions or undesired content.

## Features

- **Customizable Goals and Preferences**: Users can input their specific goals and preferences regarding YouTube content.
- **Automated Video Analysis**: Leverages the OpenAI GPT API to analyze video titles and descriptions, determining their relevance to the user's set goals.
- **Visual Feedback System**: Integrates a color-coded feedback mechanism on the YouTube page:
  - **Green Light**: Indicates alignment with user goals.
  - **Yellow Light**: Suggests uncertainty about the video's relevance.
  - **Red Light**: Warns against videos that diverge from user preferences.

## Installation

1. Download the extension files from the repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable 'Developer mode' located at the top-right corner.
4. Click 'Load unpacked' and choose the extension's directory.
5. The extension, "YouTube Addiction Rehab," will now appear in your Chrome extensions list and be ready for use.

## Prerequisite
- OpenAI API key, [how to get it](https://help.openai.com/en/articles/4936850-where-do-i-find-my-api-key)

## Usage

- **Configuring Goals/Preferences**: Click on the extension icon and choose options to input your desired goals and preferences for YouTube content.
- **Add OpenAI API key**: You'll also need to add your OpenAI API key. Based on how much token the extension is using, it shouldn't be too expensive. If it becomes expensive, that means you are watching too much youtube.   
- **Browsing YouTube**: Continue using YouTube as you normally would.
- **Receiving Feedback**: Upon clicking a video, the extension assesses its content and displays an appropriate color indicator (green, yellow, or red) based on the video's relevance to your predefined goals.

## Technical Components

- **Background Script**: Monitors changes in YouTube page navigation and coordinates communication between the content script and the OpenAI GPT API.
- **Content Script**: Executes within the context of YouTube pages, sending video details for analysis and rendering the feedback on the page.

## Privacy Assurance

"YouTube Addiction Rehab" prioritizes user privacy. All content analyses are performed locally within the extension, ensuring that no personal data is sent to external servers.

## Potential Next Steps
- Consider more info to detemine relavence
- Reinforce good watching habbit, and stop addictive watching
- Personal watching habit tracking
- Hosted service

## Contributing

Contributions to "YouTube Addiction Rehab" are highly encouraged. Feel free to fork the repository, submit pull requests, or open issues for any bugs or feature enhancements you encounter.
