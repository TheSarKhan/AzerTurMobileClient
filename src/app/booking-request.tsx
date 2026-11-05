import React, { useState, useEffect } from "react";
import { Text, View, Pressable, Modal } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, router } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { colors } from "../design/theme";
import { useDiscovery } from "../state/discovery";
import { useAccount } from "../state/account";
import { Field, ErrorNotice, useProblem } from "../features/account/components";
import { RouteMap } from "../features/journeys/RouteMap";
import {
  MAX_DAYS,
  canRemoveStop,
  daysLeft,
  places,
  saveStop,
  stopOptions,
  templates,
  toRoute,
  toStops,
  withoutStop,
} from "../features/journeys/route";
import {
  request,
  type Quote,
  type Currency,
  type Booking,
  ApiError,
} from "../api/client";

type Services = {
  driver: boolean;
  stay: boolean;
  guide: boolean;
  transfer: boolean;
  activity: boolean;
};
const icons: Record<
  keyof Services,
  React.ComponentProps<typeof Feather>["name"]
> = {
  driver: "truck",
  stay: "home",
  guide: "users",
  transfer: "map-pin",
  activity: "star",
};
const label = {
  fontFamily: "InterSemi",
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase" as const,
  color: colors.muted,
};

export default function Builder() {
  const { slug: initialSlug } = useLocalSearchParams<{ slug?: string }>(),
    { t, locale, tours, planner, setPlanner } = useDiscovery(),
    a = useAccount(),
    problem = useProblem();
  const draft =
    planner && (!initialSlug || planner.slug === initialSlug) ? planner : null;
  const idx = locale === "az" ? 2 : locale === "ru" ? 1 : 0;
  const cityName = (city: string) => places[city]?.name[idx] ?? city;
  const [cities, setCities] = useState(
      draft?.cities || templates[initialSlug || ""] || ["Quba", "Khinalug"],
    ),
    [date, setDate] = useState(
      () =>
        draft?.date ||
        new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-CA", {
          timeZone: "Asia/Baku",
        }),
    ),
    [pax, setPax] = useState(draft?.pax || "2"),
    [currency] = useState<Currency>(draft?.currency || "EUR"),
    [hotel, setHotel] = useState(draft?.hotel || "comfort"),
    [guideLanguage, setGuideLanguage] = useState(
      draft?.guideLanguage || locale,
    ),
    [services, setServices] = useState<Services>(
      draft?.services || {
        driver: true,
        stay: true,
        guide: true,
        transfer: false,
        activity: false,
      },
    ),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [created, setCreated] = useState<Booking | null>(null),
    [stop, setStop] = useState<{
      index: number;
      city: string;
      days: number;
    } | null>(null);
  const slug = initialSlug || draft?.slug || tours[0]?.slug || "";
  const stops = toStops(cities),
    days = cities.length,
    nights = days - 1;
  useEffect(() => {
    if (!created)
      setPlanner({
        slug,
        mode: 1,
        date,
        pax,
        cities,
        currency,
        hotel,
        guideLanguage,
        services,
        quote: null,
        step: 0,
      });
  }, [
    slug,
    date,
    pax,
    cities,
    currency,
    hotel,
    guideLanguage,
    services,
    created,
    setPlanner,
  ]);
  const labels = {
    driver: t("Private driver", "Личный водитель", "Fərdi sürücü"),
    stay: t("Accommodation", "Проживание", "Qalma yeri"),
    guide: t("Local guide", "Местный гид", "Yerli gid"),
    transfer: t(
      "Airport transfer",
      "Трансфер из аэропорта",
      "Hava limanı transferi",
    ),
    activity: t(
      "Local craft experience",
      "Местный мастер-класс",
      "Yerli sənətkarlıq təcrübəsi",
    ),
  };
  const hints = {
    driver: t(
      "A private car with a driver every day",
      "Личный автомобиль с водителем каждый день",
      "Hər gün sürücülü şəxsi avtomobil",
    ),
    stay: t(
      "Our team confirms the property",
      "Отель подтвердит наша команда",
      "Oteli komandamız təsdiqləyir",
    ),
    guide: t(
      "A local guide for the whole trip",
      "Местный гид на всё путешествие",
      "Bütün səfər boyu yerli gid",
    ),
    transfer: t(
      "Pick-up on arrival",
      "Встреча по прилёту",
      "Gəlişdə qarşılanma",
    ),
    activity: t(
      "A hands-on workshop with local makers",
      "Мастер-класс у местных мастеров",
      "Yerli ustalarla praktik təcrübə",
    ),
  };
  const hotels = {
    standard: t("Standard", "Стандарт", "Standart"),
    comfort: t("Comfort", "Комфорт", "Komfort"),
    premium: t("Premium", "Премиум", "Premium"),
  };
  const langs = { en: "English", ru: "Русский", az: "Azərbaycanca" } as const;
  const stayOn = services.stay && nights > 0;
  const chosen = (Object.keys(services) as (keyof Services)[]).filter(
    (k) => services[k] && (k !== "stay" || nights > 0),
  );
  const validForm =
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date) &&
    Number.isInteger(Number(pax)) &&
    Number(pax) >= 1 &&
    Number(pax) <= 12 &&
    chosen.length > 0;
  const dayWord = (n: number) =>
    n === 1 ? t("day", "день", "gün") : t("days", "дн.", "gün");
  const dayRange = (i: number) => {
    const from = stops.slice(0, i).reduce((n, x) => n + x.days, 0) + 1,
      to = from + stops[i].days - 1;
    return from === to
      ? `${t("Day", "День", "Gün")} ${from}`
      : `${t("Days", "Дни", "Günlər")} ${from}–${to}`;
  };
  function openStop(index: number) {
    const existing = stops[index];
    setStop({
      index,
      city: existing ? existing.city : (stopOptions(stops, index)[0] ?? ""),
      days: existing ? existing.days : 1,
    });
  }
  const choices = stop ? stopOptions(stops, stop.index) : [];
  function applyStop() {
    if (!stop || !choices.includes(stop.city)) return;
    const next = saveStop(stops, stop.index, {
      city: stop.city,
      days: stop.days,
    });
    if (next) {
      setCities(next);
      setError("");
    }
    setStop(null);
  }
  async function send() {
    if (busy || !validForm) return;
    setBusy(true);
    setError("");
    try {
      // The server prices the request internally; the customer never sees amounts here.
      const q = await request<Quote>("quotes", {
        slug,
        date,
        pax: Number(pax),
        hotel,
        ...services,
        stay: stayOn,
        guideLanguage,
        currency,
        customDays: days,
        cities,
      });
      const b = await a.call<Booking>("bookings", { quoteId: q.id, note });
      setCreated(b);
      setPlanner(null);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 400
          ? t(
              "Check the date (3–365 days ahead), travelers (1–12), route and services, then try again.",
              "Проверьте дату (через 3–365 дней), число гостей (1–12), маршрут и услуги и повторите.",
              "Tarixi (3–365 gün sonra), nəfər sayını (1–12), marşrut və xidmətləri yoxlayıb yenidən cəhd edin.",
            )
          : problem(),
      );
    } finally {
      setBusy(false);
    }
  }
  const sendButton = !a.customer ? (
    <Button disabled={!validForm} onPress={() => router.push("/auth")}>
      {t("Sign in to send", "Войти для отправки", "Göndərmək üçün daxil olun")}
    </Button>
  ) : !a.customer.emailVerified ? (
    <Button onPress={() => router.push("/verify-email")}>
      {t(
        "Verify email to continue",
        "Подтвердить email",
        "Davam etmək üçün emaili təsdiqlə",
      )}
    </Button>
  ) : (
    <Button
      disabled={busy || a.offline || !validForm}
      onPress={() => void send()}
    >
      {busy
        ? t("Sending…", "Отправка…", "Göndərilir…")
        : t("Send to our team", "Отправить команде", "Komandaya göndər")}
    </Button>
  );
  if (created)
    return (
      <Page
        back
        title={t(
          "Plan your journey",
          "Спланировать поездку",
          "Səfərinizi planlayın",
        )}
      >
        <Text style={s.title}>
          {t("You’re on your way.", "Первый шаг сделан.", "İlk addım atıldı.")}
        </Text>
        <Text style={s.body}>
          {t(
            "Your request is with our team. We will check availability and send you a personal offer.",
            "Команда получила заявку. Мы проверим доступность и пришлём персональное предложение.",
            "Sorğunuz komandaya çatdı. Mövcudluğu yoxlayıb sizə fərdi təklif göndərəcəyik.",
          )}
        </Text>
        <Text style={s.muted}>#{created.id.slice(0, 8)}</Text>
        <Button
          onPress={() =>
            router.replace({
              pathname: "/trip/[id]",
              params: { id: created.id },
            })
          }
        >
          {t("Open my journey", "Открыть поездку", "Səfərimə bax")}
        </Button>
      </Page>
    );
  return (
    <>
      <Page
        back
        title={t(
          "Plan your journey",
          "Спланировать поездку",
          "Səfərinizi planlayın",
        )}
        footer={
          <>
            <ErrorNotice message={error} />
            <View style={s.between}>
              <Text style={s.muted}>
                {days} {dayWord(days)} · {chosen.length}{" "}
                {t("services", "услуг", "xidmət")}
              </Text>
              <Text style={s.muted}>
                {t("No payment now", "Без оплаты сейчас", "İndi ödəniş yoxdur")}
              </Text>
            </View>
            {sendButton}
          </>
        }
      >
        <Text style={s.title}>
          {t(
            "Your trip. Your choices.",
            "Ваш маршрут. Ваш выбор.",
            "Sənin səfərin. Sənin seçimin.",
          )}
        </Text>
        <Text style={s.muted}>
          {t(
            "Pick the route and what you need. Our team replies with a personal offer.",
            "Выберите маршрут и нужные услуги. Команда пришлёт персональное предложение.",
            "Marşrutu və lazım olanları seç. Komandamız fərdi təklif göndərəcək.",
          )}
        </Text>
        <View style={{ gap: 14 }}>
          <Field
            label={t(
              "Start date · YYYY-MM-DD",
              "Дата начала · YYYY-MM-DD",
              "Başlama tarixi · YYYY-MM-DD",
            )}
            value={date}
            onChangeText={setDate}
            maxLength={10}
          />
          <Field
            label={t("Travelers · 1–12", "Гости · 1–12", "Nəfər · 1–12")}
            keyboardType="number-pad"
            value={pax}
            onChangeText={setPax}
            maxLength={2}
          />
        </View>
        <View style={s.divider} />
        <Text style={label}>{t("Route", "Маршрут", "Marşrut")}</Text>
        <RouteMap
          stops={stops}
          name={cityName}
          label={
            t("Route: ", "Маршрут: ", "Marşrut: ") +
            stops.map((x) => cityName(x.city)).join(" → ")
          }
        />
        <View style={{ gap: 8 }}>
          {stops.map((x, i) => (
            <View
              key={i}
              style={[s.card, s.row, { padding: 12, paddingLeft: 14 }]}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontFamily: "InterSemi",
                    fontSize: 12,
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.body, { fontFamily: "InterSemi" }]}>
                  {cityName(x.city)}
                </Text>
                <Text style={s.muted}>
                  {dayRange(i)} · {x.days} {dayWord(x.days)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("Edit", "Изменить", "Dəyiş")}: ${cityName(x.city)}`}
                style={s.icon}
                onPress={() => openStop(i)}
              >
                <Feather name="edit-2" size={18} color={colors.ink} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("Remove", "Убрать", "Sil")}: ${cityName(x.city)}`}
                accessibilityState={{ disabled: !canRemoveStop(stops, i) }}
                disabled={!canRemoveStop(stops, i)}
                style={[s.icon, !canRemoveStop(stops, i) && { opacity: 0.3 }]}
                onPress={() => setCities(toRoute(withoutStop(stops, i)))}
              >
                <Feather name="x" size={20} color={colors.ink} />
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={
              days >= MAX_DAYS || !stopOptions(stops, stops.length).length
            }
            onPress={() => openStop(stops.length)}
            style={[
              s.row,
              {
                justifyContent: "center",
                minHeight: 46,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.ink,
                borderRadius: 9,
              },
              (days >= MAX_DAYS ||
                !stopOptions(stops, stops.length).length) && { opacity: 0.4 },
            ]}
          >
            <Feather name="plus" size={18} color={colors.ink} />
            <Text style={[s.body, { fontFamily: "InterSemi" }]}>
              {t("Add a stop", "Добавить остановку", "Dayanacaq əlavə et")}
            </Text>
          </Pressable>
          <Text style={s.muted}>
            {t(
              "Your return route is arranged with our team.",
              "Обратный маршрут согласуется с командой.",
              "Geri dönüş marşrutu komandamızla razılaşdırılır.",
            )}
          </Text>
        </View>
        {Object.keys(templates).some((k) =>
          tours.some((x) => x.slug === k),
        ) && (
          <View style={{ gap: 8 }}>
            <Text style={s.muted}>
              {t(
                "Or start from a ready-made tour:",
                "Или начните с готового тура:",
                "Və ya hazır turdan başla:",
              )}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {tours
                .filter((x) => templates[x.slug])
                .map((x) => (
                  <Pressable
                    key={x.slug}
                    accessibilityRole="button"
                    onPress={() => setCities(templates[x.slug])}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: 999,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      backgroundColor: colors.white,
                    }}
                  >
                    <Text style={s.body}>
                      {templates[x.slug].map(cityName).join(" → ")}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </View>
        )}
        <View style={s.divider} />
        <Text style={label}>
          {t("What do you need?", "Что вам нужно?", "Nələr lazımdır?")}
        </Text>
        <View style={{ gap: 8 }}>
          {(Object.keys(services) as (keyof Services)[]).map((key) => {
            const off = key === "stay" && nights === 0;
            const on = services[key] && !off;
            return (
              <View
                key={key}
                style={[
                  s.card,
                  { padding: 12, gap: 10 },
                  on && { borderColor: colors.ink },
                ]}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on, disabled: off }}
                  disabled={off}
                  style={[s.row, off && { opacity: 0.5 }]}
                  onPress={() =>
                    setServices({ ...services, [key]: !services[key] })
                  }
                >
                  <Feather
                    name={on ? "check-square" : "square"}
                    size={22}
                    color={colors.ink}
                  />
                  <Feather name={icons[key]} size={18} color={colors.ink} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.body, { fontFamily: "InterSemi" }]}>
                      {labels[key]}
                    </Text>
                    <Text style={s.muted}>
                      {off
                        ? t(
                            "Needs a trip of two days or more",
                            "Нужна поездка от двух дней",
                            "İki gün və daha uzun səfər lazımdır",
                          )
                        : hints[key]}
                    </Text>
                  </View>
                </Pressable>
                {key === "stay" && on && (
                  <Chips
                    items={Object.entries(hotels).map(([value, name]) => ({
                      value,
                      name,
                    }))}
                    value={hotel}
                    onChange={setHotel}
                    label={t(
                      "Accommodation category",
                      "Категория проживания",
                      "Qalma yerinin kateqoriyası",
                    )}
                  />
                )}
                {key === "guide" && on && (
                  <Chips
                    items={(Object.keys(langs) as (keyof typeof langs)[]).map(
                      (value) => ({ value, name: langs[value] }),
                    )}
                    value={guideLanguage}
                    onChange={(v) =>
                      setGuideLanguage(v as typeof guideLanguage)
                    }
                    label={t("Guide language", "Язык гида", "Gidin dili")}
                  />
                )}
              </View>
            );
          })}
        </View>
        <Field
          label={t(
            "Anything else we should know?",
            "Что ещё нам нужно знать?",
            "Əlavə nəyi bilməliyik?",
          )}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={2000}
        />
      </Page>
      <Modal
        visible={!!stop}
        transparent
        animationType="slide"
        onRequestClose={() => setStop(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View
            style={{
              backgroundColor: colors.paper,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 22,
              gap: 14,
              width: "100%",
              maxWidth: 560,
              alignSelf: "center",
              maxHeight: "90%",
            }}
          >
            <View style={s.between}>
              <Text style={s.h2}>
                {stop && stop.index >= stops.length
                  ? t("Add a stop", "Добавить остановку", "Dayanacaq əlavə et")
                  : t(
                      "Edit the stop",
                      "Изменить остановку",
                      "Dayanacağı dəyiş",
                    )}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Close", "Закрыть", "Bağla")}
                style={s.icon}
                onPress={() => setStop(null)}
              >
                <Feather name="x" size={22} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={s.muted}>
              {t(
                "Choose where you go next and how many days you stay. Our team arranges the transfers.",
                "Выберите, куда едете дальше и сколько дней остаётесь. Переезды организует команда.",
                "Növbəti istiqaməti və orada neçə gün qalacağını seç. Yerdəyişmələri komandamız təşkil edir.",
              )}
            </Text>
            {choices.length ? (
              <View style={{ gap: 8 }}>
                {choices.map((city) => (
                  <Pressable
                    key={city}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: stop?.city === city }}
                    onPress={() => setStop((d) => (d ? { ...d, city } : d))}
                    style={[
                      s.card,
                      s.row,
                      { padding: 12 },
                      stop?.city === city && {
                        borderColor: colors.ink,
                        backgroundColor: "#EEF2EC",
                      },
                    ]}
                  >
                    <Feather
                      name={stop?.city === city ? "check-circle" : "circle"}
                      size={20}
                      color={colors.ink}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.body, { fontFamily: "InterSemi" }]}>
                        {cityName(city)}
                      </Text>
                      <Text style={s.muted}>{places[city]?.note[idx]}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={s.body}>
                {t(
                  "No other destination is available here.",
                  "Других направлений здесь нет.",
                  "Burada başqa istiqamət yoxdur.",
                )}
              </Text>
            )}
            <View style={s.between}>
              <Text style={s.body}>
                {t(
                  "Days at this stop",
                  "Дней на остановке",
                  "Bu dayanacaqda neçə gün",
                )}
              </Text>
              <View style={s.row}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    "Fewer days",
                    "Меньше дней",
                    "Daha az gün",
                  )}
                  disabled={!stop || stop.days <= 1}
                  style={[
                    s.icon,
                    {
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: 9,
                    },
                    (!stop || stop.days <= 1) && { opacity: 0.35 },
                  ]}
                  onPress={() =>
                    setStop((d) => (d ? { ...d, days: d.days - 1 } : d))
                  }
                >
                  <Feather name="minus" size={18} color={colors.ink} />
                </Pressable>
                <Text style={[s.body, { minWidth: 56, textAlign: "center" }]}>
                  {stop?.days} {dayWord(stop?.days ?? 1)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    "More days",
                    "Больше дней",
                    "Daha çox gün",
                  )}
                  disabled={!stop || stop.days >= daysLeft(stops, stop.index)}
                  style={[
                    s.icon,
                    {
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: 9,
                    },
                    (!stop || stop.days >= daysLeft(stops, stop.index)) && {
                      opacity: 0.35,
                    },
                  ]}
                  onPress={() =>
                    setStop((d) => (d ? { ...d, days: d.days + 1 } : d))
                  }
                >
                  <Feather name="plus" size={18} color={colors.ink} />
                </Pressable>
              </View>
            </View>
            <Text style={s.muted}>
              {t("Up to", "Всего до", "Ümumilikdə")} {MAX_DAYS}{" "}
              {t("days in total", "дней", "günədək")}
            </Text>
            <Button
              disabled={!stop || !choices.includes(stop.city)}
              onPress={applyStop}
            >
              {stop && stop.index >= stops.length
                ? t("Add to route", "Добавить в маршрут", "Marşruta əlavə et")
                : t("Save", "Сохранить", "Yadda saxla")}
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Chips({
  items,
  value,
  onChange,
  label: accessibilityLabel,
}: {
  items: { value: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
    >
      {items.map((item) => (
        <Pressable
          key={item.value}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === item.value }}
          onPress={() => onChange(item.value)}
          style={{
            borderWidth: 1,
            borderColor: value === item.value ? colors.ink : colors.line,
            backgroundColor: value === item.value ? colors.ink : colors.white,
            borderRadius: 999,
            paddingVertical: 8,
            paddingHorizontal: 14,
          }}
        >
          <Text
            style={[
              s.body,
              { color: value === item.value ? colors.white : colors.ink },
            ]}
          >
            {item.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
