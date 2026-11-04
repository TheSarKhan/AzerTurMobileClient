import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { Button, s } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import type { RevisedPlan as Plan } from "./changes";
import { money } from "./model";
import { ErrorNotice, useProblem } from "../account/components";
export default function RevisedPlan({
  id,
  plan,
  onRefresh,
}: {
  id: string;
  plan: Plan;
  onRefresh: () => Promise<void>;
}) {
  const a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [checked, setChecked] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const p = JSON.parse(plan.payload) as {
    services: { key: string; name: string; total: number; policy: string }[];
    currency: string;
    totalMinor: number;
    paidMinor: number;
    remainingMinor: number;
  };
  return (
    <View style={[s.card, { padding: 18, gap: 15 }]}>
      <Text style={s.h2}>
        {t(
          "Revised payment plan",
          "Обновлённый план оплаты",
          "Yenilənmiş ödəniş planı",
        )}{" "}
        · v{plan.version}
      </Text>
      {p.services.map((x) => (
        <View key={x.key}>
          <Text style={s.body}>
            {x.name} · {money(x.total, p.currency, locale)}
          </Text>
          <Text style={s.muted}>{x.policy}</Text>
        </View>
      ))}
      <Text style={s.body}>
        {t("Total", "Сумма", "Cəmi")}:{" "}
        {money(p.totalMinor / 100, p.currency, locale)}
        {"\n"}
        {t("Applied funds", "Зачтено", "Tətbiq edilib")}:{" "}
        {money(p.paidMinor / 100, p.currency, locale)}
        {"\n"}
        {t("Remaining", "Остаток", "Qalıq")}:{" "}
        {money(p.remainingMinor / 100, p.currency, locale)}
      </Text>
      <ErrorNotice message={error} />
      {plan.state === "SENT" ? (
        <>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => setChecked(!checked)}
            style={s.row}
          >
            <Text style={s.h2}>{checked ? "☑" : "☐"}</Text>
            <Text style={[s.body, { flex: 1 }]}>
              {t(
                "I reviewed this payment plan.",
                "Я ознакомился с планом оплаты.",
                "Bu ödəniş planını oxudum.",
              )}
            </Text>
          </Pressable>
          <Button
            disabled={
              !checked || busy || a.offline || !a.customer?.emailVerified
            }
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await a.call("bookings/" + id + "/revised-plan", {
                  planId: plan.id,
                  version: plan.version,
                });
                await onRefresh();
              } catch {
                setChecked(false);
                setError(problem());
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("Confirm this plan", "Подтвердить план", "Bu planı təsdiqlə")}
          </Button>
          <Text style={s.muted}>
            {t(
              "Confirmation does not charge money.",
              "Подтверждение не списывает деньги.",
              "Təsdiq pul tutmur.",
            )}
          </Text>
        </>
      ) : (
        <Text style={s.body}>{plan.state}</Text>
      )}
    </View>
  );
}
