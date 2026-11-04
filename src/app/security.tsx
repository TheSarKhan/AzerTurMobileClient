import React from "react";
import { Page } from "../design/ui";
import { useAccount } from "../state/account";
import { useDiscovery } from "../state/discovery";
import { SignedIn } from "../features/account/components";
import AccountSecurity from "../features/journeys/AccountSecurity";
export default function Security() {
  const a = useAccount(),
    { t, locale } = useDiscovery();
  return (
    <Page
      back
      title={t(
        "Security & sessions",
        "Безопасность и сеансы",
        "Təhlükəsizlik və sessiyalar",
      )}
    >
      <SignedIn>
        {a.customer && a.token && (
          <AccountSecurity
            token={a.token}
            customer={a.customer}
            locale={locale}
            onSignedOut={a.forget}
          />
        )}
      </SignedIn>
    </Page>
  );
}
