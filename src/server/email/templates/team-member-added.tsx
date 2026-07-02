import {
  Body,
  Button,
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
  Tailwind,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { TeamMemberAddedEmailParams } from "@/types/email";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export interface TeamMemberAddedEmailProps {
  params: TeamMemberAddedEmailParams;
}

/**
 * Enhanced Team Member Added Email Template
 * Sent when a new person is added to a team
 * Includes comprehensive information about the team and next steps
 */
export function TeamMemberAddedEmail({ params }: TeamMemberAddedEmailProps) {
  const {
    inviteeName,
    inviterName,
    teamName,
    role,
    teamUrl,
    needsGithubConnection,
  } = params;

  const roleDisplay = role.charAt(0) + role.slice(1).toLowerCase();
  const previewText = `You've been added to the "${teamName}" team - Welcome!`;

  const rolePermissions: Record<string, string[]> = {
    OWNER: [
      "Manage team settings and members",
      "Add or remove team members",
      "Share repositories with the team",
      "Delete the team",
    ],
    ADMIN: [
      "Manage team members",
      "Add or remove team members",
      "Share repositories with the team",
      "View team analytics",
    ],
    MEMBER: [
      "View team repositories",
      "Create and manage code reviews",
      "Participate in team discussions",
      "View team members",
    ],
  };

  const permissions = rolePermissions[role] || rolePermissions.MEMBER;

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
              Welcome to {teamName}! 🎉
            </Heading>

            <Text className="mb-6 text-center text-gray-500">
              You&apos;ve been invited to join a team on Code Catch
            </Text>

            {/* Greeting */}
            <Text className="mb-4 text-base text-gray-700">
              Hi {inviteeName || "there"},
            </Text>

            {/* Main Content */}
            <Text className="mb-4 text-base leading-6 text-gray-700">
              <strong>{inviterName}</strong> has invited you to join the{" "}
              <strong>{teamName}</strong> team as a{" "}
              <strong>{roleDisplay}</strong>.
            </Text>

            <Text className="mb-6 text-base leading-6 text-gray-700">
              As a {roleDisplay}, you&apos;ll be able to collaborate with team
              members on code reviews and access shared repositories.
            </Text>

            {/* GitHub Connection Alert */}
            {needsGithubConnection && (
              <Section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
                <Text className="m-0 mb-2 text-base font-bold text-amber-800">
                  ⚠️ Action Required: Connect GitHub
                </Text>
                <Text className="m-0 mb-4 text-sm text-amber-700">
                  You haven&apos;t connected a GitHub account to your profile
                  yet. Code Catch requires a GitHub connection to analyze
                  code and pull requests.
                </Text>
                <Button
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white no-underline"
                  href={`${baseUrl}/profile`}
                >
                  Connect GitHub Account
                </Button>
              </Section>
            )}

            {/* CTA Button */}
            <Section className="mb-6 text-center">
              <Button
                className="rounded-md bg-gray-900 px-6 py-3 text-base font-semibold text-white no-underline"
                href={teamUrl}
              >
                View Team Dashboard
              </Button>
            </Section>

            {/* Role Permissions Card */}
            <Section className="mb-6 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-5">
              <Text className="mb-3 text-base font-semibold text-gray-900">
                🔑 Your {roleDisplay} Permissions
              </Text>
              <ul className="m-0 list-none pl-0">
                {permissions.map((permission, index) => (
                  <li
                    key={index}
                    className="mb-2 flex items-start text-sm text-gray-600"
                  >
                    <span className="mr-2 text-green-500">✓</span>
                    {permission}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Getting Started Card */}
            <Section className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-5">
              <Text className="mb-3 text-base font-semibold text-blue-900">
                🚀 Getting Started
              </Text>
              <Text className="mb-2 text-sm text-blue-800">
                1. Visit your team dashboard to see all members and repositories
              </Text>
              <Text className="mb-2 text-sm text-blue-800">
                2. Connect your GitHub account if you haven&apos;t already
              </Text>
              <Text className="mb-2 text-sm text-blue-800">
                3. Start creating or view existing code reviews
              </Text>
              <Text className="mb-0 text-sm text-blue-800">
                4. Enable notifications to stay updated on team activity
              </Text>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Help Section */}
            <Section className="rounded-lg bg-gray-50 p-4">
              <Text className="mb-2 text-sm font-semibold text-gray-900">
                Need help?
              </Text>
              <Text className="mb-0 text-sm text-gray-600">
                Check out our{" "}
                <Link
                  href={`${baseUrl}/docs`}
                  className="text-blue-600 underline"
                >
                  documentation
                </Link>{" "}
                or{" "}
                <Link
                  href={`${baseUrl}/settings/support`}
                  className="text-blue-600 underline"
                >
                  contact support
                </Link>{" "}
                if you have any questions.
              </Text>
            </Section>

            {/* Footer */}
            <Text className="mt-6 text-sm text-gray-500">
              If you didn&apos;t expect this invitation, you can safely ignore
              this email. The invitation was sent by{" "}
              <strong>{inviterName}</strong>.
            </Text>
          </Container>

          {/* Footer Links */}
          <Container className="mx-auto max-w-[560px] py-4 text-center">
            <Text className="text-xs text-gray-400">
              © 2024 Code Catch. All rights reserved.
            </Text>
            <Text className="mt-1 text-xs text-gray-400">
              <Link href={baseUrl} className="text-gray-500 underline">
                Privacy Policy
              </Link>{" "}
              •{" "}
              <Link
                href={`${baseUrl}/settings`}
                className="text-gray-500 underline"
              >
                Email Settings
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/**
 * Generate the HTML content for the team member added email
 */
export async function renderTeamMemberAddedEmail(
  params: TeamMemberAddedEmailParams,
): Promise<string> {
  return render(<TeamMemberAddedEmail params={params} />);
}
