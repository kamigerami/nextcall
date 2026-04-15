import { getAppConfig } from "@/lib/app-config";

const explanationBlocks = [
  {
    label: "Verdict",
    body: "A hard call. No hedging.",
  },
  {
    label: "Best angle",
    body: "One frame worth pushing first.",
  },
  {
    label: "Test this",
    body: "A concrete next move with a real success bar.",
  },
  {
    label: "Use this artifact",
    body: "Something you can copy and send today.",
  },
] as const;

const proofRows = [
  ["Verdict", "PROMISING"],
  ["Best angle", "Chase invoice pain before the client ghosts"],
  ["Test this", "Send 10 direct emails to freelancers who invoice monthly"],
  ["Artifact", "Quick question: do you ever lose hours chasing late invoices?"],
] as const;

function buildRequestAccessHref(email: string) {
  const params = new URLSearchParams({
    subject: "NextPitch Access Request",
    body: [
      "What are you trying to validate?",
      "",
      "Who is the buyer?",
      "",
      "What have you already tested, if anything?",
    ].join("\n"),
  });

  return `mailto:${email}?${params.toString()}`;
}

export function LandingPage() {
  const { requestAccessEmail } = getAppConfig();
  const requestAccessHref = buildRequestAccessHref(requestAccessEmail);

  return (
    <main className="min-h-screen bg-[#e5e0d7] text-[#111111]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col px-5 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-10">
        <div className="border border-black/10 bg-[#efe9df]">
          <section>
            <div className="flex flex-col gap-8 px-5 pb-4 pt-7 sm:px-8 sm:pb-5 sm:pt-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:pb-4 lg:pt-10">
              <div className="max-w-[720px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-black/45">
                  NextPitch
                </p>
                <h1 className="mt-4 max-w-[620px] text-5xl font-semibold tracking-[-0.08em] sm:text-6xl lg:text-[4.5rem]">
                  Stop guessing.
                </h1>
                <p className="mt-3 max-w-[520px] text-2xl font-medium tracking-[-0.05em] text-black/72 sm:text-3xl">
                  Most ideas are not worth building.
                </p>
                <p className="mt-5 max-w-[620px] text-base leading-7 text-black/68 sm:text-lg">
                  NextPitch gives founders one hard call, one angle to push, one test
                  to run, and one artifact they can actually send.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:self-start">
                <a
                  href={requestAccessHref}
                  className="inline-flex items-center justify-center border border-black bg-black px-5 py-3 text-sm font-medium text-[#f6f2ea] transition hover:bg-[#1a1a1a]"
                >
                  Request access
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center border border-black/15 bg-transparent px-5 py-3 text-sm font-medium text-black/72 transition hover:border-black/30 hover:text-black"
                >
                  Watch demo
                </a>
              </div>
            </div>
          </section>

          <section
            id="demo"
            className="scroll-mt-6 px-5 pb-7 pt-2 sm:px-8 sm:pb-8 sm:pt-1 lg:px-10 lg:pb-10 lg:pt-0"
          >
            <div className="max-w-[720px]">
              <h2 className="text-3xl font-semibold tracking-[-0.06em] sm:text-[2.4rem]">
                See the loop in 30 seconds
              </h2>
              <p className="mt-2 max-w-[520px] text-base leading-7 text-black/66">
                One idea in. One hard call out. One test worth running.
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-[28px] border border-black/12 bg-[#ece6dc]">
              <video
                className="block aspect-video h-auto w-full bg-[#ebe5dc]"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              >
                <source src="/demo/nextpitch-demo.mp4" type="video/mp4" />
              </video>
            </div>
          </section>
        </div>

        <section className="border-x border-b border-black/10 bg-[#e8e2d8]">
          <div className="grid gap-0 lg:grid-cols-4">
            {explanationBlocks.map((item, index) => (
              <div
                key={item.label}
                className={`px-5 py-5 sm:px-8 sm:py-6 lg:min-h-[172px] lg:px-7 ${
                  index < explanationBlocks.length - 1
                    ? "border-b border-black/10 lg:border-r lg:border-b-0"
                    : ""
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                  {item.label}
                </p>
                <p className="mt-4 max-w-[220px] text-sm leading-6 text-black/68">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-x border-b border-black/10 bg-[#f5f1ea] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="max-w-[420px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                Proof
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
                Building is easy now. Choosing what to test next is not.
              </h2>
              <p className="mt-4 text-base leading-7 text-black/68">
                The product is blunt on purpose. Broad ideas get forced narrower.
                Weak angles get called weak. The output should feel specific enough
                to act on the same day.
              </p>
            </div>

            <div className="border border-black/12 bg-[#efeadf]">
              <div className="border-b border-black/10 px-5 py-4 sm:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                  Example output
                </p>
              </div>
              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <dl className="space-y-5">
                  {proofRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="border-b border-black/8 pb-4 last:border-b-0 last:pb-0"
                    >
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/35">
                        {label}
                      </dt>
                      <dd className="mt-2 text-sm leading-7 text-black/78 sm:text-[15px]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="border-x border-b border-black/10 bg-[#ece6dc] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[620px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                Private preview
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
                I&apos;m sharing the full app with a small group of founders first.
              </h2>
              <p className="mt-4 max-w-[520px] text-base leading-7 text-black/68">
                The public site shows the loop. The real analyzer is invite-only for
                selected testers while the product sharpens.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <a
                href={requestAccessHref}
                className="inline-flex items-center justify-center border border-black bg-black px-5 py-3 text-sm font-medium text-[#f6f2ea] transition hover:bg-[#1a1a1a]"
              >
                Request access
              </a>
              <p className="text-sm leading-6 text-black/58">
                Or email{" "}
                <a
                  href={`mailto:${requestAccessEmail}`}
                  className="underline decoration-black/20 underline-offset-4 transition hover:decoration-black/45"
                >
                  {requestAccessEmail}
                </a>
              </p>
            </div>
          </div>
        </section>

        <footer className="border-x border-b border-black/10 bg-[#e5e0d7] px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-2 text-sm text-black/52 sm:flex-row sm:items-center sm:justify-between">
            <p>NextPitch</p>
            <p>Public landing. Private preview for selected testers.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
