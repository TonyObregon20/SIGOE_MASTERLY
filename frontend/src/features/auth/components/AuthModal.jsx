import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUsersApi } from "@/features/users/usersApi";
import { getGoogleConfigApi } from "../authApi";
import { ShopButton, ShopField, ShopLink, ShopModal, shopInput } from '@/components/shop/ShopUI';

function AuthModal({
  isOpen,
  onClose,
  loginMode,
  setLoginMode,
  setUsers,
  setView
}) {
  const {
    login,
    register,
    googleLogin,
    requestPasswordReset,
    verifyPasswordResetCode,
    resetPassword
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authView, setAuthView] = useState(loginMode === "login" ? "login" : "register");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const googleButtonRef = useRef(null);

  useEffect(() => {
    setAuthView(loginMode === "login" ? "login" : "register");
  }, [loginMode]);

  useEffect(() => {
    if (!isOpen || (authView !== "login" && authView !== "register")) return;
    let cancelled = false;

    const initializeGoogle = async () => {
      const config = await getGoogleConfigApi();
      if (cancelled || !config?.success || !config.clientId || !googleButtonRef.current) return;

      const initialize = () => {
        if (!window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: async ({ credential }) => {
            const data = await googleLogin(credential);
            if (data?.success) {
              onClose();
              if (typeof setUsers === "function") {
                const uList = await getUsersApi();
                if (Array.isArray(uList)) setUsers(uList);
              }
              setView(["admin", "worker"].includes(data.user?.role) ? "admin" : "store");
            } else {
              alert(data?.message || "No se pudo iniciar sesión con Google");
            }
          }
        });
        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 380,
          locale: "es"
        });
      };

      if (window.google?.accounts?.id) {
        initialize();
        return;
      }

      let script = document.querySelector('script[data-google-identity]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", initialize, { once: true });
    };

    initializeGoogle();
    return () => {
      cancelled = true;
    };
  }, [isOpen, authView, googleLogin, onClose, setUsers, setView]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    try {
      const data = authView === "login"
        ? await login(email, password)
        : await register(name, email, password);

      if (data.success) {
        onClose();

        // Refetch users list if setUsers provided
        if (typeof setUsers === "function") {
          const uList = await getUsersApi();
          if (Array.isArray(uList)) setUsers(uList);
        }

        if (["admin", "worker"].includes(data.user?.role)) {
          setView("admin");
        } else {
          setView("store");
        }
      } else {
        alert(data.message || "Error al autenticar");
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Error de conexión con el servidor");
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    const data = await requestPasswordReset(resetEmail);
    if (data?.success) setAuthView("reset-code");
    else alert(data?.message || "No se pudo enviar el código");
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    const data = await verifyPasswordResetCode(resetEmail, resetCode);
    if (data?.success) {
      setResetToken(data.resetToken);
      setAuthView("reset-password");
    } else {
      alert(data?.message || "Código incorrecto");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const data = await resetPassword(resetToken, resetPasswordValue);
    if (data?.success) {
      alert(data.message);
      setResetToken("");
      setResetCode("");
      setResetPasswordValue("");
      setAuthView("login");
    } else {
      alert(data?.message || "No se pudo actualizar la contraseña");
    }
  };

  const titles = {
    login: "Bienvenido de nuevo.",
    register: "Crea tu cuenta.",
    "reset-request": "Recupera tu contraseña.",
    "reset-code": "Verifica tu correo.",
    "reset-password": "Crea una contraseña nueva."
  };

  return (
    <ShopModal title={titles[authView]} eyebrow="Tu cuenta Masterly" onClose={onClose}>
      <div className="p-6 sm:p-7">
        {(authView === "login" || authView === "register") && (
          <>
            <p className="mb-6 text-sm leading-7 text-shop-muted">
              {authView === "login"
                ? "Accede a tus pedidos y continúa con tu selección."
                : "Guarda tus pedidos y encuentra tus próximas favoritas."}
            </p>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {authView === "register" && <ShopField label="Nombre completo">{id => <input id={id} name="name" type="text" autoComplete="name" required className={shopInput} />}</ShopField>}
              <ShopField label="Correo electrónico">{id => <input id={id} name="email" type="email" autoComplete="email" required className={shopInput} />}</ShopField>
              <ShopField label="Contraseña">{id => (
                <div className="relative">
                  <input
                    id={id}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={authView === "login" ? "current-password" : "new-password"}
                    required
                    minLength={authView === "register" ? 8 : undefined}
                    className={`${shopInput} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-shop-muted transition-colors hover:text-shop-ink" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>
                    {showPassword ? <Eye size={19} /> : <EyeOff size={19} />}
                  </button>
                </div>
              )}</ShopField>
              {authView === "login" && (
                <div className="text-right">
                  <ShopLink onClick={() => { setResetEmail(""); setAuthView("reset-request"); }}>¿Olvidaste tu contraseña?</ShopLink>
                </div>
              )}
              <ShopButton type="submit" className="w-full">{authView === "login" ? "Iniciar sesión" : "Crear cuenta"}</ShopButton>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] text-shop-muted">
              <span className="h-px flex-1 bg-shop-line" />
              <span>O continúa con</span>
              <span className="h-px flex-1 bg-shop-line" />
            </div>
            <div ref={googleButtonRef} className="flex min-h-11 w-full justify-center overflow-hidden" />

            <div className="mt-6 border-t border-shop-line pt-5 text-center text-xs text-shop-muted">
              <p className="mb-2">{authView === "login" ? "¿Aún no tienes cuenta?" : "¿Ya tienes una cuenta?"}</p>
              <ShopLink onClick={() => { setShowPassword(false); setAuthView(authView === "login" ? "register" : "login"); }}>
                {authView === "login" ? "Crear mi cuenta" : "Iniciar sesión"}
              </ShopLink>
            </div>
          </>
        )}

        {authView === "reset-request" && (
          <form className="space-y-5" onSubmit={handleRequestReset}>
            <p className="text-sm leading-7 text-shop-muted">Ingresa el correo asociado a tu cuenta. Te enviaremos un código de 6 dígitos.</p>
            <ShopField label="Correo electrónico">{id => <input id={id} type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} autoComplete="email" required className={shopInput} />}</ShopField>
            <ShopButton type="submit" className="w-full">Enviar código</ShopButton>
            <div className="text-center"><ShopLink onClick={() => setAuthView("login")}>Volver a iniciar sesión</ShopLink></div>
          </form>
        )}

        {authView === "reset-code" && (
          <form className="space-y-5" onSubmit={handleVerifyResetCode}>
            <p className="text-sm leading-7 text-shop-muted">Ingresa el código enviado a <strong>{resetEmail}</strong>.</p>
            <ShopField label="Código de 6 dígitos">{id => <input id={id} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, ""))} required className={`${shopInput} text-center text-xl tracking-[0.5em]`} />}</ShopField>
            <ShopButton type="submit" className="w-full">Verificar código</ShopButton>
            <div className="text-center"><ShopLink onClick={() => setAuthView("reset-request")}>Reenviar o cambiar correo</ShopLink></div>
          </form>
        )}

        {authView === "reset-password" && (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <ShopField label="Nueva contraseña">{id => <input id={id} type={showPassword ? "text" : "password"} value={resetPasswordValue} onChange={(event) => setResetPasswordValue(event.target.value)} minLength={8} required className={`${shopInput} pr-12`} />}</ShopField>
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="text-xs text-shop-blue" aria-pressed={showPassword}>
              {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            </button>
            <ShopButton type="submit" className="w-full">Guardar contraseña</ShopButton>
          </form>
        )}
      </div>
    </ShopModal>
  );
}

export default AuthModal;
