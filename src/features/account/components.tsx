import React, { type PropsWithChildren } from "react";
import {
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  type TextInputProps,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router, type Href } from "expo-router";
import { s, Button } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
import { useAccount } from "../../state/account";
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.body}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          s.field,
          props.multiline && { minHeight: 105, paddingTop: 14 },
          props.style,
        ]}
      />
    </View>
  );
}
export function Row({
  label,
  value,
  icon = "chevron-right",
  onPress,
}: {
  label: string;
  value?: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        s.between,
        {
          padding: 17,
          minHeight: 60,
          borderBottomWidth: 1,
          borderColor: colors.line,
        },
      ]}
    >
      <Text style={[s.body, { flex: 1 }]}>{label}</Text>
      {!!value && <Text style={s.muted}>{value}</Text>}
      <Feather name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}
export function Menu({ children }: PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}
export function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={[s.body, { color: colors.accent }]}>
      {message}
    </Text>
  ) : null;
}
export function useProblem() {
  const { t } = useDiscovery();
  return () =>
    t(
      "Could not complete this action. Check your connection and refresh; the information may have changed.",
      "Не удалось выполнить действие. Проверьте соединение и обновите данные.",
      "Əməliyyat alınmadı. Bağlantını yoxlayıb yeniləyin; məlumatlar dəyişmiş ola bilər.",
    );
}
export function SignedIn({ children }: PropsWithChildren) {
  const a = useAccount(),
    { t } = useDiscovery();
  if (a.loading) return <ActivityIndicator color={colors.ink} />;
  if (!a.customer)
    return (
      <View style={{ gap: 20, paddingVertical: 30 }}>
        <Feather name="compass" size={40} color={colors.ink} />
        <Text style={s.title}>
          {t(
            "Your next chapter.",
            "Ваша следующая глава.",
            "Növbəti hekayəniz.",
          )}
        </Text>
        <Text style={s.body}>
          {t(
            "Sign in to see your journeys, offers and original travel documents.",
            "Войдите, чтобы увидеть поездки, предложения и документы.",
            "Səfər, təklif və orijinal sənədlərinizi görmək üçün daxil olun.",
          )}
        </Text>
        <Button onPress={() => router.push("/auth")}>
          {t(
            "Sign in / Create account",
            "Войти / Регистрация",
            "Daxil ol / Qeydiyyat",
          )}
        </Button>
      </View>
    );
  return (
    <>
      {a.offline && (
        <Text style={[s.muted, { color: colors.accent }]}>
          {t(
            "Offline. Saved documents show their last check time.",
            "Нет сети. Сохранённые документы показывают время последней проверки.",
            "Oflayn. Saxlanılan sənədlərdə son yoxlanma vaxtı göstərilir.",
          )}
        </Text>
      )}
      {children}
    </>
  );
}
export function Nav({ to, label }: { to: Href; label: string }) {
  return <Row label={label} onPress={() => router.push(to)} />;
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View
      style={[
        s.row,
        { borderBottomWidth: 1, borderColor: colors.line, flexWrap: "wrap" },
      ]}
    >
      {items.map((x, i) => (
        <Pressable
          key={x}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === value }}
          onPress={() => onChange(i)}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 8,
            borderBottomWidth: 2,
            borderColor: i === value ? colors.accent : "transparent",
          }}
        >
          <Text
            style={[
              s.body,
              { fontFamily: i === value ? "InterSemi" : "Inter" },
            ]}
          >
            {x}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
