import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import { render } from "@react-email/render";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export interface GithubConnectionWarningEmailParams {
  to: string;
  userName: string;
}

export function GithubConnectionWarningEmail({ params }: { params: GithubConnectionWarningEmailParams }) {
  const { userName } = params;
  const previewText = "Action Required: Connect your GitHub account to Code Catch";

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-gray-100 font-sans p-4">
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
              ⚠️ GitHub Connection Required
            </Heading>

            <Text className="mb-6 text-center text-gray-500">
              Your account setup is incomplete
            </Text>

            <Text className="mb-4 text-base text-gray-700">
              Hi {userName || "there"},
            </Text>

            <Text className="mb-4 text-base leading-6 text-gray-700">
              We noticed you just signed in but haven&apos;t connected a GitHub account yet. You need to connect your GitHub account to fully use Code Catch.
            </Text>

            <Section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
              <Text className="m-0 mb-4 text-sm text-amber-700">
                Code review automation, PR scanning, and repository management require an active GitHub connection to function correctly.
              </Text>
            </Section>

            <Section className="mb-6 text-center">
              <Button
                className="rounded-md bg-amber-600 px-6 py-3 text-base font-semibold text-white no-underline"
                href={`${baseUrl}/profile`}
              >
                Connect GitHub Now
              </Button>
            </Section>

            <Text className="mt-6 text-sm text-gray-500">
              If you have already connected your account, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function renderGithubConnectionWarningEmail(
  params: GithubConnectionWarningEmailParams,
): Promise<string> {
  return render(<GithubConnectionWarningEmail params={params} />);
}
