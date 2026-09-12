import { OperatorLogin } from "@/components/operator-practice/operator-login";

export const dynamic = "force-dynamic";

type OperatorPageProps = {
  searchParams: Promise<{
    state?: string | string[];
    reason?: string | string[];
  }>;
};

export default async function OperatorPage({ searchParams }: OperatorPageProps) {
  const query = await searchParams;
  const state = Array.isArray(query.state) ? query.state[0] : query.state;
  const reason = Array.isArray(query.reason) ? query.reason[0] : query.reason;
  return <OperatorLogin sessionState={state ?? reason} />;
}
