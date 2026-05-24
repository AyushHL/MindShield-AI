import axios from "axios";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export const generateReply = async (
  chatHistory: ChatMessage[]
): Promise<string> => {

  try {

    // Convert frontend messages properly
    const formattedMessages = [

      {
        role: "system",
        content: `
You are a supportive mental health assistant.

Rules:
- Be empathetic
- Never encourage self harm
- Encourage professional help
- Encourage trusted friends/family
        `
      },

      // IMPORTANT FIX
      ...chatHistory.map((msg) => ({
        role:
          msg.role === "bot"
            ? "assistant"
            : "user",

        content: msg.text
      }))
    ];

    console.log(
      JSON.stringify(formattedMessages, null, 2)
    );

    const response = await axios.post(

      "https://api.groq.com/openai/v1/chat/completions",

      {
        model: "llama-3.3-70b-versatile",

        messages: formattedMessages,

        temperature: 0.7
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error: any) {

    console.log(
      error.response?.data || error.message
    );

    return "I'm here for you.";
  }
};