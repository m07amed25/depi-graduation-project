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

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
}

export function PasswordResetEmail({ userName, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Reset your CodeCatch password</Preview>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[560px] rounded-lg bg-white p-8 shadow-md">
            <Section className="mb-6 text-center">
              <Img
                src={`${baseUrl}/file.svg`}
                width="56"
                height="56"
                alt="Code Catch"
                className="mx-auto"
              />
            </Section>

            <Heading className="mb-2 text-center text-2xl font-bold text-gray-900">
              Reset Your Password
            </Heading>

            <Text className="mb-6 text-center text-gray-500">
              We received a request to reset your password
            </Text>

            <Text className="mb-4 text-base text-gray-700">
              Hi {userName},
            </Text>

            <Text className="mb-4 text-base leading-6 text-gray-700">
              Someone requested a password reset for your CodeCatch account. Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={resetUrl}
                className="rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white no-underline"
              >
                Reset Password
              </Button>
            </Section>

            <Text className="mb-4 text-sm text-gray-500">
              If you didn&apos;t request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </Text>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-xs text-gray-400 text-center">
              If the button doesn&apos;t work, copy and paste this link into your browser:
            </Text>
            <Text className="text-xs text-indigo-500 text-center break-all">
              {resetUrl}
            </Text>

            <Hr className="my-6 border-gray-200" />

            <Text className="text-xs text-gray-400 text-center">
              © {new Date().getFullYear()} CodeCatch. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function renderPasswordResetEmail(
  userName: string,
  resetUrl: string,
): Promise<string> {
  return render(<PasswordResetEmail userName={userName} resetUrl={resetUrl} />);
}
