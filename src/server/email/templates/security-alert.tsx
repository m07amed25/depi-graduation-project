import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { SecurityAlertEmailParams } from "@/types/email";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export interface SecurityAlertEmailProps {
  params: SecurityAlertEmailParams;
}

/**
 * Security Alert Email Template
 * Sent when a security scan finds critical or high severity issues in a PR
 */
export function SecurityAlertEmail({ params }: SecurityAlertEmailProps) {
  const {
    recipientName,
    repositoryName,
    repositoryFullName,
    prNumber,
    criticalCount,
    highCount,
    viewReviewUrl,
  } = params;

  const totalSevere = criticalCount + highCount;
  const previewText = `⚠️ Security alert: ${totalSevere} severe issue${totalSevere !== 1 ? "s" : ""} found in ${repositoryName} PR #${prNumber}`;

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[560px] rounded-lg bg-white p-8 shadow-md">
            {/* Logo Section */}
            <Section className="mb-6 text-center">
              <Img
                src={`${baseUrl}/file.svg`}
                width="56"
                height="56"
                alt="Code Catch"
                className="mx-auto"
              />
            </Section>

            {/* Header */}
            <Heading className="mb-2 text-center text-2xl font-bold text-gray-900">
              Security Alert ⚠️
            </Heading>

            <Text className="mb-6 text-center text-gray-500">
              Critical security issues detected in your pull request
            </Text>

            {/* Greeting */}
            <Text className="mb-4 text-base text-gray-700">
              Hi {recipientName || "there"},
            </Text>

            {/* Main Content */}
            <Text className="mb-4 text-base leading-6 text-gray-700">
              A security scan on <strong>{repositoryFullName}</strong> PR{" "}
              <strong>#{prNumber}</strong> has detected severe security issues
              that require your immediate attention.
            </Text>

            {/* Alert Card */}
            <Section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-5">
              {criticalCount > 0 && (
                <Text className="mb-1 text-base font-semibold text-red-700">
                  🔴 {criticalCount} Critical issue{criticalCount !== 1 ? "s" : ""}
                </Text>
              )}
              {highCount > 0 && (
                <Text className="mb-1 text-base font-semibold text-orange-600">
                  🟠 {highCount} High severity issue{highCount !== 1 ? "s" : ""}
                </Text>
              )}
              <Text className="mt-2 text-sm text-red-600">
                These issues may expose your application to security
                vulnerabilities. Please review and remediate them before
                merging.
              </Text>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* CTA */}
            <Section className="mb-6 text-center">
              <Button
                href={viewReviewUrl}
                className="rounded-lg bg-red-600 px-6 py-3 text-base font-semibold text-white no-underline"
              >
                View Security Report
              </Button>
            </Section>

            <Text className="text-sm text-gray-500">
              You received this email because you are the repository owner. To
              manage your notification preferences, visit your{" "}
              <a
                href={`${baseUrl}/settings`}
                className="text-blue-600 underline"
              >
                settings
              </a>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function renderSecurityAlertEmail(
  params: SecurityAlertEmailParams,
): Promise<string> {
  return render(<SecurityAlertEmail params={params} />);
}
