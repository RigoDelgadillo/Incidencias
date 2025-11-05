
import { Link, useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputForm from "@/components/InputForm";
import { supabase } from "@/utils/supabase";
import { useState } from "react";

export default function registerScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const handleRegister = async () => {
  // Validaciones
  const nombreTrim = nombre.trim();
  const apellidoTrim = apellido.trim();
  const telefonoTrim = telefono.trim();
  const emailClean = email.toLowerCase().trim();
  const passwordTrim = password.trim();

  if (!nombreTrim || !apellidoTrim || !telefonoTrim || !emailClean || !passwordTrim) {
    Alert.alert("Error", "Completa todos los campos obligatorios.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailClean)) {
    Alert.alert("Error", "Por favor ingresa un email válido.");
    return;
  }

  if (passwordTrim.length < 6) {
    Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  try {
    setLoading(true);

    // 1) Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailClean,
      password: passwordTrim,
    });
    if (authError) throw authError;
    if (!authData?.user?.id) throw new Error("No se pudo crear el usuario en Auth.");

    const userId = authData.user.id;

    // Insertar o actualizar perfil en 'usuarios' (usar onConflict, no usar 'returning')
    const { error: upsertError } = await supabase
      .from("usuarios")
      .upsert(
        [
          {
            id_usuario: userId,
            nombre: nombreTrim,
            apellido: apellidoTrim,
            telefono: telefonoTrim,
            email: emailClean,
            id_rol: 2,
          },
        ],
        { onConflict: "id_usuario" }
      );

    if (upsertError) {
      console.error("Error upsert usuarios:", upsertError);
      await supabase.auth.signOut();
      throw upsertError;
    }

    Alert.alert("Registro exitoso");
    router.push("/(auth)/login");
  } catch (err: any) {
    console.error("Error completo:", err);
    Alert.alert("Error al registrar", err?.message || "Ocurrió un error durante el registro");
  } finally {
    setLoading(false);
  }
};

  return (
    <View className="mx-auto mt-16">
      <Text
        className="text-center text-4xl font-Inter-Bold mt-10
      "
      >
        Bienvenido
      </Text>
      <Text className="text-center text-xl font-Inter-Medium color-textGray mb-10">
        Registrate para continuar
      </Text>

      {/* InputForm ahora recibe value y onChangeText */}
      <InputForm placeholder="Escribe tu nombre" label="Nombre" value={nombre} onChangeText={setNombre} />
      <InputForm placeholder="Escribe tu apellido" label="Apellido" value={apellido} onChangeText={setApellido} />
      <InputForm
        placeholder="Escribe tu numero de telefono"
        label="Telefono"
        isNumber={true}
        value={telefono}
        onChangeText={setTelefono}
      />
      <InputForm placeholder="Ejemplo@gmail.com" label="Email" value={email} onChangeText={setEmail} />
      <InputForm placeholder="Contraseña" label="Contraseña" secure={true} value={password} onChangeText={setPassword} />

      <Link className="mt-12 mb-12" href="/(auth)/login">
        <Text className="font-Inter-Medium color-primary text-md  text-right underline">
          Ya tienes cuenta? Inicia sesión
        </Text>
      </Link>

      <CustomButton label={loading ? "Registrando..." : "Registrarse"} onPress={handleRegister}/>
    </View>
  );
}
