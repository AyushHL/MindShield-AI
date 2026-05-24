import { useState } from "react";
import axios from "axios";

type ChatMessage = {
  role: string;
  text: string;
};

function ChatbotWidget() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      text: message,
    };

    const updatedChat = [...chat, userMessage];

    setChat(updatedChat);
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/chat",
        {
          messages: updatedChat,
        }
      );

      const botMessage: ChatMessage = {
        role: "bot",
        text: res.data.reply,
      };

      setChat((prev) => [...prev, botMessage]);
    } catch (error) {
      console.log(error);

      setChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        margin: "30px auto",
        background: "#111827",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        border: "1px solid #1f2937",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px",
          background: "#1f2937",
          color: "white",
          fontSize: "20px",
          fontWeight: "bold",
          borderBottom: "1px solid #374151",
        }}
      >
        💙 MindShield AI
      </div>

      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "#0f172a",
        }}
      >
        {chat.length === 0 && (
          <div
            style={{
              color: "#94a3b8",
              textAlign: "center",
              marginTop: "50px",
              lineHeight: "1.6",
            }}
          >
            Start a conversation 💬
          </div>
        )}

        {chat.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user"
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: "18px",
                background:
                  msg.role === "user"
                    ? "#2563eb"
                    : "#1e293b",
                color: "white",
                fontSize: "15px",
                lineHeight: "1.5",
                wordBreak: "break-word",
                boxShadow:
                  "0 4px 10px rgba(0,0,0,0.15)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div
            style={{
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            AI is typing...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "15px",
          borderTop: "1px solid #1f2937",
          background: "#111827",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #374151",
            outline: "none",
            background: "#1e293b",
            color: "white",
            fontSize: "15px",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export { ChatbotWidget };