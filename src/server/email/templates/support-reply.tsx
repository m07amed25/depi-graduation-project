import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";
import { render } from "@react-email/render";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export interface SupportReplyEmailParams {
  to: string;
  originalMessage: string;
  replyMessage: string;
}

export function SupportReplyEmail({
  params,
}: {
  params: SupportReplyEmailParams;
}) {
  const { originalMessage, replyMessage } = params;
  const previewText = "Response to your support inquiry - Code Catch";

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-gray-100 font-sans p-4">
          <Container className="mx-auto my-10 max-w-[600px] rounded-lg bg-white p-8 shadow-sm">
            {/* Logo Section */}
            <Section className="mb-6">
              <Img
                src={`${baseUrl}/file.svg`}
                width="40"
                height="40"
                alt="Code Catch"
                className="mx-auto"
              />
            </Section>

            {/* Header */}
            <Heading className="mb-6 text-2xl font-bold text-gray-900 text-center">
              Support Team Response
            </Heading>

            <Text className="mb-6 text-base leading-7 text-gray-700">
              Hello,
            </Text>

            <Text className="mb-8 text-base font-medium leading-7 text-gray-800 bg-gray-50 p-6 rounded-xl border border-gray-100">
              {replyMessage}
            </Text>

            <Hr className="my-8 border-gray-200" />

            <Section className="opacity-70">
              <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Your original message:
              </Text>
              <Text className="text-sm italic leading-6 text-gray-600 bg-gray-50 p-4 rounded-lg border-l-4 border-gray-200">
                &quot;{originalMessage}&quot;
              </Text>
            </Section>

            <Text className="mt-10 text-sm text-gray-400 text-center">
              This is a response to the inquiry you sent via our support form.
              <br />
              &copy; {new Date().getFullYear()} Code Catch. All rights
              reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function renderSupportReplyEmail(
  params: SupportReplyEmailParams,
): Promise<string> {
  return render(<SupportReplyEmail params={params} />);
}
