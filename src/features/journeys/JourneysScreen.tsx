import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  getTours,
  createQuote,
  request,
  ApiError,
  type Tour,
  type Quote,
  type Session,
  type Customer,
  type Booking,
  type BookingRequest,
  type Locale,
  type Currency,
} from "../../api/client";
import { readSession, saveSession, clearSession } from "../../api/session";
export function JourneysScreen() {
  const [locale, setLocale] = useState<Locale>("az"),
    [currency, setCurrency] = useState<Currency>("EUR"),
    [screen, setScreen] = useState<
      "journeys" | "trips" | "account" | "checkout"
    >("journeys"),
    [list, setList] = useState<Tour[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Tour | null>(null),
    [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [pax, setPax] = useState(2),
    [date, setDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    }),
    [customer, setCustomer] = useState<Customer | null>(null),
    [token, setToken] = useState<string | null>(null),
    [register, setRegister] = useState(false),
    [items, setItems] = useState<Booking[]>([]),
    [requests, setRequests] = useState<BookingRequest[]>([]),
    [notice, setNotice] = useState(""),
    [note, setNote] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [requestBooking, setRequestBooking] = useState<string | null>(null),
    [requestKind, setRequestKind] = useState<"CHANGE" | "CANCEL">("CHANGE"),
    [message, setMessage] = useState("");
  const t = (en: string, ru: string, az: string) =>
    locale === "az" ? az : locale === "ru" ? ru : en;
  const status = (key: string) =>
    ({
      PENDING_REVIEW: t(
        "Waiting for operator review",
        "На проверке у оператора",
        "Operator yoxlamasını gözləyir",
      ),
      AWAITING_PAYMENT: t(
        "Approved · deposit required",
        "Одобрено · нужен депозит",
        "Təsdiqlənib · depozit gözlənilir",
      ),
      CONFIRMED: t("Confirmed", "Подтверждено", "Təsdiqlənib"),
      REJECTED: t("Not approved", "Не одобрено", "Təsdiqlənməyib"),
      CANCELLED: t("Cancelled", "Отменено", "Ləğv edilib"),
    })[key] || key;
  const amount = (n: number, c: Currency) =>
    new Intl.NumberFormat(
      locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-GB",
      { style: "currency", currency: c, maximumFractionDigits: 0 },
    ).format(n);
  function problem(e: unknown) {
    if (e instanceof ApiError && e.code === "DEMO_PAYMENT_FAILED")
      return t(
        "Demo payment failed. Nothing was charged.",
        "Демо-платёж не прошёл. Списания не было.",
        "Demo ödəniş alınmadı. Məbləğ tutulmadı.",
      );
    if (e instanceof ApiError && e.status === 401)
      return t(
        "Sign in again. Check your email and password.",
        "Войдите снова. Проверьте email и пароль.",
        "Yenidən daxil olun. Email və şifrəni yoxlayın.",
      );
    return t(
      "Request failed. Check your details and connection, then refresh.",
      "Запрос не выполнен. Проверьте данные и соединение, обновите.",
      "Sorğu alınmadı. Məlumatları və bağlantını yoxlayıb yeniləyin.",
    );
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      setList(await getTours());
    } catch (e) {
      setError(problem(e));
    } finally {
      setLoading(false);
    }
  }
  async function loadTrips(activeToken = token) {
    if (!activeToken) return;
    setBusy(true);
    try {
      const [b, r] = await Promise.all([
        request<Booking[]>("bookings", undefined, activeToken),
        request<BookingRequest[]>("bookings/requests", undefined, activeToken),
      ]);
      setItems(b);
      setRequests(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await clearSession();
        setToken(null);
        setCustomer(null);
      }
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    const saved = await readSession();
    if (!saved) return;
    try {
      const c = await request<Customer>("auth/me", undefined, saved);
      setToken(saved);
      setCustomer(c);
      setLocale(c.locale);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await clearSession();
        setToken(null);
        setCustomer(null);
      } else {
        setToken(saved);
        setError(problem(e));
      }
    }
  }
  useEffect(() => {
    void load();
    void restore();
  }, []);
  async function price() {
    if (!selected || busy) return;
    setBusy(true);
    setQuote(null);
    setError("");
    try {
      setQuote(await createQuote(selected, date, pax, currency, locale));
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  }
  async function authenticate() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const session = await request<Session>(
        "auth/" + (register ? "register" : "login"),
        { email, password, ...(register ? { name, locale } : {}) },
      );
      await saveSession(session.token);
      setToken(session.token);
      setCustomer(session.customer);
      setPassword("");
      if (quote) setScreen("checkout");
      else {
        setScreen("trips");
        await loadTrips(session.token);
      }
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  }
  async function sendBooking() {
    if (!quote || !token || busy) return;
    setBusy(true);
    setError("");
    try {
      await request("bookings", { quoteId: quote.id, note }, token);
      setQuote(null);
      setNote("");
      setScreen("trips");
      setNotice(
        t(
          "Your request is waiting for operator review.",
          "Ваш запрос ожидает проверки.",
          "Sorğunuz operator yoxlamasını gözləyir.",
        ),
      );
      await loadTrips();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  }
  async function pay(b: Booking, success: boolean) {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      await request(
        "bookings/" + b.id + "/demo-payment",
        {
          kind: b.status === "AWAITING_PAYMENT" ? "DEPOSIT" : "BALANCE",
          success,
        },
        token,
        Date.now() + "-" + Math.random().toString(36).slice(2) + "-" + b.id,
      );
      setNotice(
        t(
          "Demo payment recorded. No real money was charged.",
          "Демо-оплата сохранена. Реального списания не было.",
          "Demo ödəniş qeydə alındı. Real pul tutulmadı.",
        ),
      );
      await loadTrips();
    } catch (e) {
      setError(problem(e));
      await loadTrips();
    } finally {
      setBusy(false);
    }
  }
  const authForm = (
    <View style={s.planner}>
      <Text accessibilityRole="header" style={s.section}>
        {register
          ? t("Create account", "Создать аккаунт", "Qeydiyyat")
          : t("Sign in", "Войти", "Daxil ol")}
      </Text>
      <Text style={s.note}>
        {t(
          "Registration is required before requesting a reservation.",
          "Для запроса бронирования нужен аккаунт.",
          "Rezervasiya sorğusu üçün qeydiyyat vacibdir.",
        )}
      </Text>
      {register && (
        <>
          <Text style={s.label}>
            {t("Full name", "Имя и фамилия", "Ad və soyad")}
          </Text>
          <TextInput
            accessibilityLabel={t("Full name", "Имя и фамилия", "Ad və soyad")}
            style={s.input}
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoComplete="name"
          />
        </>
      )}
      <Text style={s.label}>{t("Email", "Email", "Email")}</Text>
      <TextInput
        accessibilityLabel="Email"
        style={s.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Text style={s.label}>{t("Password", "Пароль", "Şifrə")}</Text>
      <TextInput
        accessibilityLabel={t("Password", "Пароль", "Şifrə")}
        style={s.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        maxLength={72}
        autoComplete={register ? "new-password" : "current-password"}
      />
      {register && (
        <Text style={s.note}>
          {t(
            "At least 12 characters. Email verification and recovery will follow SMTP setup.",
            "Не менее 12 символов. Подтверждение и восстановление почты — после SMTP.",
            "Ən azı 12 simvol. Email təsdiqi və şifrənin bərpası SMTP qoşulandan sonra aktivləşəcək.",
          )}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={
          busy ||
          !email ||
          !password ||
          (register && (password.length < 12 || name.trim().length < 2))
        }
        style={s.button}
        onPress={() => void authenticate()}
      >
        <Text style={s.buttonText}>
          {busy
            ? t("Please wait…", "Подождите…", "Gözləyin…")
            : register
              ? t("Create account", "Создать аккаунт", "Qeydiyyatdan keç")
              : t("Sign in", "Войти", "Daxil ol")}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={s.secondary}
        onPress={() => {
          setRegister(!register);
          setError("");
        }}
      >
        <Text>
          {register
            ? t(
                "Already registered? Sign in",
                "Уже есть аккаунт? Войти",
                "Hesabınız var? Daxil olun",
              )
            : t(
                "New here? Create an account",
                "Впервые здесь? Создать аккаунт",
                "Yenisiniz? Qeydiyyatdan keçin",
              )}
        </Text>
      </Pressable>
    </View>
  );
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            void load();
            if (screen === "trips") void loadTrips();
            if (!customer) void restore();
          }}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.header}>
        <Text style={s.brand}>azertur</Text>
        <Text style={s.local}>
          {t(
            "Azerbaijan, at your own pace.",
            "Азербайджан в вашем ритме.",
            "Azərbaycan, sizin ritminizlə.",
          )}
        </Text>
        <View style={s.options}>
          {(["az", "en", "ru"] as Locale[]).map((l) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Language " + l}
              accessibilityState={{ selected: locale === l }}
              key={l}
              style={[s.option, locale === l && s.active]}
              onPress={() => {
                setLocale(l);
                setQuote(null);
              }}
            >
              <Text>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={s.nav}>
        {[
          ["journeys", t("Journeys", "Туры", "Turlar")],
          ["trips", t("My trips", "Мои поездки", "Səfərlərim")],
          ["account", t("Account", "Аккаунт", "Hesab")],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            style={[s.navItem, screen === key && s.active]}
            onPress={() => {
              setScreen(key as typeof screen);
              setError("");
              if (key === "trips") void loadTrips();
            }}
          >
            <Text>{label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? (
        <View style={s.error}>
          <Text accessibilityRole="alert">{error}</Text>
        </View>
      ) : null}
      {notice && <Text style={s.notice}>{notice}</Text>}
      {screen === "journeys" && (
        <>
          <Text accessibilityRole="header" style={s.title}>
            {t("Take the", "Выбирайте", "Öz")}
            {"\n"}
            {t("scenic route.", "свой маршрут.", "marşrutunu seç.")}
          </Text>
          <Text style={s.lead}>
            {t(
              "Private journeys. Local perspective.",
              "Индивидуальные поездки. Местный взгляд.",
              "Fərdi səfərlər. Yerli baxış.",
            )}
          </Text>
          {loading && <ActivityIndicator color="#405b46" />}
          {!loading && !list.length && (
            <Pressable
              accessibilityRole="button"
              style={s.secondary}
              onPress={() => void load()}
            >
              <Text>{t("Try again", "Повторить", "Yenidən yoxla")}</Text>
            </Pressable>
          )}
          {list.map((tour) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tour.titleEn}
              key={tour.slug}
              style={[s.card, selected?.slug === tour.slug && s.chosen]}
              onPress={() => {
                setSelected(tour);
                setQuote(null);
              }}
            >
              <Text style={s.region}>
                {tour.region} · {tour.days} {t("days", "дн.", "gün")}
              </Text>
              <Text style={s.name}>
                {locale === "az"
                  ? tour.titleAz
                  : locale === "ru"
                    ? tour.titleRu
                    : tour.titleEn}
              </Text>
              <Text style={s.from}>
                {t("From", "От", "Başlayan qiymət")} €{tour.fromPriceEur} /{" "}
                {t("person", "чел.", "nəfər")} ↗
              </Text>
            </Pressable>
          ))}
          {selected && (
            <View style={s.planner}>
              <Text accessibilityRole="header" style={s.section}>
                {t(
                  "Make it your trip.",
                  "Ваша поездка.",
                  "Səfəri özünə uyğunlaşdır.",
                )}
              </Text>
              <Text style={s.label}>
                {t(
                  "Start date · YYYY-MM-DD",
                  "Дата · YYYY-MM-DD",
                  "Başlama tarixi · YYYY-MM-DD",
                )}
              </Text>
              <TextInput
                accessibilityLabel={t(
                  "Start date",
                  "Дата начала",
                  "Başlama tarixi",
                )}
                style={s.input}
                value={date}
                onChangeText={(v) => {
                  setDate(v);
                  setQuote(null);
                }}
                autoCapitalize="none"
              />
              <View style={s.row}>
                <Text>{t("Travellers", "Участники", "Səyahətçilər")}</Text>
                <View style={s.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove traveller"
                    disabled={pax <= 1 || busy}
                    onPress={() => {
                      setPax(pax - 1);
                      setQuote(null);
                    }}
                  >
                    <Text style={s.step}>−</Text>
                  </Pressable>
                  <Text>{pax}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add traveller"
                    disabled={pax >= 12 || busy}
                    onPress={() => {
                      setPax(pax + 1);
                      setQuote(null);
                    }}
                  >
                    <Text style={s.step}>+</Text>
                  </Pressable>
                </View>
              </View>
              <View style={s.options}>
                {(["EUR", "USD", "AZN"] as Currency[]).map((c) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: currency === c }}
                    key={c}
                    style={[s.option, currency === c && s.active]}
                    onPress={() => {
                      setCurrency(c);
                      setQuote(null);
                    }}
                  >
                    <Text>{c}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.note}>
                {t(
                  "Comfort hotel, driver and guide. Operator checks availability before payment.",
                  "Отель комфорт, водитель и гид. Оператор проверит наличие до оплаты.",
                  "Komfort otel, sürücü və gid. Ödənişdən əvvəl operator mövcudluğu yoxlayır.",
                )}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                style={s.button}
                onPress={() => void price()}
              >
                <Text style={s.buttonText}>
                  {busy
                    ? t("Calculating…", "Расчёт…", "Hesablanır…")
                    : t("Calculate my trip", "Рассчитать", "Səfəri hesabla")}
                </Text>
              </Pressable>
              {quote && (
                <View style={s.result}>
                  <Text style={s.total}>
                    {amount(quote.total, quote.currency)}
                  </Text>
                  {quote.lines.map((line) => (
                    <Text key={line.label}>
                      {(
                        {
                          transport: t("Driver", "Водитель", "Sürücü"),
                          hotel: t("Hotel", "Отель", "Otel"),
                          guide: t("Guide", "Гид", "Gid"),
                          transfer: t("Transfer", "Трансфер", "Transfer"),
                          activity: t("Experience", "Впечатление", "Təcrübə"),
                        } as Record<string, string>
                      )[line.label] || line.label}
                      : {amount(line.amount, quote.currency)}
                    </Text>
                  ))}
                  <Text>
                    {t(
                      "Deposit after approval",
                      "Депозит после одобрения",
                      "Təsdiqdən sonra depozit",
                    )}
                    : {amount(quote.deposit, quote.currency)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    style={s.button}
                    onPress={() => setScreen(customer ? "checkout" : "account")}
                  >
                    <Text style={s.buttonText}>
                      {t(
                        "Request operator review",
                        "На проверку оператору",
                        "Operator yoxlamasına göndər",
                      )}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </>
      )}
      {screen === "account" &&
        (customer ? (
          <View style={s.planner}>
            <Text style={s.section}>{customer.name}</Text>
            <Text>{customer.email}</Text>
            <Pressable
              accessibilityRole="button"
              style={s.secondary}
              onPress={async () => {
                try {
                  if (token) await request("auth/logout", {}, token);
                } catch {
                } finally {
                  await clearSession();
                  setToken(null);
                  setCustomer(null);
                  setItems([]);
                  setRequests([]);
                  setQuote(null);
                  setPassword("");
                }
              }}
            >
              <Text>{t("Sign out", "Выйти", "Çıxış")}</Text>
            </Pressable>
          </View>
        ) : (
          authForm
        ))}
      {screen === "checkout" &&
        (customer && quote ? (
          <View style={s.planner}>
            <Text style={s.section}>
              {t("Send for review.", "На проверку.", "Yoxlamaya göndər.")}
            </Text>
            <Text>
              {customer.name} · {customer.email}
            </Text>
            <Text style={s.total}>{amount(quote.total, quote.currency)}</Text>
            <Text style={s.note}>
              {t(
                "No payment is taken now. The office team will review your request.",
                "Оплаты сейчас нет. Офис проверит запрос.",
                "İndi ödəniş edilmir. Ofis komandası sorğunuzu yoxlayacaq.",
              )}
            </Text>
            <Text style={s.label}>
              {t("Travel notes", "Пожелания", "Səfər qeydləri")}
            </Text>
            <TextInput
              accessibilityLabel={t(
                "Travel notes",
                "Пожелания",
                "Səfər qeydləri",
              )}
              style={[s.input, { minHeight: 100 }]}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={2000}
            />
            <Pressable
              accessibilityRole="button"
              style={s.button}
              disabled={busy}
              onPress={() => void sendBooking()}
            >
              <Text style={s.buttonText}>
                {t("Send request", "Отправить", "Sorğunu göndər")}
              </Text>
            </Pressable>
          </View>
        ) : (
          authForm
        ))}
      {screen === "trips" &&
        (customer ? (
          <View style={s.planner}>
            <Text style={s.section}>
              {t("Your journeys.", "Ваши поездки.", "Səfərləriniz.")}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={s.secondary}
              onPress={() => void loadTrips()}
            >
              <Text>{t("Refresh", "Обновить", "Yenilə")}</Text>
            </Pressable>
            {busy && <ActivityIndicator color="#405b46" />}
            {!busy && !items.length && (
              <Text style={s.note}>
                {t(
                  "No reservations yet. Choose a journey to begin.",
                  "Бронирований нет. Выберите поездку.",
                  "Hələ rezervasiya yoxdur. Başlamaq üçün tur seçin.",
                )}
              </Text>
            )}
            {items.map((b) => (
              <View key={b.id} style={s.card}>
                <Text style={s.region}>{b.id.slice(0, 8)}</Text>
                <Text style={s.name}>
                  {(() => {
                    try {
                      const slug = JSON.parse(b.quotePayload).input.slug;
                      const tour = list.find((t) => t.slug === slug);
                      return tour
                        ? locale === "az"
                          ? tour.titleAz
                          : locale === "ru"
                            ? tour.titleRu
                            : tour.titleEn
                        : b.title;
                    } catch {
                      return b.title;
                    }
                  })()}
                </Text>
                <Text style={s.status}>{status(b.status)}</Text>
                <Text>
                  {b.departure} · {amount(b.total, b.currency)}
                </Text>
                <Text>
                  {t("Paid", "Оплачено", "Ödənilib")}:{" "}
                  {amount(b.paid, b.currency)}
                </Text>
                {b.operatorNote ? (
                  <Text style={s.note}>{b.operatorNote}</Text>
                ) : null}
                {b.status === "PENDING_REVIEW" && (
                  <Text style={s.note}>
                    {t(
                      "Payment opens after operator approval.",
                      "Оплата доступна после одобрения.",
                      "Ödəniş operator təsdiqindən sonra açılır.",
                    )}
                  </Text>
                )}
                {(b.status === "AWAITING_PAYMENT" ||
                  (b.status === "CONFIRMED" && b.paid < b.total)) &&
                  !requests.some(
                    (r) => r.bookingId === b.id && r.status === "PENDING",
                  ) && (
                    <View>
                      <Text style={s.note}>
                        {t(
                          "Demo only. No real money is charged.",
                          "Только демо. Реального списания нет.",
                          "Yalnız demo. Real pul tutulmur.",
                        )}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        style={s.button}
                        disabled={busy}
                        onPress={() => void pay(b, true)}
                      >
                        <Text style={s.buttonText}>
                          {t("Demo pay", "Демо-оплата", "Demo ödəniş")} ·{" "}
                          {amount(
                            b.status === "AWAITING_PAYMENT"
                              ? b.deposit
                              : b.total - b.paid,
                            b.currency,
                          )}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        style={s.secondary}
                        disabled={busy}
                        onPress={() => void pay(b, false)}
                      >
                        <Text>
                          {t(
                            "Test failed payment",
                            "Проверить ошибку",
                            "Uğursuz ödənişi yoxla",
                          )}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                {b.status === "CANCELLED" && b.paid > 0 && (
                  <Text style={s.note}>
                    {t(
                      "Refunds are handled manually by office staff. Demo funds only.",
                      "Возврат обрабатывает офис. Только демо-средства.",
                      "Geri ödənişi ofis əməkdaşı idarə edir. Yalnız demo məbləğidir.",
                    )}
                  </Text>
                )}
                {requests
                  .filter((r) => r.bookingId === b.id)
                  .map((r) => (
                    <View key={r.id} style={s.request}>
                      <Text style={s.status}>
                        {r.kind === "CANCEL"
                          ? t("Cancellation", "Отмена", "Ləğv")
                          : t("Change", "Изменение", "Dəyişiklik")}{" "}
                        ·{" "}
                        {r.status === "PENDING"
                          ? t("Waiting", "Ожидает", "Gözləyir")
                          : r.status === "ACCEPTED"
                            ? t("Accepted", "Принято", "Qəbul edilib")
                            : t("Declined", "Отклонено", "Rədd edilib")}
                      </Text>
                      <Text>{r.message}</Text>
                      {r.response && <Text style={s.note}>{r.response}</Text>}
                    </View>
                  ))}
                {!["CANCELLED", "REJECTED"].includes(b.status) &&
                  !requests.some(
                    (r) => r.bookingId === b.id && r.status === "PENDING",
                  ) && (
                    <Pressable
                      accessibilityRole="button"
                      style={s.secondary}
                      onPress={() => {
                        setRequestBooking(
                          requestBooking === b.id ? null : b.id,
                        );
                        setMessage("");
                      }}
                    >
                      <Text>
                        {t(
                          "Request change / cancellation",
                          "Изменить / отменить",
                          "Dəyişiklik / ləğv sorğusu",
                        )}
                      </Text>
                    </Pressable>
                  )}
                {requestBooking === b.id && (
                  <View>
                    <View style={s.options}>
                      {(["CHANGE", "CANCEL"] as const).map((kind) => (
                        <Pressable
                          accessibilityRole="button"
                          style={[s.option, requestKind === kind && s.active]}
                          key={kind}
                          onPress={() => setRequestKind(kind)}
                        >
                          <Text>
                            {kind === "CHANGE"
                              ? t("Change", "Изменение", "Dəyişiklik")
                              : t("Cancel", "Отмена", "Ləğv")}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      accessibilityLabel={t(
                        "Your message",
                        "Сообщение",
                        "Mesajınız",
                      )}
                      style={[s.input, { minHeight: 100 }]}
                      value={message}
                      onChangeText={setMessage}
                      multiline
                      maxLength={2000}
                    />
                    <Pressable
                      accessibilityRole="button"
                      style={s.button}
                      disabled={busy || message.trim().length < 5}
                      onPress={async () => {
                        if (!token || busy) return;
                        setBusy(true);
                        setError("");
                        try {
                          await request(
                            "bookings/" + b.id + "/requests",
                            { kind: requestKind, message },
                            token,
                          );
                          setRequestBooking(null);
                          setMessage("");
                          await loadTrips();
                        } catch (e) {
                          setError(problem(e));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <Text style={s.buttonText}>
                        {t("Send request", "Отправить", "Sorğunu göndər")}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          authForm
        ))}
      <Text style={s.footer}>
        {t(
          "Development release · demo payments only. Email, WhatsApp and push require provider configuration.",
          "Версия в разработке · демо-оплата. Email, WhatsApp и push требуют настройки.",
          "İnkişaf versiyası · yalnız demo ödəniş. Email, WhatsApp və push üçün provayder konfiqurasiyası lazımdır.",
        )}
      </Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F5EF" },
  content: { padding: 24, paddingTop: 64, paddingBottom: 56 },
  header: { paddingBottom: 24, borderBottomWidth: 1, borderColor: "#D8DDD5" },
  brand: {
    fontSize: 30,
    fontWeight: "800",
    color: "#222923",
    letterSpacing: -1.5,
  },
  local: { fontSize: 11, color: "#626A63", marginTop: 6 },
  nav: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 24 },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D8DDD5",
    borderRadius: 4,
  },
  options: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 16,
    flexWrap: "wrap",
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D8DDD5",
    borderRadius: 4,
  },
  active: { borderColor: "#405B46", backgroundColor: "#EAEFE7" },
  title: {
    fontSize: 47,
    lineHeight: 52,
    fontWeight: "800",
    letterSpacing: -2.5,
    color: "#222923",
    marginTop: 40,
  },
  lead: {
    fontSize: 15,
    lineHeight: 24,
    color: "#626A63",
    marginTop: 20,
    marginBottom: 32,
  },
  card: {
    padding: 22,
    borderWidth: 1,
    borderColor: "#D8DDD5",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "white",
  },
  chosen: { borderColor: "#405B46", backgroundColor: "#EAEFE7" },
  region: { fontSize: 11, color: "#626A63" },
  name: {
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -1,
    color: "#222923",
    marginTop: 16,
    marginBottom: 10,
  },
  from: { fontSize: 14, marginTop: 24, color: "#222923" },
  planner: { marginTop: 24, paddingTop: 24 },
  section: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -1,
    color: "#222923",
    marginBottom: 24,
  },
  label: { fontSize: 12, color: "#626A63", marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D8DDD5",
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  step: { padding: 12, fontSize: 22 },
  note: { fontSize: 12, lineHeight: 20, color: "#626A63", marginVertical: 16 },
  button: {
    backgroundColor: "#B54126",
    padding: 18,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "white", fontWeight: "600" },
  secondary: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#D8DDD5",
    borderRadius: 5,
    alignItems: "center",
    marginTop: 12,
  },
  result: {
    backgroundColor: "#EAEFE7",
    padding: 24,
    marginTop: 24,
    borderRadius: 6,
    gap: 8,
  },
  total: {
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -2,
    color: "#222923",
    marginVertical: 12,
  },
  footer: { fontSize: 11, lineHeight: 19, color: "#626A63", marginTop: 36 },
  error: { padding: 20, backgroundColor: "#FBE8E2", marginTop: 24 },
  notice: {
    padding: 16,
    backgroundColor: "#EAEFE7",
    lineHeight: 21,
    marginTop: 16,
  },
  status: {
    color: "#405B46",
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 12,
  },
  request: {
    borderTopWidth: 1,
    borderColor: "#D8DDD5",
    marginTop: 16,
    paddingTop: 12,
  },
});
