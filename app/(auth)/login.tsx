import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputForm from "@/components/InputForm";
import { supabase } from "@/utils/supabase";

export default function loginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const emailClean = email.toLowerCase().trim();
    const passwordTrim = password.trim();

    if (!emailClean || !passwordTrim) {
      Alert.alert("Error", "Completa todos los campos obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      Alert.alert("Error", "Ingresa un email válido.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password: passwordTrim,
      });

      if (error) throw error;
      // Si el login es exitoso redirige a (user)
      if (data?.user) {
        router.replace("/(user)");
      } else {
        Alert.alert("Error", "No se pudo iniciar sesión.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert("Error al iniciar sesión", err?.message ?? "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="mx-auto mt-16">
      <Image
        source={require("../../assets/images/logo.png")}
        className="w-72 h-20 mx-auto"
      />

      <Text className="text-center text-4xl font-Inter-Bold mt-24">
        Bienvenido
      </Text>
      <Text className="text-center text-xl font-Inter-Medium color-textGray mb-10">
        Inicia sesión para continuar
      </Text>

      <InputForm
        placeholder="Ejemplo@gmail.com"
        label="Email"
        value={email}
        onChangeText={setEmail}
      />
      <InputForm
        placeholder="Contraseña"
        label="Contraseña"
        secure={true}
        value={password}
        onChangeText={setPassword}
      />

      <Link className="mt-5 mb-12" href="/(auth)/register">
        <Text className="font-Inter-Medium color-primary text-md  text-right underline">
          No tienes cuenta? Registrate
        </Text>
      </Link>

      <CustomButton
        label={loading ? "Iniciando..." : "Iniciar Sesión"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}