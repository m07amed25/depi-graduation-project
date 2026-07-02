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
import type { PlanChangedEmailParams } from "@/types/email";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export function PlanChangedEmail({
  params,
}: {
  params: PlanChangedEmailParams;
}) {
  const { userName, oldPlan, newPlan, expiresAt, changedBy, overrides } = params;
  const previewText = `Your subscription plan has been updated to ${newPlan.toUpperCase()}`;

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
              Subscription Plan Updated
            </Heading>

            <Text className="mb-4 text-base leading-7 text-gray-700">
              Hello {userName || "there"},
            </Text>

            <Text className="mb-6 text-base leading-7 text-gray-700">
              Your subscription plan on **DevReview AI** has been updated by **{changedBy}**.
            </Text>

            <Section className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex justify-between items-center mb-4">
                <div className="text-center px-4 py-2 bg-gray-100 rounded-lg">
                  <Text className="m-0 text-xs text-gray-500 uppercase font-bold tracking-wider">Previous Plan</Text>
                  <Text className="m-0 text-lg font-bold text-gray-400 line-through">{oldPlan.toUpperCase()}</Text>
                </div>
                <div className="text-gray-300">→</div>
                <div className="text-center px-4 py-2 bg-indigo-100 rounded-lg">
                  <Text className="m-0 text-xs text-indigo-500 uppercase font-bold tracking-wider">New Plan</Text>
                  <Text className="m-0 text-lg font-bold text-indigo-700">{newPlan.toUpperCase()}</Text>
                </div>
              </div>

              {expiresAt && (
                <Text className="mt-4 text-sm text-indigo-800 text-center italic">
                  This plan is set to expire on {new Date(expiresAt).toLocaleDateString()}.
                </Text>
              )}

              {overrides && (overrides.repos || overrides.reviews || overrides.seats) && (
                <div className="mt-6 pt-6 border-t border-indigo-100">
                  <Text className="m-0 mb-3 text-xs text-indigo-500 uppercase font-bold tracking-wider text-center">Custom Plan Overrides</Text>
                  <div className="flex justify-around">
                    {overrides.repos !== undefined && overrides.repos !== null && (
                      <div className="text-center">
                        <Text className="m-0 text-lg font-bold text-indigo-700">{overrides.repos}</Text>
                        <Text className="m-0 text-[10px] text-indigo-400 uppercase">Repos</Text>
                      </div>
                    )}
                    {overrides.reviews !== undefined && overrides.reviews !== null && (
                      <div className="text-center">
                        <Text className="m-0 text-lg font-bold text-indigo-700">{overrides.reviews}</Text>
                        <Text className="m-0 text-[10px] text-indigo-400 uppercase">Reviews</Text>
                      </div>
                    )}
                    {overrides.seats !== undefined && overrides.seats !== null && (
                      <div className="text-center">
                        <Text className="m-0 text-lg font-bold text-indigo-700">{overrides.seats}</Text>
                        <Text className="m-0 text-[10px] text-indigo-400 uppercase">Seats</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>

            <Text className="mb-6 text-base leading-7 text-gray-700">
              You now have access to all the features and limits included in the {newPlan} tier. You can view your updated resource usage and plan details in your dashboard.
            </Text>

            <Section className="text-center mb-8">
              <Link
                href={`${baseUrl}/billing`}
                className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-indigo-700"
              >
                View Plan Details
              </Link>
            </Section>

            <Hr className="my-8 border-gray-200" />

            <Text className="text-sm text-gray-400 text-center">
              This is an automated notification. If you have any questions regarding your subscription, please contact support.
              <br />
              &copy; {new Date().getFullYear()} Code Catch. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function renderPlanChangedEmail(
  params: PlanChangedEmailParams,
): Promise<string> {
  return render(<PlanChangedEmail params={params} />);
}
