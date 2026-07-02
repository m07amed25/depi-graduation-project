import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #1e1b4b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Glow blob top-right */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Glow blob bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(99,102,241,0.5)",
              fontSize: "32px",
            }}
          >
            ⚡
          </div>
        </div>

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: "9999px",
            padding: "6px 20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#818cf8",
              display: "flex",
            }}
          />
          <span
            style={{
              color: "#a5b4fc",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            AI-Powered Code Reviews
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            fontSize: "76px",
            fontWeight: 800,
            color: "#f4f4f5",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "24px",
            letterSpacing: "-3px",
          }}
        >
          <span>Code</span>
          <span
            style={{
              color: "#818cf8",
              textShadow: "0 0 30px rgba(129,140,248,0.6)",
            }}
          >
            Catch
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "720px",
            lineHeight: 1.5,
            marginBottom: "12px",
          }}
        >
          Catch bugs, security issues, and code quality problems before they
          reach production — directly in your GitHub pull requests.
        </div>

        {/* Bottom feature strip */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            display: "flex",
            gap: "36px",
            alignItems: "center",
          }}
        >
          {[
            "Bug Detection",
            "Security Analysis",
            "Code Quality",
            "GitHub Integration",
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#71717a",
                fontSize: "15px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  display: "flex",
                }}
              />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* URL watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "60px",
            color: "rgba(99,102,241,0.5)",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
          }}
        >
          dev-review-ai-chi.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
