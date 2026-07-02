import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  render,
} from "@react-email/components";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

interface EmailDesign {
  bgColor: string;
  containerBg: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  buttonBg: string;
  buttonTextColor: string;
  fontFamily: string;
  fontSize: string;
  headingSize: string;
  containerWidth: string;
  padding: string;
  borderRadius: string;
  logoPosition: "hidden" | "top" | "before-greeting" | "after-greeting";
  logoUrl: string;
  logoWidth: string;
  greetingText: string;
  showFooter: boolean;
  footerText: string;
  showUnsubscribe: boolean;
  headerImageUrl?: string;
  footerImageUrl?: string;
  bodyImages?: string[];
}

interface BroadcastEmailProps {
  subject: string;
  body: string;
  userName?: string;
  appUrl: string;
  design?: EmailDesign;
  unsubscribeUrl?: string;
}

const defaultDesign: EmailDesign = {
  bgColor: "#f6f9fc",
  containerBg: "#ffffff",
  textColor: "#444444",
  headingColor: "#1a1a1a",
  linkColor: "#2563eb",
  buttonBg: "#2563eb",
  buttonTextColor: "#ffffff",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: "16px",
  headingSize: "24px",
  containerWidth: "600px",
  padding: "40px",
  borderRadius: "8px",
  logoPosition: "hidden",
  logoUrl: "",
  logoWidth: "56",
  greetingText: "Hi {name},",
  showFooter: true,
  footerText: "Sent from CodeCatch",
  showUnsubscribe: true,
  headerImageUrl: "",
  footerImageUrl: "",
  bodyImages: [],
};

const Logo = ({ url, width }: { url: string; width: string }) => {
  if (!url) return null;
  return (
    <Section style={{ textAlign: "center", marginBottom: "24px" }}>
      <Img
        src={url}
        width={width}
        height="auto"
        alt="Logo"
        style={{ margin: "0 auto" }}
    />
  </Section>
  );
};

export const BroadcastEmail = ({
  subject,
  body,
  userName,
  appUrl,
  design = defaultDesign,
  unsubscribeUrl,
}: BroadcastEmailProps) => {
  const d = { ...defaultDesign, ...design };
  const greeting = d.greetingText.replace("{name}", userName || "there");

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ backgroundColor: d.bgColor, fontFamily: d.fontFamily }}>
        <Container
          style={{
            backgroundColor: d.containerBg,
            margin: "0 auto",
            padding: d.padding,
            maxWidth: d.containerWidth,
            borderRadius: d.borderRadius,
          }}
        >
          {d.headerImageUrl && (
            <Section style={{ textAlign: "center", marginBottom: "24px" }}>
              <Img src={d.headerImageUrl} alt="Header" width="100%" style={{ width: "100%", height: "auto", borderRadius: d.borderRadius }} />
            </Section>
          )}
          {d.logoPosition === "top" && <Logo url={d.logoUrl} width={d.logoWidth} />}
          {d.logoPosition === "before-greeting" && <Logo url={d.logoUrl} width={d.logoWidth} />}
          {d.greetingText && (
            <Text style={{ color: d.headingColor, fontSize: d.headingSize, fontWeight: 600, marginBottom: "16px" }}>
              {greeting}
            </Text>
          )}
          {d.logoPosition === "after-greeting" && <Logo url={d.logoUrl} width={d.logoWidth} />}
          {d.bodyImages && d.bodyImages.length > 0 && (
            <Section style={{ textAlign: "center", marginBottom: "20px" }}>
              {d.bodyImages.map((url, i) => (
                <Img key={i} src={url} alt="" style={{ maxHeight: "48px", width: "auto", display: "inline-block", margin: "0 6px" }} />
              ))}
            </Section>
          )}

          <Section style={{ margin: "24px 0" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ children }) => (
                  <Heading as="h2" style={{ color: d.headingColor, fontSize: d.headingSize, fontWeight: 600, margin: "24px 0 16px" }}>
                    {children}
                  </Heading>
                ),
                h2: ({ children }) => (
                  <Heading as="h3" style={{ color: d.headingColor, fontSize: "20px", fontWeight: 600, margin: "20px 0 12px" }}>
                    {children}
                  </Heading>
                ),
                p: ({ children }) => (
                  <Text style={{ color: d.textColor, fontSize: d.fontSize, lineHeight: 1.6, margin: "0 0 16px" }}>
                    {children}
                  </Text>
                ),
                a: ({ href, children }) => (
                  <Link href={href} style={{ color: d.linkColor, textDecoration: "underline" }}>
                    {children}
                  </Link>
                ),
                img: ({ src, alt }) => (
                  <img src={src} alt={alt} style={{ maxWidth: "100%", borderRadius: "8px", margin: "16px 0" }} />
                ),
                ul: ({ children }) => <ul style={{ color: d.textColor, fontSize: d.fontSize, lineHeight: 1.6, margin: "0 0 16px", paddingLeft: "24px" }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ color: d.textColor, fontSize: d.fontSize, lineHeight: 1.6, margin: "0 0 16px", paddingLeft: "24px" }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: "8px" }}>{children}</li>,
              }}
            >
              {body}
            </ReactMarkdown>
          </Section>

          {d.showFooter && (
            <>
              <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
              {d.footerImageUrl && (
                <Section style={{ textAlign: "center", marginBottom: "12px" }}>
                  <Img src={d.footerImageUrl} alt="Footer" width="100%" style={{ width: "100%", height: "auto" }} />
                </Section>
              )}
              <Section>
                <Text style={{ color: "#9ca3af", fontSize: "12px", lineHeight: 1.5, margin: "0 0 8px" }}>
                  {d.footerText}
                </Text>
                {d.showUnsubscribe && (
                  <Text style={{ color: "#9ca3af", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
                    <Link href={`${appUrl}/settings`} style={{ color: d.linkColor }}>
                      Manage preferences
                    </Link>
                    {" · "}
                    <Link href={unsubscribeUrl || `${appUrl}/settings`} style={{ color: d.linkColor }}>
                      Unsubscribe
                    </Link>
                  </Text>
                )}
              </Section>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
};

export const renderBroadcastEmail = async (props: BroadcastEmailProps) => {
  return await render(<BroadcastEmail {...props} />);
};
