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
  Link,
  Hr,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { AdminPromotedEmailParams } from "@/types/email";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export function AdminPromotedEmail({
  params,
}: {
  params: AdminPromotedEmailParams;
}) {
  const { userName, promotedByName } = params;
  const previewText =
    "You've been promoted to Administrator on Code Catch";

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
              Admin Privileges Granted
            </Heading>

            <Text className="mb-4 text-base leading-7 text-gray-700">
              Hello {userName || "there"},
            </Text>

            <Text className="mb-6 text-base leading-7 text-gray-700">
              Congratulations! You have been promoted to an **Administrator** on
              the **Code Catch** platform by **{promotedByName}**.
            </Text>

            <Section className="mb-8 p-6 bg-violet-50 rounded-xl border border-violet-100">
              <Text className="m-0 text-base font-semibold text-violet-900">
                What does this mean?
              </Text>
              <ul className="mt-4 text-sm text-violet-800 leading-6 list-disc pl-5">
                <li>Access to the Admin Panel</li>
                <li>Ability to manage users, repositories, and teams</li>
                <li>Full oversight of all PR reviews on the platform</li>
                <li>System configuration and maintenance access</li>
              </ul>
            </Section>

            <Section className="text-center mb-8">
              <Link
                href={`${baseUrl}/admin`}
                className="inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-violet-700"
              >
                Go to Admin Panel
              </Link>
            </Section>

            <Hr className="my-8 border-gray-200" />

            <Text className="text-sm text-gray-400 text-center">
              This is an automated notification. If you believe this was done in
              error, please contact the system owner.
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

export async function renderAdminPromotedEmail(
  params: AdminPromotedEmailParams,
): Promise<string> {
  return render(<AdminPromotedEmail params={params} />);
}
