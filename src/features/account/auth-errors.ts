/** The message shown under the sign-in and sign-up form, chosen from what really went wrong. */
export type AuthIssue = { status: number | null; code: string };
type Pick = (en: string, ru: string, az: string) => string;

export function authMessage(
  issue: AuthIssue,
  mode: "login" | "register",
  t: Pick,
): string {
  const { status, code } = issue;
  if (status === null)
    return t(
      "Cannot reach the server. Check your connection and try again.",
      "Нет связи с сервером. Проверьте подключение и повторите.",
      "Serverə qoşulmaq mümkün olmadı. Bağlantını yoxla və yenidən cəhd et.",
    );
  if (status === 429)
    return t(
      "Please wait before trying again.",
      "Подождите перед повторной попыткой.",
      "Yenidən cəhd etməzdən əvvəl gözləyin.",
    );
  if (status >= 500)
    return t(
      "Something went wrong on our side. Please try again shortly.",
      "Что-то пошло не так на нашей стороне. Повторите чуть позже.",
      "Bizim tərəfdə xəta baş verdi. Bir az sonra yenidən cəhd et.",
    );
  if (mode === "login")
    return status === 401 || code === "INVALID_CREDENTIALS"
      ? t(
          "The email or password is not correct.",
          "Неверный email или пароль.",
          "Email və ya şifrə düzgün deyil.",
        )
      : t(
          "Could not sign in. Check your email and password.",
          "Не удалось войти. Проверьте email и пароль.",
          "Daxil olmaq mümkün olmadı. Email və şifrəni yoxla.",
        );
  if (status === 409 || code === "ACCOUNT_UNAVAILABLE")
    return t(
      "An account could not be created with this email. If you already have one, sign in or reset your password.",
      "Не удалось создать аккаунт с этим email. Если он у вас уже есть, войдите или сбросьте пароль.",
      "Bu email ilə hesab yaratmaq mümkün olmadı. Hesabın varsa, daxil ol və ya şifrəni yenilə.",
    );
  if (code === "PASSWORD_TOO_LONG")
    return t(
      "The password can be at most 72 characters.",
      "Пароль может содержать не более 72 символов.",
      "Şifrə ən çox 72 simvol ola bilər.",
    );
  return t(
    "Check your name, your email and a password of 12 to 72 characters.",
    "Проверьте имя, email и пароль длиной от 12 до 72 символов.",
    "Adı, emaili və 12–72 simvolluq şifrəni yoxla.",
  );
}
