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

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export interface RefundEmailParams {
  to: string;
  userName: string;
  amount: number;
  currency: string;
  planName: string;
}

export function RefundEmail({ params }: { params: RefundEmailParams }) {
  const { userName, amount, currency, planName } = params;

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{`Your payment of ${amount} ${currency} has been refunded as account credit`}</Preview>
        <Body className="bg-gray-100 font-sans p-4">
          <Container className="mx-auto my-10 max-w-[600px] rounded-lg bg-white p-8 shadow-sm">
            <Section className="mb-6">
              <Img
                src={`${baseUrl}/file.svg`}
                width="40"
                height="40"
                alt="Code Catch"
                className="mx-auto"
              />
            </Section>

            <Heading className="mb-6 text-2xl font-bold text-gray-900 text-center">
              Payment Refunded
            </Heading>

            <Text className="mb-4 text-base leading-7 text-gray-700">
              Hello {userName},
            </Text>

            <Text className="mb-6 text-base leading-7 text-gray-700">
              Your payment for the <strong>{planName}</strong> plan has been refunded. The refund has been applied as account credit that will be automatically used on your next subscription payment.
            </Text>

            <Section className="mb-8 p-6 bg-emerald-50 rounded-xl border border-emerald-100">
              <Text className="m-0 text-xs text-emerald-600 uppercase font-bold tracking-wider text-center">Refund Amount</Text>
              <Text className="m-0 text-3xl font-bold text-emerald-700 text-center">{amount} {currency}</Text>
              <Text className="m-0 mt-2 text-sm text-emerald-600 text-center">Added to your account credit</Text>
            </Section>

            <Section className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <Text className="m-0 text-sm text-amber-800">
                <strong>Note:</strong> Account credit is non-withdrawable and can only be used toward future plan payments on Code Catch.
              </Text>
            </Section>

            <Text className="mb-6 text-base leading-7 text-gray-700">
              Your subscription has been reverted to the Free plan. You can upgrade again at any time and your credit will be applied automatically.
            </Text>

            <Section className="text-center mb-8">
              <Link
                href={`${baseUrl}/billing`}
                className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-indigo-700"
              >
                View Billing
              </Link>
            </Section>

            <Hr className="my-8 border-gray-200" />

            <Text className="text-sm text-gray-400 text-center">
              If you have questions about this refund, please contact support.
              <br />
              &copy; {new Date().getFullYear()} Code Catch. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function renderRefundEmail(params: RefundEmailParams): Promise<string> {
  return render(<RefundEmail params={params} />);
}
