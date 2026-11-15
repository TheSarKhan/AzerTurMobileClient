import React from "react";
import { Page } from "../design/ui";
import { useAccount } from "../state/account";
import { useDiscovery } from "../state/discovery";
import { SignedIn } from "../features/account/components";
import NotificationInbox from "../features/journeys/NotificationInbox";
export default function Notifications() {
  const a = useAccount(),
    { locale } = useDiscovery();
  return (
    <Page back>
      <SignedIn>
        {a.token && <NotificationInbox token={a.token} locale={locale} />}
      </SignedIn>
    </Page>
  );
}
