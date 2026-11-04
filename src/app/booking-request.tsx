import React, { useState, useEffect } from "react";
import { Text, View, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { useDiscovery } from "../state/discovery";
import { useAccount } from "../state/account";
import {
  Field,
  ErrorNotice,
  Tabs,
  useProblem,
} from "../features/account/components";
import {
  request,
  type Quote,
  type Currency,
  type Booking,
} from "../api/client";
const connections: Record<string, string[]> = {
  Baku: ["Baku", "Quba", "Gabala"],
  Quba: ["Quba", "Baku", "Khinalug"],
  Khinalug: ["Khinalug", "Quba"],
  Gabala: ["Gabala", "Baku", "Sheki"],
  Sheki: ["Sheki", "Gabala"],
};
export default function Builder() {
  const { slug: initialSlug } = useLocalSearchParams<{ slug?: string }>(),
    { t, locale, tours, title, planner, setPlanner } = useDiscovery(),
    a = useAccount(),
    problem = useProblem();
  const draft =
    planner && (!initialSlug || planner.slug === initialSlug) ? planner : null;
  const [slug, setSlug] = useState(draft?.slug || initialSlug || ""),
    [mode, setMode] = useState(draft?.mode || 0),
    [date, setDate] = useState(
      () =>
        draft?.date ||
        new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-CA", {
          timeZone: "Asia/Baku",
        }),
    ),
    [pax, setPax] = useState(draft?.pax || "2"),
    [cities, setCities] = useState(draft?.cities || ["Baku"]),
    [currency, setCurrency] = useState<Currency>(draft?.currency || "EUR"),
    [hotel, setHotel] = useState(draft?.hotel || "comfort"),
    [guideLanguage, setGuideLanguage] = useState(
      draft?.guideLanguage || locale,
    ),
    [services, setServices] = useState(
      draft?.services || {
        driver: true,
        stay: true,
        guide: true,
        transfer: false,
        activity: false,
      },
    ),
    [note, setNote] = useState(""),
    [quote, setQuote] = useState<Quote | null>(draft?.quote || null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [step, setStep] = useState(draft?.step || 0),
    [created, setCreated] = useState<Booking | null>(null);
  useEffect(() => {
    if (step < 3)
      setPlanner({
        slug,
        mode,
        date,
        pax,
        cities,
        currency,
        hotel,
        guideLanguage,
        services,
        quote,
        step,
      });
  }, [
    slug,
    mode,
    date,
    pax,
    cities,
    currency,
    hotel,
    guideLanguage,
    services,
    quote,
    step,
    setPlanner,
  ]);
  const selected = tours.find((x) => x.slug === slug) || tours[0];
  const invalidate = () => {
    setQuote(null);
    setError("");
  };
  const input = {
    slug: selected?.slug,
    date,
    pax: Number(pax),
    hotel,
    ...services,
    guideLanguage,
    currency,
    ...(mode === 1 ? { customDays: cities.length, cities } : {}),
  };
  async function price() {
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    try {
      const q = await request<Quote>("quotes", input);
      setQuote(q);
      setStep(2);
    } catch {
      setError(
        t(
          "Check the date (3–365 days ahead), travelers (1–12), route and services.",
          "Проверьте дату (через 3–365 дней), число гостей (1–12), маршрут и услуги.",
          "Tarixi (3–365 gün sonra), nəfər sayını (1–12), marşrut və xidmətləri yoxlayın.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (!quote || busy || !a.customer?.emailVerified) return;
    setBusy(true);
    setError("");
    try {
      const b = await a.call<Booking>("bookings", { quoteId: quote.id, note });
      setCreated(b);
      setStep(3);
      setPlanner(null);
    } catch {
      setError(problem());
    } finally {
      setBusy(false);
    }
  }
  const labels = {
    driver: t("Private driver", "Личный водитель", "Fərdi sürücü"),
    stay: t("Hotel", "Отель", "Otel"),
    guide: t("Local guide", "Местный гид", "Yerli gid"),
    transfer: t("Arrival transfer", "Трансфер", "Qarşılama transferi"),
    activity: t("Local experience", "Местный опыт", "Yerli təcrübə"),
  };
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
        {step === 3
          ? t("You’re on your way.", "Первый шаг сделан.", "İlk addım atıldı.")
          : step === 2
            ? t("Your journey request.", "Ваш запрос.", "Səfər sorğunuz.")
            : step === 1
              ? t(
                  "Your kind of journey.",
                  "Поездка по вашему вкусу.",
                  "Sizə uyğun səfər.",
                )
              : t("Where will you go?", "Куда отправимся?", "Hara gedək?")}
      </Text>
      <ErrorNotice message={error} />
      {step === 0 && (
        <>
          <Tabs
            items={[
              t("Choose a tour", "Выбрать тур", "Tur seç"),
              t("Build a route", "Собрать маршрут", "Marşrut qur"),
            ]}
            value={mode}
            onChange={(n) => {
              setMode(n);
              invalidate();
            }}
          />
          {mode === 0 ? (
            tours.map((x) => (
              <Button
                key={x.slug}
                outline={selected?.slug !== x.slug}
                onPress={() => {
                  setSlug(x.slug);
                  invalidate();
                }}
              >
                {title(x)} · {x.days} {t("days", "дн.", "gün")}
              </Button>
            ))
          ) : (
            <>
              <Text style={s.body}>
                {t(
                  "One city per day. Select only connected stops.",
                  "Один город в день. Выберите связанные остановки.",
                  "Hər günə bir şəhər. Yalnız uyğun keçidləri seçin.",
                )}
              </Text>
              {cities.map((city, i) => (
                <View key={i} style={{ gap: 8 }}>
                  <Text style={s.h2}>
                    {i + 1}. {city}
                  </Text>
                  {i === cities.length - 1 && cities.length > 1 && (
                    <Button
                      outline
                      onPress={() => {
                        setCities(cities.slice(0, -1));
                        invalidate();
                      }}
                    >
                      {t(
                        "Remove last day",
                        "Удалить последний день",
                        "Son günü sil",
                      )}
                    </Button>
                  )}
                </View>
              ))}
              {cities.length < 14 && (
                <View style={{ gap: 8 }}>
                  <Text style={s.body}>
                    {t(
                      "Add next day",
                      "Добавить день",
                      "Növbəti günü əlavə et",
                    )}
                  </Text>
                  {connections[cities[cities.length - 1]].map((city) => (
                    <Button
                      key={city}
                      outline
                      onPress={() => {
                        setCities([...cities, city]);
                        invalidate();
                      }}
                    >
                      {city}
                    </Button>
                  ))}
                </View>
              )}
            </>
          )}
          <Field
            label={t(
              "Departure · YYYY-MM-DD",
              "Выезд · YYYY-MM-DD",
              "Gediş · YYYY-MM-DD",
            )}
            value={date}
            onChangeText={(v) => {
              setDate(v);
              invalidate();
            }}
            maxLength={10}
          />
          <Field
            label={t("Travelers · 1–12", "Гости · 1–12", "Nəfər · 1–12")}
            keyboardType="number-pad"
            value={pax}
            onChangeText={(v) => {
              setPax(v);
              invalidate();
            }}
            maxLength={2}
          />
          <Button
            disabled={
              !selected ||
              !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date) ||
              !Number.isInteger(Number(pax)) ||
              Number(pax) < 1 ||
              Number(pax) > 12
            }
            onPress={() => setStep(1)}
          >
            {t("Choose services", "Выбрать услуги", "Xidmətləri seç")}
          </Button>
        </>
      )}
      {step === 1 && (
        <>
          {(Object.keys(services) as (keyof typeof services)[]).map((key) => (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: services[key] }}
              key={key}
              style={[s.card, s.row, { padding: 18 }]}
              onPress={() => {
                setServices({ ...services, [key]: !services[key] });
                invalidate();
              }}
            >
              <Text style={s.h2}>{services[key] ? "☑" : "☐"}</Text>
              <Text style={s.body}>{labels[key]}</Text>
            </Pressable>
          ))}
          {services.stay && (
            <>
              <Text style={s.h2}>
                {t("Hotel category", "Категория отеля", "Otel kateqoriyası")}
              </Text>
              {["standard", "comfort", "premium"].map((v) => (
                <Button
                  key={v}
                  outline={hotel !== v}
                  onPress={() => {
                    setHotel(v);
                    invalidate();
                  }}
                >
                  {
                    {
                      standard: t("Standard", "Стандарт", "Standart"),
                      comfort: t("Comfort", "Комфорт", "Komfort"),
                      premium: t("Premium", "Премиум", "Premium"),
                    }[v]
                  }
                </Button>
              ))}
            </>
          )}
          {services.guide && (
            <>
              <Text style={s.h2}>
                {t("Guide language", "Язык гида", "Gidin dili")}
              </Text>
              {(["en", "ru", "az"] as const).map((v) => (
                <Button
                  key={v}
                  outline={guideLanguage !== v}
                  onPress={() => {
                    setGuideLanguage(v);
                    invalidate();
                  }}
                >
                  {{ en: "English", ru: "Русский", az: "Azərbaycanca" }[v]}
                </Button>
              ))}
            </>
          )}
          <Text style={s.h2}>
            {t("Estimate currency", "Валюта расчёта", "Hesablamanın valyutası")}
          </Text>
          {(["EUR", "USD", "AZN"] as const).map((c) => (
            <Button
              key={c}
              outline={currency !== c}
              onPress={() => {
                setCurrency(c);
                invalidate();
              }}
            >
              {c}
            </Button>
          ))}
          <Button
            disabled={busy || !Object.values(services).some(Boolean)}
            onPress={() => void price()}
          >
            {busy
              ? t("Calculating…", "Расчёт…", "Hesablanır…")
              : t("Review estimate", "Посмотреть расчёт", "Hesablamaya bax")}
          </Button>
          <Button outline disabled={busy} onPress={() => setStep(0)}>
            {t("Edit route", "Изменить маршрут", "Marşrutu dəyiş")}
          </Button>
        </>
      )}
      {step === 2 && quote && (
        <>
          <Text style={s.body}>
            {date} · {pax} {t("travelers", "гостей", "nəfər")}
          </Text>
          {quote.lines.map((x, i) => (
            <View key={i} style={s.between}>
              <Text style={s.body}>
                {labels[x.label as keyof typeof labels] ||
                  { transport: labels.driver, hotel: labels.stay }[x.label] ||
                  x.label}
              </Text>
              <Text style={s.body}>
                {quote.currency} {x.amount}
              </Text>
            </View>
          ))}
          <View style={s.divider} />
          <Text style={s.h2}>
            {quote.currency} {quote.total}
          </Text>
          <Text style={s.muted}>
            {t(
              "Planning estimate only. The office checks availability and final prices. No payment is taken now; the deposit is set in the offer by your operator.",
              "Это предварительный расчёт. Офис проверит наличие и цену. Оплаты сейчас нет; депозит назначает оператор.",
              "Bu ilkin hesablamadır. Ofis mövcudluğu və son qiyməti yoxlayacaq. İndi ödəniş alınmır; behi operator təklifdə təyin edir.",
            )}
          </Text>
          <Field
            label={t(
              "Anything else we should know?",
              "Что ещё нам знать?",
              "Əlavə istəkləriniz?",
            )}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={2000}
          />
          {!a.customer ? (
            <Button onPress={() => router.push("/auth")}>
              {t(
                "Sign in to send request",
                "Войти для отправки",
                "Sorğu üçün daxil olun",
              )}
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
            <Button disabled={busy || a.offline} onPress={() => void send()}>
              {t(
                "Send request to office",
                "Отправить запрос в офис",
                "Ofisə sorğu göndər",
              )}
            </Button>
          )}
          <Button outline disabled={busy} onPress={() => setStep(1)}>
            {t("Edit services", "Изменить услуги", "Xidmətləri dəyiş")}
          </Button>
        </>
      )}
      {step === 3 && created && (
        <>
          <Text style={s.body}>
            {t(
              "Your request is with our office. We will prepare your offer after checking the services.",
              "Офис получил запрос. Предложение будет готово после проверки услуг.",
              "Sorğunuz ofisə çatdı. Xidmətlər yoxlanıldıqdan sonra təklif hazırlanacaq.",
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
        </>
      )}
    </Page>
  );
}
