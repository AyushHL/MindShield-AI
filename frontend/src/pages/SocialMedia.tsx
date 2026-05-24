import { useState } from "react";
import axios from "axios";
import api from '../services/api';


type RedditPost = {
  username: string;
  text: string;
  risk: string;
};

function RedditRiskAnalyzer() {
  const [subreddit, setSubreddit] = useState("");
  const [count, setCount] = useState(10);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const label: Record<number, string> = {
    0: "non suicidal",
    1: "low",
    2: "high"
  };

  const fetchPosts = async () => {
    if (!subreddit.trim()) return;

    setLoading(true);

    try {
      // Get Reddit posts
      const redditRes = await axios.get(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=${count}`
      );

      const redditPosts =
        redditRes.data.data.children;

      const analyzedPosts: RedditPost[] = [];

      // Analyze each post
      for (const post of redditPosts) {
        const username = post.data.author;

        const text =
          post.data.selftext?.trim() ||
          post.data.title;

        try {
        let riskRes = await api.post('/ml/predict', { text });

        analyzedPosts.push({
            username,
            text,
            risk:
            label[riskRes.data.classId] || "non suicidal",
        });
        } catch (err) {
          console.log(err);

          analyzedPosts.push({
            username,
            text,
            risk: "unknown",
          });
        }
      }

      // Sort:
      // high -> low -> non suicidal
      const riskOrder: any = {
        2: 0,
        1: 1,
        0: 2,
        unknown: 3,
      };

      analyzedPosts.sort(
        (a, b) =>
          riskOrder[a.risk] -
          riskOrder[b.risk]
      );

      setPosts(analyzedPosts);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const getRiskColor = (risk: string) => {
    if (risk === "high") return "#ef4444";
    if (risk === "low") return "#f59e0b";
    if (risk === "non suicidal")
      return "#22c55e";

    return "#94a3b8";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        padding: "40px",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "40px",
            marginBottom: "30px",
            textAlign: "center",
          }}
        >
          Reddit Suicide Risk Analyzer
        </h1>

        {/* Inputs */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <input
            value={subreddit}
            onChange={(e) =>
              setSubreddit(e.target.value)
            }
            placeholder="Enter subreddit"
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "white",
              fontSize: "16px",
            }}
          />

          <input
            type="number"
            value={count}
            onChange={(e) =>
              setCount(Number(e.target.value))
            }
            style={{
              width: "120px",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #334155",
              background: "#1e293b",
              color: "white",
              fontSize: "16px",
            }}
          />

          <button
            onClick={fetchPosts}
            disabled={loading}
            style={{
              padding: "14px 24px",
              borderRadius: "12px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading
              ? "Analyzing..."
              : "Analyze"}
          </button>
        </div>

        {/* Results */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {posts.map((post, index) => (
            <div
              key={index}
              style={{
                background: "#1e293b",
                borderRadius: "18px",
                padding: "20px",
                border: `2px solid ${getRiskColor(
                  post.risk
                )}`,
                boxShadow:
                  "0 8px 20px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  u/{post.username}
                </h2>

                <div
                  style={{
                    background:
                      getRiskColor(post.risk),
                    padding:
                      "6px 14px",
                    borderRadius: "999px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textTransform:
                      "uppercase",
                  }}
                >
                  {post.risk}
                </div>
              </div>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap",
                }}
              >
                {post.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RedditRiskAnalyzer;