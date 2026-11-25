import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUsersApi } from "@/features/users/usersApi";
import { ShopButton, ShopField, ShopLink, ShopModal, shopInput } from '@/components/shop/ShopUI';

function AuthModal({
  isOpen,
  onClose,
  loginMode,
  setLoginMode,
  setUsers,
  setView
}) {
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) setShowPassword(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    try {
      const data = loginMode === "login"
        ? await login(email, password)
        : await register(name, email, password);

      if (data.success) {
        onClose();

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

  return (
    <ShopModal title={loginMode === 'login' ? 'Bienvenido de nuevo.' : 'Crea tu cuenta.'} eyebrow="Tu cuenta Masterly" onClose={onClose}>
      <div className="p-6 sm:p-7">
        <p className="mb-6 text-sm leading-7 text-shop-muted">
          {loginMode === 'login'
            ? 'Accede a tus pedidos y continúa con tu selección.'
            : 'Guarda tus pedidos y encuentra tus próximas favoritas.'}
        </p>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {loginMode === 'register' && (
            <ShopField label="Nombre completo">
              {id => <input id={id} name="name" type="text" autoComplete="name" required className={shopInput} />}
            </ShopField>
          )}
          <ShopField label="Correo electrónico">
            {id => <input id={id} name="email" type="email" autoComplete="email" required className={shopInput} />}
          </ShopField>
          <ShopField label="Contraseña">
            {id => (
              <div className="relative">
                <input
                  id={id}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={loginMode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={loginMode === 'register' ? 8 : undefined}
                  className={`${shopInput} pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-shop-muted transition-colors hover:text-shop-ink"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <Eye size={19} /> : <EyeOff size={19} />}
                </button>
              </div>
            )}
          </ShopField>
          <ShopButton type="submit" className="w-full">
            {loginMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </ShopButton>
        </form>
        <div className="mt-6 border-t border-shop-line pt-5 text-center text-xs text-shop-muted">
          <p className="mb-2">{loginMode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}</p>
          <ShopLink onClick={() => { setShowPassword(false); setLoginMode(loginMode === 'login' ? 'register' : 'login'); }}>
            {loginMode === 'login' ? 'Crear mi cuenta' : 'Iniciar sesión'}
          </ShopLink>
        </div>
      </div>
    </ShopModal>
  );
}

export default AuthModal;