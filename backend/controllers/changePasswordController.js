// Dependencies are injected so password changes can be tested without a database.
export function createChangePasswordHandler({ comparePassword, hashPassword, UserModel }) {
  return async (req, res, next) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body || {};
      const fail = (status, field, message) => res.status(status).json({ success: false, field, message });
      const user = req.currentUser;
      if (!user || user.role !== "admin") {
        return fail(403, "", "Solo el administrador puede cambiar su propia contraseña aquí.");
      }
      if (typeof currentPassword !== "string" || !currentPassword) {
        return fail(400, "currentPassword", "Ingresa tu contraseña actual.");
      }
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return fail(400, "newPassword", "La nueva contraseña debe tener al menos 8 caracteres.");
      }
      if (Buffer.byteLength(newPassword, "utf8") > 72) {
        return fail(400, "newPassword", "La contraseña es demasiado larga. Elige una más corta.");
      }
      if (newPassword !== confirmPassword) {
        return fail(400, "confirmPassword", "Las contraseñas no coinciden.");
      }
      if (!user.password || !(await comparePassword(currentPassword, user.password))) {
        return fail(400, "currentPassword", "La contraseña actual es incorrecta.");
      }
      if (newPassword === currentPassword) {
        return fail(400, "newPassword", "Elige una contraseña diferente a la actual.");
      }
      const password = await hashPassword(newPassword);
      // Use only the authenticated identity and reject a concurrent password change.
      const result = await UserModel.updateOne(
        { id: user.id, password: user.password },
        { $set: { password } }
      );
      if (!result.modifiedCount) {
        return fail(409, "currentPassword", "La contraseña cambió durante la operación. Inténtalo de nuevo.");
      }
      return res.json({ success: true, message: "Tu contraseña se actualizó correctamente." });
    } catch (error) {
      next(error);
    }
  };
}
